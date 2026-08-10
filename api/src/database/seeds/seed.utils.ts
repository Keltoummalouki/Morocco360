import * as crypto from 'crypto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date `offset` days from now — negative values are in the past. */
export function daysFromNow(offset: number): Date {
  return new Date(Date.now() + offset * DAY_MS);
}

/**
 * Same payload the runtime uses (see `QRCodeService`): base64url of
 * `{ t, e, sig }` where `sig` is the HMAC-SHA256 of `{ t, e }`. Seeded tickets
 * must be scannable for real, so the signature has to match production logic.
 */
export function buildQrPayload(
  ticketId: number,
  eventId: number,
  secret: string,
): string {
  const t = String(ticketId);
  const e = String(eventId);
  const sig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify({ t, e }))
    .digest('hex');
  return Buffer.from(JSON.stringify({ t, e, sig })).toString('base64url');
}
