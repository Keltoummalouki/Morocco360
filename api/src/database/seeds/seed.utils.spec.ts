import { ConfigService } from '@nestjs/config';
import { QRCodeService } from '../../tickets/qr-code.service';
import { buildQrPayload, daysFromNow } from './seed.utils';

const SECRET = 'test-secret-for-seed-utils';

describe('seed.utils', () => {
  describe('daysFromNow', () => {
    it('returns a future date for a positive offset', () => {
      expect(daysFromNow(2).getTime()).toBeGreaterThan(Date.now());
    });

    it('returns a past date for a negative offset', () => {
      expect(daysFromNow(-2).getTime()).toBeLessThan(Date.now());
    });

    it('is exactly N days away', () => {
      const diff = daysFromNow(5).getTime() - Date.now();
      expect(Math.round(diff / 86_400_000)).toBe(5);
    });
  });

  describe('buildQrPayload', () => {
    // Seeded tickets must be scannable for real, so the payload the seeder
    // writes has to satisfy the same verifier the scanner uses.
    const qrService = new QRCodeService({
      get: () => SECRET,
    } as unknown as ConfigService);

    it('produces a payload the runtime verifier accepts', () => {
      const qr = buildQrPayload(42, 7, SECRET);
      expect(qrService.verifyQRPayload(qr)).toEqual({
        ticketId: '42',
        eventId: '7',
      });
    });

    it('matches the runtime generator byte for byte', () => {
      expect(buildQrPayload(42, 7, SECRET)).toBe(
        qrService.generateQRPayload('42', '7'),
      );
    });

    it('is rejected when signed with a different secret', () => {
      expect(
        qrService.verifyQRPayload(buildQrPayload(42, 7, 'other')),
      ).toBeNull();
    });

    it('is rejected when the ticket id is tampered with', () => {
      const decoded = JSON.parse(
        Buffer.from(buildQrPayload(42, 7, SECRET), 'base64url').toString(
          'utf8',
        ),
      ) as Record<string, string>;
      const tampered = Buffer.from(
        JSON.stringify({ ...decoded, t: '43' }),
      ).toString('base64url');
      expect(qrService.verifyQRPayload(tampered)).toBeNull();
    });
  });
});
