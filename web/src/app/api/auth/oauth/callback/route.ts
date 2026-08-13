import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt, setCookiesFromTokens } from '@/lib/auth-server';
import { ROLE_HOME, type Role } from '@/lib/auth';
import { NONCE_COOKIE, safeRedirect } from '@/lib/oauth';

const API_URL = process.env.API_URL;

/**
 * Landing point after the NestJS social callback.
 *
 * The URL carries a single-use code, never a token. This handler pairs it with
 * the nonce cookie planted when the flow started — so a code lifted from a URL
 * is useless in any other browser — trades the two server-to-server for the real
 * token pair, and sets the same httpOnly cookies the password login does.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  if (!code) return failed(request, 'oauth_failed');
  if (!nonce) return failed(request, 'oauth_expired');

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/oauth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, nonce }),
      cache: 'no-store',
    });
  } catch {
    return failed(request, 'api_unavailable');
  }

  if (!apiRes.ok) {
    console.error('[oauth callback] exchange failed with', apiRes.status);
    return failed(request, 'oauth_failed');
  }

  const { accessToken, refreshToken } = await apiRes.json();
  const payload = decodeJwt(accessToken);
  const role = (payload?.role ?? '') as Role;

  const wanted = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  const destination =
    wanted && wanted !== '/dashboard' ? wanted : ROLE_HOME[role] ?? '/dashboard';

  const response = NextResponse.redirect(new URL(destination, request.url));
  setCookiesFromTokens(response, accessToken, refreshToken, role);
  clearNonce(response);
  return response;
}

function failed(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${reason}`, request.url),
  );
  clearNonce(response);
  return response;
}

/** The nonce is good for exactly one attempt, successful or not. */
function clearNonce(response: NextResponse) {
  response.cookies.set(NONCE_COOKIE, '', {
    maxAge: 0,
    path: '/api/auth/oauth',
  });
}
