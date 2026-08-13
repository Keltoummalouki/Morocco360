import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  apiPublicUrl,
  isOAuthProvider,
  NONCE_COOKIE,
  nonceCookieOptions,
  safeRedirect,
} from '@/lib/oauth';

/**
 * Kicks off social sign-in.
 *
 * The OAuth dance is a chain of browser redirects, so unlike the other BFF
 * routes this one cannot proxy — it bounces the browser to the NestJS API on
 * its public URL. NestJS then sends it to the provider and, on the way back,
 * to `/api/auth/oauth/callback`.
 *
 * Before redirecting it plants a random nonce in an httpOnly cookie and hands
 * the API only its SHA-256 hash. The hash rides through the provider inside the
 * signed `state` and comes back inside the sign-in code, so the code can only be
 * redeemed by the browser that still holds the matching cookie. Without that
 * binding an attacker could run the flow themselves and feed the resulting
 * callback URL to a victim, silently signing them into the attacker's account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url),
    );
  }

  const nonce = randomBytes(32).toString('hex');

  const target = new URL(`/auth/${provider}`, apiPublicUrl());
  target.searchParams.set(
    'nonce',
    createHash('sha256').update(nonce).digest('hex'),
  );

  const redirect = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  if (redirect) target.searchParams.set('redirect', redirect);

  const response = NextResponse.redirect(target);
  response.cookies.set(NONCE_COOKIE, nonce, nonceCookieOptions());
  return response;
}
