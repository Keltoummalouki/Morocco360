import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import {
  Payment,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import { AdminPaymentsQueryDto } from './dto/admin-payment.dto';

const SORTABLE = {
  createdAt: 'p.created_at',
  amount: 'p.amount',
  status: 'p.status',
};

const PAID_STATES = [PaymentStatus.PAID, PaymentStatus.SUCCESS];

interface InvoiceLine {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  status: PaymentStatus;
  gateway: string;
  currency: string;
  customer: { name: string; email: string };
  event: { title: string; date: Date | null } | null;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async list(query: AdminPaymentsQueryDto): Promise<PaginatedResult<unknown>> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.order', 'o')
      .leftJoinAndSelect('o.user', 'u');

    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.gateway) qb.andWhere('p.gateway = :gateway', { gateway: query.gateway });
    if (query.dateFrom) {
      qb.andWhere('p.created_at >= :df', { df: new Date(query.dateFrom) });
    }
    if (query.dateTo) {
      qb.andWhere('p.created_at <= :dt', { dt: new Date(query.dateTo) });
    }
    if (query.search?.trim()) {
      qb.andWhere(
        `(p.transaction_id ILIKE :s OR p.invoice_number ILIKE :s
          OR CAST(o.id AS TEXT) ILIKE :s OR u.full_name ILIKE :s OR u.email ILIKE :s)`,
        { s: `%${query.search.trim()}%` },
      );
    }

    const result = await paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'p.created_at',
    });
    return {
      data: result.data.map((p) => this.toSummary(p)),
      meta: result.meta,
    };
  }

  async findOne(id: number): Promise<unknown> {
    const p = await this.loadFull(id);
    return {
      id: p.id,
      status: p.status,
      gateway: p.gateway,
      amount: p.amount,
      currency: p.currency,
      transaction_id: p.transaction_id,
      invoice_number: p.invoice_number,
      created_at: p.created_at,
      order: p.order
        ? {
            id: p.order.id,
            status: p.order.status,
            total_amount: p.order.total_amount,
            user: p.order.user
              ? {
                  id: p.order.user.id,
                  full_name: p.order.user.full_name,
                  email: p.order.user.email,
                }
              : null,
          }
        : null,
    };
  }

  async setStatus(id: number, status: PaymentStatus): Promise<unknown> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    payment.status = status;
    await this.paymentRepo.save(payment);

    // Keep the order roughly in sync with the payment state.
    if (payment.order) {
      if (PAID_STATES.includes(status)) payment.order.status = OrderStatus.PAID;
      else if (status === PaymentStatus.REFUNDED)
        payment.order.status = OrderStatus.REFUNDED;
      else if (status === PaymentStatus.FAILED)
        payment.order.status = OrderStatus.CANCELLED;
      await this.orderRepo.save(payment.order);
    }
    return this.findOne(id);
  }

  async getInvoice(id: number): Promise<InvoiceData> {
    const payment = await this.loadFull(id);
    return this.buildInvoice(payment);
  }

  async getInvoicePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const payment = await this.loadFull(id);
    const invoice = this.buildInvoice(payment);
    const buffer = await this.renderPdf(invoice);
    return { buffer, filename: `${invoice.invoiceNumber}.pdf` };
  }

  // ── Helpers ────────────────────────────────────────────────
  private async loadFull(id: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: [
        'order',
        'order.user',
        'order.tickets',
        'order.tickets.category',
        'order.tickets.event',
      ],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private buildInvoice(payment: Payment): InvoiceData {
    const order = payment.order;
    const tickets = order?.tickets ?? [];

    // Group tickets by category for invoice lines.
    const byCat = new Map<string, InvoiceLine>();
    for (const t of tickets) {
      const name = t.category?.name ?? 'Billet';
      const unit = Number(t.category?.price ?? 0);
      const line = byCat.get(name) ?? {
        description: name,
        unitPrice: unit,
        quantity: 0,
        total: 0,
      };
      line.quantity += 1;
      line.total = line.unitPrice * line.quantity;
      byCat.set(name, line);
    }
    const lines = [...byCat.values()];
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const event = tickets.find((t) => t.event)?.event ?? null;

    return {
      invoiceNumber:
        payment.invoice_number ??
        `INV-${new Date(payment.created_at).getFullYear()}-${String(payment.id).padStart(5, '0')}`,
      issuedAt: payment.created_at,
      status: payment.status,
      gateway: payment.gateway,
      currency: payment.currency,
      customer: {
        name: order?.user?.full_name ?? order?.user?.username ?? '—',
        email: order?.user?.email ?? '—',
      },
      event: event ? { title: event.title, date: event.date_start } : null,
      lines,
      subtotal,
      total: Number(payment.amount) || subtotal,
    };
  }

  private renderPdf(invoice: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(22).text('Morocco360', { continued: false });
        doc.fontSize(10).fillColor('#666').text('Facture / Invoice');
        doc.moveDown();

        doc.fillColor('#000').fontSize(12);
        doc.text(`Facture n°: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}`);
        doc.text(`Statut: ${invoice.status}`);
        doc.text(`Paiement: ${invoice.gateway}`);
        doc.moveDown();

        doc.text(`Client: ${invoice.customer.name}`);
        doc.text(`Email: ${invoice.customer.email}`);
        if (invoice.event) {
          doc.text(`Événement: ${invoice.event.title}`);
        }
        doc.moveDown();

        doc.fontSize(11).fillColor('#666').text('Détails');
        doc.fillColor('#000');
        for (const line of invoice.lines) {
          doc.text(
            `${line.description}  —  ${line.quantity} × ${line.unitPrice.toLocaleString('fr-FR')} = ${line.total.toLocaleString('fr-FR')} ${invoice.currency}`,
          );
        }
        doc.moveDown();
        doc
          .fontSize(14)
          .text(
            `Total: ${invoice.total.toLocaleString('fr-FR')} ${invoice.currency}`,
            { align: 'right' },
          );

        doc.end();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('PDF generation failed'));
      }
    });
  }

  private toSummary(p: Payment) {
    return {
      id: p.id,
      status: p.status,
      gateway: p.gateway,
      amount: p.amount,
      currency: p.currency,
      transaction_id: p.transaction_id,
      invoice_number: p.invoice_number,
      created_at: p.created_at,
      order_id: p.order?.id ?? null,
      customer: p.order?.user
        ? {
            id: p.order.user.id,
            full_name: p.order.user.full_name,
            email: p.order.user.email,
          }
        : null,
    };
  }
}
