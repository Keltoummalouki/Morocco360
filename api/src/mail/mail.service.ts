import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

import { Ticket } from '../orders/entities/ticket.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('MAIL_HOST', 'sandbox.smtp.mailtrap.io'),
      port: configService.get<number>('MAIL_PORT', 2525),
      auth: {
        user: configService.get<string>('MAIL_USER', ''),
        pass: configService.get<string>('MAIL_PASS', ''),
      },
    });
  }

  // ── Public: send confirmation email with single PDF attachment ──────
  async sendTickets(user: User, order: Order, tickets: Ticket[]): Promise<void> {
    try {
      const eventTitle = tickets[0]?.category?.event?.title ?? 'Evenement';
      const pdf = await this.generateOrderPdf(order, user, tickets);

      const from = this.configService.get<string>('MAIL_FROM', 'noreply@morocco360.ma');

      await this.transporter.sendMail({
        from: `Morocco360 <${from}>`,
        to: user.email,
        subject: `Confirmation de reservation — ${eventTitle}`,
        html: this.buildEmailHtml(user, order, tickets, this.configService.get<string>('FRONTEND_URL', 'http://localhost:4001')),
        attachments: [
          {
            filename: `billets-commande-${order.id}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Billets envoyes a ${user.email} pour la commande #${order.id}`);
    } catch (err) {
      this.logger.error(`Echec envoi email pour commande #${order.id}`, err);
    }
  }

  // ── Public: generate multi-page PDF (one page per ticket) ──────────
  async generateOrderPdf(order: Order, user: User, tickets: Ticket[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      void (async () => {
        try {
          const doc = new PDFDocument({ size: 'A6', margin: 24, autoFirstPage: false });
          const chunks: Buffer[] = [];

          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);

          for (const ticket of tickets) {
            doc.addPage();
            await this.renderTicketPage(doc, ticket, order, user);
          }

          doc.end();
        } catch (err) {
          reject(err);
        }
      })();
    });
  }

  // ── Private: render one ticket page into the document ──────────────
  private async renderTicketPage(
    doc: InstanceType<typeof PDFDocument>,
    ticket: Ticket,
    order: Order,
    user: User,
  ): Promise<void> {
    const qrBuffer = await QRCode.toBuffer(ticket.qr_code, { width: 220, margin: 1 });

    const category  = ticket.category;
    const event     = category?.event;
    const W         = doc.page.width;   // A6 ≈ 297pt
    const mx        = 28;               // horizontal margin
    const cW        = W - mx * 2;       // content width
    let   y         = 0;

    // ── Red header ──────────────────────────────────────────
    doc.rect(0, 0, W, 52).fill('#c0392b');
    doc.fontSize(17).fillColor('#ffffff')
       .text('Morocco360', 0, 14, { align: 'center', width: W });
    doc.fontSize(8).fillColor('rgba(255,255,255,0.8)')
       .text('Votre billet d\'entree', 0, 34, { align: 'center', width: W });

    y = 68;

    // ── Event title ─────────────────────────────────────────
    doc.fontSize(12).fillColor('#1a1a1a')
       .text(event?.title ?? '', mx, y, { align: 'center', width: cW });
    y += 20;

    // ── Date & Location ─────────────────────────────────────
    doc.fontSize(8).fillColor('#666');
    if (event?.date_start) {
      const d = new Date(event.date_start).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      doc.text(`Date : ${d}`, mx, y, { align: 'center', width: cW });
      y += 13;
    }
    if (event?.location_name) {
      const loc = event.city ? `${event.location_name}, ${event.city}` : event.location_name;
      doc.text(`Lieu : ${loc}`, mx, y, { align: 'center', width: cW });
      y += 13;
    }

    y += 8;

    // ── Separator ───────────────────────────────────────────
    doc.moveTo(mx, y).lineTo(W - mx, y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    y += 12;

    // ── Ticket details ──────────────────────────────────────
    doc.fontSize(8.5).fillColor('#333');
    doc.text(`Categorie : ${category?.name ?? ''}`, mx, y, { align: 'center', width: cW });
    y += 13;
    const priceLabel = Number(category?.price) === 0 ? 'Gratuit' : `${String(category?.price)} MAD`;
    doc.text(`Prix : ${priceLabel}`, mx, y, { align: 'center', width: cW });
    y += 13;
    doc.text(`Titulaire : ${user.full_name ?? user.username}`, mx, y, { align: 'center', width: cW });
    y += 18;

    // ── QR Code (centered, absolute Y) ─────────────────────
    const qrSize = 130;
    const qrX    = (W - qrSize) / 2;
    doc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });
    y += qrSize + 14;

    // ── Separator ───────────────────────────────────────────
    doc.moveTo(mx, y).lineTo(W - mx, y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    y += 8;

    // ── Reference ───────────────────────────────────────────
    doc.fontSize(6).fillColor('#aaa');
    doc.text(ticket.qr_code, mx, y, { align: 'center', width: cW });
    y += 9;
    doc.text(`Commande #${order.id}`, mx, y, { align: 'center', width: cW });
  }

  // ── Private: HTML email template ───────────────────────────────────
  private buildEmailHtml(user: User, order: Order, tickets: Ticket[], frontendUrl: string): string {
    const event      = tickets[0]?.category?.event;
    const eventTitle = event?.title ?? 'Evenement';
    const name       = user.full_name ?? user.username;
    const totalLabel = Number(order.total_amount) === 0 ? 'Gratuit' : `${Number(order.total_amount).toFixed(2)} MAD`;
    const category   = tickets[0]?.category?.name ?? '';

    const dateStr = event?.date_start
      ? new Date(event.date_start).toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : null;

    const location = event?.location_name
      ? (event.city ? `${event.location_name}, ${event.city}` : event.location_name)
      : null;

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#c0392b;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">Morocco360</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Votre plateforme d'evenements au Maroc</p>
          </td>
        </tr>

        <!-- Success badge -->
        <tr>
          <td style="padding:32px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#e8f5e9;border-radius:50px;padding:8px 20px;">
              <span style="color:#2e7d32;font-size:13px;font-weight:600;">Reservation confirmee</span>
            </div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;">Bonjour ${name},</h2>
            <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
              Merci pour votre reservation ! Votre billet pour
              <strong style="color:#1a1a1a;">${eventTitle}</strong>
              est disponible en piece jointe (PDF).
            </p>
          </td>
        </tr>

        <!-- Event info card -->
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f6;border:1px solid #f5c6c6;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="background:#c0392b;padding:12px 20px;">
                  <span style="color:#fff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Details de l'evenement</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1a1a1a;">${eventTitle}</p>
                  ${dateStr ? `<p style="margin:0 0 4px;font-size:13px;color:#555;">Date : ${dateStr}</p>` : ''}
                  ${location ? `<p style="margin:0 0 4px;font-size:13px;color:#555;">Lieu : ${location}</p>` : ''}
                  <p style="margin:4px 0 0;font-size:13px;color:#555;">Categorie : ${category}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Order summary -->
        <tr>
          <td style="padding:20px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
              <tr style="background:#f9f9f9;">
                <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;" colspan="2">Resume de la commande</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:14px;color:#555;border-top:1px solid #eee;">Numero de commande</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;border-top:1px solid #eee;">#${order.id}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:14px;color:#555;border-top:1px solid #eee;">Nombre de billets</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;border-top:1px solid #eee;">${tickets.length}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:14px;color:#555;border-top:1px solid #eee;">Montant total</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#c0392b;text-align:right;border-top:1px solid #eee;">${totalLabel}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Download button -->
        <tr>
          <td style="padding:24px 40px 0;text-align:center;">
            <a href="${frontendUrl}/api/payments/order/${order.id}/pdf"
               style="display:inline-block;background:#c0392b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;letter-spacing:0.5px;">
              Telecharger mes billets (PDF)
            </a>
          </td>
        </tr>

        <!-- Instructions -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#f0f7ff;border-left:4px solid #2196f3;border-radius:0 8px 8px 0;padding:14px 16px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1565c0;">Comment utiliser votre billet ?</p>
              <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                Ouvrez le fichier PDF en piece jointe et presentez le QR Code a l'entree de l'evenement.
                Chaque billet est nominatif et a usage unique.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f5;padding:80px 80px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">Morocco360 — Votre plateforme d'evenements au Maroc</p>
            <p style="margin:4px 0 0;font-size:11px;color:#bbb;">Cet email a ete envoye automatiquement, merci de ne pas y repondre.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
