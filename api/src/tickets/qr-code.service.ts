import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

interface QRPayloadEncoded {
  t: string;
  e: string;
  sig: string;
}

export interface QRPayloadDecoded {
  ticketId: string;
  eventId: string;
}

@Injectable()
export class QRCodeService {
  constructor(private readonly config: ConfigService) {}

  private get secret(): string {
    const s = this.config.get<string>('QR_HMAC_SECRET');
    if (!s)
      throw new InternalServerErrorException(
        'QR_HMAC_SECRET is not configured',
      );
    return s;
  }

  generateQRPayload(ticketId: string, eventId: string): string {
    const payload = JSON.stringify({ t: ticketId, e: eventId });
    const sig = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
    const encoded: QRPayloadEncoded = { t: ticketId, e: eventId, sig };
    return Buffer.from(JSON.stringify(encoded)).toString('base64url');
  }

  verifyQRPayload(qrCode: string): QRPayloadDecoded | null {
    try {
      const json = Buffer.from(qrCode, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as QRPayloadEncoded;
      if (!parsed.t || !parsed.e || !parsed.sig) return null;

      const payload = JSON.stringify({ t: parsed.t, e: parsed.e });
      const expected = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');

      const sigBuf = Buffer.from(parsed.sig, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (
        sigBuf.length !== expBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expBuf)
      ) {
        return null;
      }

      return { ticketId: parsed.t, eventId: parsed.e };
    } catch {
      return null;
    }
  }

  async generateQRImage(qrCode: string): Promise<string> {
    return QRCode.toDataURL(qrCode, { errorCorrectionLevel: 'H', width: 400 });
  }
}
