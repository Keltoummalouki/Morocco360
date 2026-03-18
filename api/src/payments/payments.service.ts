import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import Stripe from 'stripe';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';
import {
  Payment,
  PaymentGateway,
  PaymentStatus,
} from './entities/payment.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';

import * as QRCode from 'qrcode';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(TicketCategory)
    private categoryRepo: Repository<TicketCategory>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.stripe = new Stripe(
      configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
    this.frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4001',
    );
  }

  // ── Create Stripe Checkout Session ─────────────────────────
  async createCheckoutSession(dto: CreateCheckoutDto, userId: number) {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
      relations: ['event'],
    });
    if (!category)
      throw new NotFoundException('Catégorie de billet introuvable');
    if (!category.event.is_active)
      throw new BadRequestException("Cet événement n'est plus actif");
    if (category.event.is_sold_out)
      throw new BadRequestException('Cet événement est complet (sold out)');
    if (category.stock_remaining < dto.quantity) {
      throw new BadRequestException(
        `Seulement ${category.stock_remaining} place(s) disponible(s) pour cette catégorie`,
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const unitPrice = Number(category.price);
    const totalAmount = unitPrice * dto.quantity;

    // ── Billets gratuits — bypass Stripe, tout dans une transaction ──
    if (totalAmount === 0) {
      const result = await this.dataSource.transaction(async (em) => {
        // Re-vérification du stock sous verrou exclusif
        const lockedCategory = await em.findOne(TicketCategory, {
          where: { id: dto.categoryId },
          lock: { mode: 'pessimistic_write', tables: ['ticket_categories'] },
          relations: ['event'],
        });
        if (!lockedCategory || lockedCategory.stock_remaining < dto.quantity) {
          throw new BadRequestException(
            `Seulement ${lockedCategory?.stock_remaining ?? 0} place(s) disponible(s)`,
          );
        }

        // Décrémentation atomique
        await em.decrement(
          TicketCategory,
          { id: dto.categoryId },
          'stock_remaining',
          dto.quantity,
        );

        const order = em.create(Order, {
          user,
          total_amount: 0,
          status: OrderStatus.PAID,
        });
        const savedOrder = await em.save(order);

        await this.createTicketsInTransaction(
          em,
          savedOrder,
          lockedCategory,
          dto.quantity,
        );
        await this.checkAndMarkSoldOut(em, lockedCategory.event.id);

        return {
          url: `${this.frontendUrl}/payment/success?order_id=${savedOrder.id}`,
          orderId: savedOrder.id,
        };
      });

      void this.sendTicketEmails(result.orderId);
      return { url: result.url };
    }

    // ── Billets payants — Stripe Checkout ─────────────────────
    const order = this.orderRepo.create({
      user,
      total_amount: totalAmount,
      status: OrderStatus.PENDING,
    });
    const savedOrder = await this.orderRepo.save(order);

    const payment = this.paymentRepo.create({
      gateway: PaymentGateway.STRIPE,
      amount: totalAmount,
      currency: 'MAD',
      status: PaymentStatus.PENDING,
      order: savedOrder,
    });
    await this.paymentRepo.save(payment);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mad',
            product_data: {
              name: `${category.event.title} — ${category.name}`,
              description: category.event.description?.slice(0, 200),
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: dto.quantity,
        },
      ],
      mode: 'payment',
      client_reference_id: String(savedOrder.id),
      success_url: `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/payment/cancel?order_id=${savedOrder.id}`,
      metadata: {
        order_id: String(savedOrder.id),
        category_id: String(category.id),
        quantity: String(dto.quantity),
        user_id: String(userId),
      },
    });

    await this.orderRepo.update(savedOrder.id, {
      payment_gateway_ref: session.id,
    });

    return { url: session.url, sessionId: session.id };
  }

  // ── Stripe Webhook ─────────────────────────────────────────
  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      await this.handleSessionCompleted(event.data.object);
    } else if (event.type === 'checkout.session.expired') {
      await this.handleSessionExpired(event.data.object);
    }

    return { received: true };
  }

  // ── Traitement session complétée (idempotent, transactionnel) ──
  private async handleSessionCompleted(session: Stripe.Checkout.Session) {
    const orderId = Number(session.client_reference_id);
    const categoryId = Number(session.metadata?.category_id);
    const quantity = Number(session.metadata?.quantity ?? 1);

    await this.dataSource.transaction(async (em) => {
      // 1. Verrouiller la commande — vérification idempotence
      const order = await em.findOne(Order, {
        where: { id: orderId },
        relations: ['payment'],
        lock: { mode: 'pessimistic_write', tables: ['orders'] },
      });
      if (!order) return;
      // Déjà traité (webhook rejoué) → on ignore
      if (order.status === OrderStatus.PAID) return;

      // 2. Verrouiller la catégorie pour mise à jour atomique du stock
      const category = await em.findOne(TicketCategory, {
        where: { id: categoryId },
        relations: ['event'],
        lock: { mode: 'pessimistic_write', tables: ['ticket_categories'] },
      });
      if (!category) return;

      // 3. Vérification finale du stock (sécurité contre la concurrence)
      if (category.stock_remaining < quantity) {
        console.error(
          `[PaymentsService] STOCK INSUFFISANT — orderId=${orderId}, ` +
            `demandé=${quantity}, restant=${category.stock_remaining}. Révision manuelle requise.`,
        );
        // Le paiement a déjà eu lieu : marquer la commande payée sans créer les billets
        // pour traitement manuel par l'admin
        await em.update(Order, orderId, { status: OrderStatus.PAID });
        if (order.payment) {
          await em.update(Payment, order.payment.id, {
            status: PaymentStatus.SUCCESS,
            transaction_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent?.id ?? ''),
          });
        }
        return;
      }

      // 4. Décrémentation atomique du stock restant
      await em.decrement(
        TicketCategory,
        { id: categoryId },
        'stock_remaining',
        quantity,
      );

      // 5. Mise à jour commande et paiement
      await em.update(Order, orderId, { status: OrderStatus.PAID });
      if (order.payment) {
        await em.update(Payment, order.payment.id, {
          status: PaymentStatus.SUCCESS,
          transaction_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? ''),
        });
      }

      // 6. Création des billets
      await this.createTicketsInTransaction(em, order, category, quantity);

      // 7. Marquer l'événement sold_out si plus aucune place disponible
      await this.checkAndMarkSoldOut(em, category.event.id);
    });

    void this.sendTicketEmails(orderId);
  }

  private async handleSessionExpired(session: Stripe.Checkout.Session) {
    const orderId = Number(session.client_reference_id);
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });
    if (!order) return;

    await this.orderRepo.update(orderId, { status: OrderStatus.CANCELLED });
    if (order.payment) {
      await this.paymentRepo.update(order.payment.id, {
        status: PaymentStatus.FAILED,
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private async createTicketsInTransaction(
    em: EntityManager,
    order: Order,
    category: TicketCategory,
    quantity: number,
  ) {
    for (let i = 0; i < quantity; i++) {
      const qrCode = [
        'TKT',
        order.id,
        category.id,
        i,
        Date.now().toString(36).toUpperCase(),
        Math.random().toString(36).slice(2, 7).toUpperCase(),
      ].join('-');

      const ticket = em.create(Ticket, {
        qr_code: qrCode,
        status: TicketStatus.VALID,
        order,
        category,
      });
      await em.save(ticket);
    }
  }

  /**
   * Vérifie si toutes les catégories de l'événement sont épuisées.
   * Si oui, marque l'événement comme sold_out.
   */
  async getOrderPdf(orderId: number): Promise<Buffer | null> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'user',
        'tickets',
        'tickets.category',
        'tickets.category.event',
      ],
    });
    if (!order || !order.tickets?.length) return null;
    return this.mailService.generateOrderPdf(order, order.user, order.tickets);
  }

  async getSuccessInfo(params: { sessionId?: string; orderId?: string }) {
    let order: Order | null = null;

    if (params.orderId) {
      order = await this.orderRepo.findOne({
        where: { id: Number(params.orderId) },
        relations: ['tickets', 'tickets.category', 'tickets.category.event'],
      });
    } else if (params.sessionId) {
      order = await this.orderRepo.findOne({
        where: { payment_gateway_ref: params.sessionId },
        relations: ['tickets', 'tickets.category', 'tickets.category.event'],
      });
    }

    if (!order) return null;

    const tickets = await Promise.all(
      (order.tickets ?? []).map(async (t) => ({
        id: t.id,
        qrCode: t.qr_code,
        qrDataUrl: await QRCode.toDataURL(t.qr_code, { width: 200, margin: 1 }),
        category: t.category?.name,
        event: t.category?.event?.title,
      })),
    );

    return {
      orderId: order.id,
      eventTitle: tickets[0]?.event ?? '',
      totalAmount: order.total_amount,
      tickets,
    };
  }

  private async sendTicketEmails(orderId: number): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'user',
        'tickets',
        'tickets.category',
        'tickets.category.event',
      ],
    });
    if (order?.user && order.tickets?.length) {
      await this.mailService.sendTickets(order.user, order, order.tickets);
    }
  }

  private async checkAndMarkSoldOut(em: EntityManager, eventId: number) {
    const categories = await em.find(TicketCategory, {
      where: { event: { id: eventId } },
      select: ['id', 'stock_remaining'],
    });
    const isSoldOut =
      categories.length > 0 && categories.every((c) => c.stock_remaining <= 0);
    await em.update(Event, eventId, { is_sold_out: isSoldOut });
  }
}
