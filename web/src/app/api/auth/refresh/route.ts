import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt, setCookiesFromTokens, clearAuthCookies } from '@/lib/auth-server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/**
 * GET /api/auth/refresh?redirect=<path>
 * Called by middleware when the access token has expired.
 * Uses the httpOnly refresh_token cookie to obtain a new token pair.
 */
export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const redirectTo   = request.nextUrl.searchParams.get('redirect') ?? '/dashboard';

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  } catch {
    // API down — clear session, go to login
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearAuthCookies(res);
    return res;
  }

  if (!apiRes.ok) {
    // Refresh token is invalid/expired — force re-login
    const res = NextResponse.redirect(new URL('/login', request.url));
    clearAuthCookies(res);
    return res;
  }

  const { accessToken, refreshToken: newRefreshToken } = await apiRes.json();
  const payload = decodeJwt(accessToken);

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  setCookiesFromTokens(response, accessToken, newRefreshToken, payload?.role ?? '');
  return response;
}
