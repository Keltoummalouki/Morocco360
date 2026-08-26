import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../../events/entities/event-staff.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { Ticket, TicketStatus } from '../../orders/entities/ticket.entity';
import {
  Payment,
  PaymentGateway,
  PaymentStatus,
} from '../../payments/entities/payment.entity';
import {
  QRScanLog,
  ScanResult,
} from '../../scanner/entities/qr-scan-log.entity';
import { buildQrPayload, daysFromNow } from './seed.utils';

interface SeedBooking {
  /** Buyer email. */
  user: string;
  /** Event title. */
  event: string;
  /** Ticket category name inside that event. */
  category: string;
  quantity: number;
  days_ago: number;
  order_status: OrderStatus;
  gateway: PaymentGateway;
  payment_status: PaymentStatus;
  /** Status applied to the tickets that were not checked in. */
  ticket_status: TicketStatus;
  /** How many of the tickets were scanned at the gate. */
  checked_in?: number;
}

const TEST_USER = 'user@eventhub.com';

/**
 * Covers every order / payment / ticket status the dashboards can filter on,
 * spread over several buyers, events and dates.
 */
const SEED_BOOKINGS: SeedBooking[] = [
  // ── Main test account ────────────────────────────────────────────────────
  {
    user: TEST_USER,
    event: 'Atlas Electronic',
    category: 'Pass 3 jours',
    quantity: 4,
    days_ago: 6,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: TEST_USER,
    event: 'Marrakech Jazz Festival',
    category: 'VIP',
    quantity: 2,
    days_ago: 10,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: TEST_USER,
    event: 'Marrakech du Rire',
    category: 'Carre prestige',
    quantity: 3,
    days_ago: 25,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.BANK_CARD,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 2,
  },
  {
    user: TEST_USER,
    event: 'Mawazine — Rythmes du Monde',
    category: 'Tribune OLM',
    quantity: 2,
    days_ago: 2,
    order_status: OrderStatus.PENDING,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PENDING,
    ticket_status: TicketStatus.PENDING,
  },
  {
    user: TEST_USER,
    event: 'Tanjazz — Festival International de Jazz de Tanger',
    category: 'Entree soiree',
    quantity: 1,
    days_ago: 15,
    order_status: OrderStatus.CANCELLED,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.FAILED,
    ticket_status: TicketStatus.CANCELLED,
  },
  {
    user: TEST_USER,
    event: 'Rallye Aicha des Gazelles',
    category: 'Badge supporter',
    quantity: 2,
    days_ago: 45,
    order_status: OrderStatus.REFUNDED,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.REFUNDED,
    ticket_status: TicketStatus.REFUNDED,
  },
  {
    user: TEST_USER,
    event: "Festival des Roses de Kelaat M'Gouna",
    category: 'Entree festival',
    quantity: 2,
    days_ago: 70,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.PAYPAL,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 2,
  },

  // ── Other buyers ─────────────────────────────────────────────────────────
  {
    user: 'amine.tazi@example.ma',
    event: 'Atlas Electronic',
    category: 'Ticket jour',
    quantity: 2,
    days_ago: 5,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'amine.tazi@example.ma',
    event: 'Marrakech du Rire',
    category: 'Carre standard',
    quantity: 4,
    days_ago: 20,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 4,
  },
  {
    user: 'amine.tazi@example.ma',
    event: 'Gnaoua World Music Festival',
    category: 'Espace premium',
    quantity: 2,
    days_ago: 3,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.PAYPAL,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'sara.bennis@example.ma',
    event: 'Marrakech Jazz Festival',
    category: 'Entree generale',
    quantity: 3,
    days_ago: 8,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.BANK_CARD,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'sara.bennis@example.ma',
    event: 'Nuit du Patrimoine de Chefchaouen',
    category: 'Parcours + diner',
    quantity: 2,
    days_ago: 12,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'sara.bennis@example.ma',
    event: 'Rallye Aicha des Gazelles',
    category: 'Inscription equipage',
    quantity: 1,
    days_ago: 50,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 1,
  },
  {
    user: 'youssef.idrissi@example.ma',
    event: 'Marrakech du Rire',
    category: 'Loge VIP',
    quantity: 2,
    days_ago: 18,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 1,
  },
  {
    user: 'youssef.idrissi@example.ma',
    event: 'Mawazine — Rythmes du Monde',
    category: 'Carre or',
    quantity: 2,
    days_ago: 4,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'youssef.idrissi@example.ma',
    event: 'Festival du Cinema de Marrakech',
    category: 'Pass semaine',
    quantity: 1,
    days_ago: 1,
    order_status: OrderStatus.PENDING,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PENDING,
    ticket_status: TicketStatus.PENDING,
  },
  {
    user: 'imane.raji@example.ma',
    event: 'Atlas Electronic',
    category: 'Pass 3 jours + camping',
    quantity: 2,
    days_ago: 7,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.PAYPAL,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'imane.raji@example.ma',
    event: "Festival des Roses de Kelaat M'Gouna",
    category: 'Circuit vallee guide',
    quantity: 2,
    days_ago: 65,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.BANK_CARD,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
    checked_in: 2,
  },
  {
    user: 'karim.ouazzani@example.ma',
    event: 'Marathon des Sables',
    category: 'Inscription coureur',
    quantity: 1,
    days_ago: 9,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'karim.ouazzani@example.ma',
    event: 'Tanjazz — Festival International de Jazz de Tanger',
    category: 'Table VIP',
    quantity: 1,
    days_ago: 11,
    order_status: OrderStatus.SUSPENDED,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.SUSPENDED,
  },
  {
    user: 'nadia.fassi@example.ma',
    event: 'Festival des Musiques Sacrees de Fes',
    category: 'Pass festival complet',
    quantity: 2,
    days_ago: 13,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'nadia.fassi@example.ma',
    event: 'Gnaoua World Music Festival',
    category: 'Acces libre scene principale',
    quantity: 3,
    days_ago: 6,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'lucie.martin@example.fr',
    event: 'Marrakech Jazz Festival',
    category: 'Pass 3 jours',
    quantity: 2,
    days_ago: 14,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.SUCCESS,
    ticket_status: TicketStatus.VALID,
  },
  {
    user: 'lucie.martin@example.fr',
    event: 'Festival du Cinema de Marrakech',
    category: 'Seance unique',
    quantity: 2,
    days_ago: 5,
    order_status: OrderStatus.CANCELLED,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.NOT_PAID,
    ticket_status: TicketStatus.CANCELLED,
  },
  {
    user: 'suspended@eventhub.com',
    event: 'Marrakech du Rire',
    category: 'Carre standard',
    quantity: 1,
    days_ago: 22,
    order_status: OrderStatus.PAID,
    gateway: PaymentGateway.STRIPE,
    payment_status: PaymentStatus.PAID,
    ticket_status: TicketStatus.VALID,
  },
];

/** Wishlist entries: buyer email → event titles. */
const SEED_WISHLIST: Record<string, string[]> = {
  [TEST_USER]: [
    'Gnaoua World Music Festival',
    'Festival du Cinema de Marrakech',
    'Festival des Musiques Sacrees de Fes',
  ],
  'sara.bennis@example.ma': ['Atlas Electronic', 'Mawazine — Rythmes du Monde'],
  'amine.tazi@example.ma': [
    'Marathon des Sables',
    'Tanjazz — Festival International de Jazz de Tanger',
  ],
};

/** Orders that still hold inventory (the rest release their seats). */
const STOCK_HOLDING = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.SUSPENDED,
];

@Injectable()
export class CommerceSeeder {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(TicketCategory)
    private readonly categoryRepo: Repository<TicketCategory>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(QRScanLog)
    private readonly scanLogRepo: Repository<QRScanLog>,
  ) {}

  async seed(): Promise<void> {
    if ((await this.orderRepo.count()) > 0) {
      console.log('  [CommerceSeeder] Orders already seeded — skipping');
      return;
    }

    const secret = this.config.get<string>('QR_HMAC_SECRET');
    if (!secret) {
      throw new Error(
        'QR_HMAC_SECRET is not set — seeded tickets would not be scannable',
      );
    }

    const [users, events] = await Promise.all([
      this.userRepo.find(),
      this.eventRepo.find({ relations: ['categories'] }),
    ]);
    const userByEmail = new Map(users.map((u) => [u.email, u]));
    const eventByTitle = new Map(events.map((e) => [e.title, e]));

    let invoiceSeq = 1;
    for (const booking of SEED_BOOKINGS) {
      const user = userByEmail.get(booking.user);
      const event = eventByTitle.get(booking.event);
      const category = event?.categories.find(
        (c) => c.name === booking.category,
      );
      if (!user || !event || !category) {
        console.warn(
          `  [CommerceSeeder] Skipped booking ${booking.user} → ${booking.event} (missing user/event/category)`,
        );
        continue;
      }
      await this.seedBooking(
        booking,
        user,
        event,
        category,
        secret,
        invoiceSeq++,
      );
    }

    await this.seedExtraScanLogs();
    await this.seedWishlist(userByEmail, eventByTitle);
  }

  // ── Booking ────────────────────────────────────────────────────────────
  private async seedBooking(
    booking: SeedBooking,
    user: User,
    event: Event,
    category: TicketCategory,
    secret: string,
    invoiceSeq: number,
  ): Promise<void> {
    const createdAt = daysFromNow(-booking.days_ago);
    const unitPrice = Number(category.price);
    const total = unitPrice * booking.quantity;
    const isStripe = booking.gateway === PaymentGateway.STRIPE;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        user,
        total_amount: total,
        status: booking.order_status,
        payment_gateway_ref: isStripe
          ? `cs_test_seed_${event.id}_${invoiceSeq}`
          : undefined,
        created_at: createdAt,
      }),
    );

    await this.paymentRepo.save(
      this.paymentRepo.create({
        order,
        gateway: booking.gateway,
        amount: total,
        currency: 'MAD',
        status: booking.payment_status,
        transaction_id: `${isStripe ? 'pi_seed' : 'txn_seed'}_${invoiceSeq}`,
        invoice_number: `INV-${createdAt.getFullYear()}-${String(invoiceSeq).padStart(5, '0')}`,
        created_at: createdAt,
      }),
    );

    const scanner = await this.findScanner(event);
    const checkedIn = Math.min(booking.checked_in ?? 0, booking.quantity);
    // Gates open with the event, never on the purchase date.
    const checkInAt = new Date(event.date_start.getTime() + 3 * 3600 * 1000);

    for (let i = 0; i < booking.quantity; i++) {
      const checked = i < checkedIn;
      const ticket = await this.ticketRepo.save(
        this.ticketRepo.create({
          order,
          category,
          event,
          event_id: event.id,
          status: checked ? TicketStatus.CHECKED : booking.ticket_status,
          seat_number: `${category.name.slice(0, 1).toUpperCase()}-${String(
            invoiceSeq * 10 + i,
          ).padStart(3, '0')}`,
          checked_at: checked ? checkInAt : undefined,
          checked_by_user_id: checked ? scanner?.id : undefined,
          // Placeholder: the real payload needs the generated ticket id.
          qr_code: `seed-pending-${order.id}-${i}`,
        }),
      );
      await this.ticketRepo.update(ticket.id, {
        qr_code: buildQrPayload(ticket.id, event.id, secret),
      });

      if (checked && scanner) {
        await this.scanLogRepo.save(
          this.scanLogRepo.create({
            ticket_id: ticket.id,
            scanned_by_user_id: scanner.id,
            result: ScanResult.SUCCESS,
            device_info: 'Seed — Chrome on Android',
            scanned_at: checkInAt,
          }),
        );
      }
    }

    if (STOCK_HOLDING.includes(booking.order_status)) {
      await this.categoryRepo.decrement(
        { id: category.id },
        'stock_remaining',
        booking.quantity,
      );
    }

    console.log(
      `  [CommerceSeeder] ${booking.order_status} order #${order.id} — ${booking.quantity}× "${category.name}" for ${user.email}`,
    );
  }

  /** Prefers a gate agent; falls back to the organizer of the event. */
  private async findScanner(event: Event): Promise<User | null> {
    const entry =
      (await this.staffRepo.findOne({
        where: {
          event: { id: event.id },
          staff_role: EventStaffRole.STAFF,
        },
        relations: ['user'],
      })) ??
      (await this.staffRepo.findOne({
        where: { event: { id: event.id } },
        relations: ['user'],
      }));
    return entry?.user ?? null;
  }

  // ── Scan history ───────────────────────────────────────────────────────
  /** Failed scans so the audit log shows more than happy-path entries. */
  private async seedExtraScanLogs(): Promise<void> {
    const checked = await this.ticketRepo.find({
      where: { status: TicketStatus.CHECKED },
      take: 3,
      order: { id: 'ASC' },
    });
    const rejected = await this.ticketRepo.find({
      where: { status: In([TicketStatus.CANCELLED, TicketStatus.PENDING]) },
      take: 2,
      order: { id: 'ASC' },
    });

    const staff = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .where('r.name = :role', { role: 'STAFF' })
      .orderBy('u.id', 'ASC')
      .getOne();
    if (!staff) return;

    const extras: { ticket: Ticket; result: ScanResult }[] = [
      ...checked.map((ticket) => ({
        ticket,
        result: ScanResult.ALREADY_USED,
      })),
      ...rejected.map((ticket) => ({ ticket, result: ScanResult.INVALID })),
    ];
    if (checked[0]) {
      extras.push({ ticket: checked[0], result: ScanResult.WRONG_EVENT });
    }
    if (checked[1]) {
      extras.push({ ticket: checked[1], result: ScanResult.EXPIRED });
    }

    for (const { ticket, result } of extras) {
      await this.scanLogRepo.save(
        this.scanLogRepo.create({
          ticket_id: ticket.id,
          scanned_by_user_id: staff.id,
          result,
          device_info: 'Seed — Safari on iOS',
        }),
      );
    }
    console.log(
      `  [CommerceSeeder] Created ${extras.length} rejected scan logs`,
    );
  }

  // ── Wishlist ───────────────────────────────────────────────────────────
  private async seedWishlist(
    userByEmail: Map<string, User>,
    eventByTitle: Map<string, Event>,
  ): Promise<void> {
    for (const [email, titles] of Object.entries(SEED_WISHLIST)) {
      const user = userByEmail.get(email);
      if (!user) continue;

      const events = titles
        .map((t) => eventByTitle.get(t))
        .filter((e): e is Event => Boolean(e));
      if (events.length === 0) continue;

      await this.userRepo
        .createQueryBuilder()
        .relation(User, 'savedEvents')
        .of(user)
        .add(events);
      console.log(
        `  [CommerceSeeder] Saved ${events.length} events for ${email}`,
      );
    }
  }
}
