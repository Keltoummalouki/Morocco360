import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
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
  orderId: number | null;
  transactionId: string | null;
  customer: { name: string; email: string };
  event: { title: string; date: Date | null } | null;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
}

// ── Invoice PDF ──────────────────────────────────────────────
/** A4 in PostScript points. */
const PAGE = { width: 595.28, height: 841.89 };
const M = 48;
const CONTENT_W = PAGE.width - M * 2;
const RIGHT = PAGE.width - M;
/** Content stops here so the footer always has room. */
const PAGE_BOTTOM = PAGE.height - 96;

const ROW_H = 30;
const HEAD_H = 28;

/** Mirrors the light-mode design tokens in web/src/app/globals.css. */
const C = {
  ink: '#131A26',
  muted: '#414A5A',
  mutedDim: '#6E7686',
  primary: '#0B3D91',
  onDark: '#FFFFFF',
  onDarkDim: '#AFCCFF',
  highlight: '#00B8D9',
  surface: '#EEF3FA',
  zebra: '#F7FAFC',
  border: '#E1E7F0',
};

const STATUS_STYLE: Record<string, { label: string; fg: string; bg: string }> =
  {
    [PaymentStatus.PAID]: { label: 'Payée', fg: '#1E6B52', bg: '#E6F0EC' },
    [PaymentStatus.SUCCESS]: { label: 'Payée', fg: '#1E6B52', bg: '#E6F0EC' },
    [PaymentStatus.PENDING]: {
      label: 'En attente',
      fg: '#7B5800',
      bg: '#FDF3DC',
    },
    [PaymentStatus.NOT_PAID]: {
      label: 'Non payée',
      fg: '#AA131F',
      bg: '#F7E3E5',
    },
    [PaymentStatus.FAILED]: { label: 'Échouée', fg: '#AA131F', bg: '#F7E3E5' },
    [PaymentStatus.REFUNDED]: {
      label: 'Remboursée',
      fg: '#0B3D91',
      bg: '#E3ECF5',
    },
  };

const GATEWAY_LABEL: Record<string, string> = {
  STRIPE: 'Carte bancaire (Stripe)',
  PAYPAL: 'PayPal',
  BANK_CARD: 'Carte bancaire',
};

const STATUS_NOTE: Record<string, string> = {
  [PaymentStatus.PAID]: 'Réglée — merci de votre confiance.',
  [PaymentStatus.SUCCESS]: 'Réglée — merci de votre confiance.',
  [PaymentStatus.PENDING]: 'Paiement en cours de traitement.',
  [PaymentStatus.NOT_PAID]: 'Cette facture reste à régler.',
  [PaymentStatus.FAILED]: 'Le paiement a échoué — aucun montant prélevé.',
  [PaymentStatus.REFUNDED]: 'Montant remboursé au client.',
};

/**
 * The PDF standard fonts are WinAnsi-encoded, so characters outside Latin-1
 * have no glyph. `Intl` loves exotic spaces — fr-FR groups thousands with
 * U+202F — which would print as garbage. Fold them to a plain space.
 */
function safe(value: string): string {
  return value.replace(/[\u00A0\u2007\u2009\u202F]/g, ' ');
}

/** `2400` → `2 400,00 MAD` using separators the PDF fonts can render. */
function money(amount: number, currency: string): string {
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${amount < 0 ? '-' : ''}${grouped},${cents} ${currency}`;
}

function frDate(value: Date | string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return safe(
    date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  );
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async list(query: AdminPaymentsQueryDto): Promise<PaginatedResult<unknown>> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.order', 'o')
      .leftJoinAndSelect('o.user', 'u');

    if (query.status)
      qb.andWhere('p.status = :status', { status: query.status });
    if (query.gateway)
      qb.andWhere('p.gateway = :gateway', { gateway: query.gateway });
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

  async getInvoicePdf(
    id: number,
  ): Promise<{ buffer: Buffer; filename: string }> {
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
      orderId: order?.id ?? null,
      transactionId: payment.transaction_id ?? null,
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
        // margin 0 — the header band is full-bleed, so every block positions
        // itself explicitly against M / RIGHT instead of a text cursor.
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          bufferPages: true,
          info: {
            Title: `Facture ${invoice.invoiceNumber}`,
            Author: 'EventHub',
            Subject: `Facture ${invoice.invoiceNumber} — ${invoice.customer.name}`,
          },
        });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        this.drawHeader(doc, invoice);
        let y = this.drawParties(doc, invoice, 182);
        y = this.drawMeta(doc, invoice, y + 22);
        y = this.drawLineItems(doc, invoice, y + 28);
        this.drawTotals(doc, invoice, y + 18);
        this.drawFooters(doc, invoice);

        doc.end();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('PDF generation failed'));
      }
    });
  }

  /** Full-bleed brand band: wordmark left, invoice identity + status right. */
  private drawHeader(doc: PDFKit.PDFDocument, invoice: InvoiceData): void {
    doc.rect(0, 0, PAGE.width, 6).fill(C.highlight);
    doc.rect(0, 6, PAGE.width, 146).fill(C.primary);

    doc
      .fillColor(C.onDark)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('EventHub', M, 46);
    doc
      .fillColor(C.onDarkDim)
      .font('Helvetica')
      .fontSize(8.5)
      .text(safe('Billetterie événementielle · Maroc'), M, 79, {
        characterSpacing: 0.4,
      });

    doc
      .fillColor(C.highlight)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('FACTURE', M, 46, {
        width: CONTENT_W,
        align: 'right',
        characterSpacing: 2.4,
      });
    doc
      .fillColor(C.onDark)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(safe(invoice.invoiceNumber), M, 62, {
        width: CONTENT_W,
        align: 'right',
      });

    const style = STATUS_STYLE[invoice.status] ?? {
      label: invoice.status,
      fg: C.muted,
      bg: '#FFFFFF',
    };
    this.drawPill(doc, style.label, style.bg, style.fg, RIGHT, 90);
  }

  /** Rounded status chip, right-anchored at `rightX`. */
  private drawPill(
    doc: PDFKit.PDFDocument,
    label: string,
    bg: string,
    fg: string,
    rightX: number,
    y: number,
  ): void {
    const text = safe(label).toUpperCase();
    doc.font('Helvetica-Bold').fontSize(8);
    const w = doc.widthOfString(text, { characterSpacing: 1.2 }) + 26;
    const h = 20;
    doc.roundedRect(rightX - w, y, w, h, h / 2).fill(bg);
    doc.fillColor(fg).text(text, rightX - w, y + 6.5, {
      width: w,
      align: 'center',
      characterSpacing: 1.2,
    });
  }

  /** "Facturé à" and "Événement" cards, side by side. */
  private drawParties(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceData,
    y: number,
  ): number {
    const gap = 16;
    const w = (CONTENT_W - gap) / 2;
    const h = 88;

    this.drawCard(doc, M, y, w, h, C.primary, 'FACTURÉ À', {
      title: invoice.customer.name,
      sub: invoice.customer.email,
    });
    this.drawCard(doc, M + w + gap, y, w, h, C.highlight, 'ÉVÉNEMENT', {
      title: invoice.event?.title ?? '—',
      sub: invoice.event ? frDate(invoice.event.date) : '—',
    });
    return y + h;
  }

  private drawCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
    edge: string,
    label: string,
    body: { title: string; sub: string },
  ): void {
    doc.roundedRect(x, y, w, h, 7).fill(C.surface);
    doc.rect(x, y + 8, 3, h - 16).fill(edge);

    const px = x + 16;
    const pw = w - 30;
    doc
      .fillColor(C.mutedDim)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text(safe(label), px, y + 15, { width: pw, characterSpacing: 1.2 });
    doc
      .fillColor(C.ink)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(safe(body.title), px, y + 33, {
        width: pw,
        height: 28,
        lineGap: 1,
        ellipsis: true,
      });
    doc
      .fillColor(C.muted)
      .font('Helvetica')
      .fontSize(8.5)
      .text(safe(body.sub), px, y + 66, {
        width: pw,
        lineBreak: false,
        ellipsis: true,
      });
  }

  /** Four-column reference strip between hairlines. */
  private drawMeta(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceData,
    y: number,
  ): number {
    const items: [string, string][] = [
      ["DATE D'ÉMISSION", frDate(invoice.issuedAt)],
      ['COMMANDE', invoice.orderId ? `#${invoice.orderId}` : '—'],
      ['MOYEN DE PAIEMENT', GATEWAY_LABEL[invoice.gateway] ?? invoice.gateway],
      ['TRANSACTION', invoice.transactionId ?? '—'],
    ];
    const colW = CONTENT_W / items.length;

    doc
      .moveTo(M, y)
      .lineTo(RIGHT, y)
      .lineWidth(1)
      .strokeColor(C.border)
      .stroke();
    items.forEach(([label, value], i) => {
      const x = M + i * colW;
      doc
        .fillColor(C.mutedDim)
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .text(safe(label), x, y + 15, {
          width: colW - 12,
          characterSpacing: 1,
        });
      doc
        .fillColor(C.ink)
        .font('Helvetica')
        .fontSize(9)
        .text(safe(value), x, y + 28, {
          width: colW - 12,
          lineBreak: false,
          ellipsis: true,
        });
    });

    const bottom = y + 50;
    doc.moveTo(M, bottom).lineTo(RIGHT, bottom).strokeColor(C.border).stroke();
    return bottom;
  }

  private drawTableHead(doc: PDFKit.PDFDocument, y: number): number {
    doc.rect(M, y, CONTENT_W, HEAD_H).fill(C.primary);
    doc.fillColor(C.onDark).font('Helvetica-Bold').fontSize(7);
    const opts = { characterSpacing: 1 } as const;
    doc.text('DESCRIPTION', M + 14, y + 10.5, { width: 206, ...opts });
    doc.text('QTÉ', M + 220, y + 10.5, { width: 44, align: 'right', ...opts });
    doc.text('PRIX UNIT.', M + 270, y + 10.5, {
      width: 100,
      align: 'right',
      ...opts,
    });
    doc.text('TOTAL', M + 376, y + 10.5, {
      width: 109,
      align: 'right',
      ...opts,
    });
    return y + HEAD_H;
  }

  private drawLineItems(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceData,
    y: number,
  ): number {
    let cursor = this.drawTableHead(doc, y);

    if (invoice.lines.length === 0) {
      doc
        .fillColor(C.mutedDim)
        .font('Helvetica-Oblique')
        .fontSize(9)
        .text(
          safe('Aucun billet associé à cette commande.'),
          M + 14,
          cursor + 11,
          {
            width: CONTENT_W - 28,
          },
        );
      return cursor + ROW_H;
    }

    invoice.lines.forEach((line, i) => {
      if (cursor + ROW_H > PAGE_BOTTOM) {
        doc.addPage();
        cursor = this.drawTableHead(doc, M);
      }
      if (i % 2 === 1) doc.rect(M, cursor, CONTENT_W, ROW_H).fill(C.zebra);

      const textY = cursor + 10.5;
      doc
        .fillColor(C.ink)
        .font('Helvetica')
        .fontSize(9.5)
        .text(safe(line.description), M + 14, textY, {
          width: 206,
          lineBreak: false,
          ellipsis: true,
        });
      doc.fillColor(C.muted).text(String(line.quantity), M + 220, textY, {
        width: 44,
        align: 'right',
      });
      doc.text(money(line.unitPrice, invoice.currency), M + 270, textY, {
        width: 100,
        align: 'right',
      });
      doc
        .fillColor(C.ink)
        .font('Helvetica-Bold')
        .text(money(line.total, invoice.currency), M + 376, textY, {
          width: 109,
          align: 'right',
        });

      cursor += ROW_H;
      doc
        .moveTo(M, cursor)
        .lineTo(RIGHT, cursor)
        .lineWidth(0.5)
        .strokeColor(C.border)
        .stroke();
    });
    return cursor;
  }

  /** Subtotal line plus the emphasised total box, with a status note. */
  private drawTotals(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceData,
    y: number,
  ): void {
    let top = y;
    if (top + 88 > PAGE_BOTTOM) {
      doc.addPage();
      top = M;
    }
    const boxW = 240;
    const x = RIGHT - boxW;

    doc
      .fillColor(C.muted)
      .font('Helvetica')
      .fontSize(9.5)
      .text('Sous-total', x, top, { width: boxW - 120 });
    doc
      .fillColor(C.ink)
      .text(money(invoice.subtotal, invoice.currency), x, top, {
        width: boxW,
        align: 'right',
      });

    const boxY = top + 24;
    doc.roundedRect(x, boxY, boxW, 48, 8).fill(C.primary);
    doc
      .fillColor(C.onDarkDim)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('TOTAL À PAYER', x + 18, boxY + 19.5, { characterSpacing: 1.2 });
    doc
      .fillColor(C.onDark)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(money(invoice.total, invoice.currency), x, boxY + 15, {
        width: boxW - 18,
        align: 'right',
      });

    const note = STATUS_NOTE[invoice.status];
    if (note) {
      doc
        .fillColor(C.mutedDim)
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .text(safe(note), M, boxY + 20, { width: CONTENT_W - boxW - 24 });
    }
  }

  /** Written last so every buffered page gets the same rule + page numbers. */
  private drawFooters(doc: PDFKit.PDFDocument, invoice: InvoiceData): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const y = PAGE.height - 64;

      doc
        .moveTo(M, y)
        .lineTo(RIGHT, y)
        .lineWidth(1)
        .strokeColor(C.border)
        .stroke();
      doc
        .fillColor(C.mutedDim)
        .font('Helvetica')
        .fontSize(7.5)
        .text(
          safe('EventHub · Billetterie événementielle · Maroc'),
          M,
          y + 13,
          { width: CONTENT_W * 0.6, lineBreak: false },
        );
      doc.text(
        safe(`${invoice.invoiceNumber}  ·  Page ${i + 1} / ${range.count}`),
        M,
        y + 13,
        { width: CONTENT_W, align: 'right', lineBreak: false },
      );
      doc
        .fontSize(7)
        .text(
          safe('Document généré automatiquement — aucune signature requise.'),
          M,
          y + 26,
          { width: CONTENT_W, lineBreak: false },
        );
    }
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
