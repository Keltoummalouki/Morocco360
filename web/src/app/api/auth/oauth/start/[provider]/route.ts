import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  apiPublicUrlFor,
  isOAuthProvider,
  isStrandingRedirect,
  NONCE_COOKIE,
  nonceCookieOptions,
  requestHostname,
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
  if (!isOAuthProvider(provider)) return failed(request);

  const target = apiPublicUrlFor(`/auth/${provider}`);
  const host = requestHostname(
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    request.nextUrl.hostname,
  );

  // Refuse the redirect that would strand the user on their own machine rather
  // than performing it and failing confusingly two hops later.
  if (isStrandingRedirect(host, target)) {
    console.error(
      `[oauth] API_PUBLIC_URL is "${target.origin}" but this request came from ` +
        `"${host}". Set API_PUBLIC_URL to the public URL of the API, and ` +
        `register ${target.origin}/auth/${provider}/callback with the provider.`,
    );
    return failed(request);
  }

  const nonce = randomBytes(32).toString('hex');

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

/** Back to the login page with the generic reason, as the callback route does. */
function failed(request: NextRequest) {
  return NextResponse.redirect(
    new URL('/login?error=oauth_failed', request.url),
  );
}
