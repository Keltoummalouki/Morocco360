import { NextResponse } from 'next/server';

const IS_PROD = process.env.NODE_ENV === 'production';

// ── JWT helpers (Edge + Node compatible) ──────────────────

export interface JwtPayload {
  sub:   number;
  email: string;
  role:  string;
  exp:   number;
  iat:   number;
}

/**
 * Decode a JWT payload without signature verification.
 * Verification happens at the NestJS API on every protected request.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1];
    const padded  = segment.replace(/-/g, '+').replace(/_/g, '/');
    const json    = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

// ── Cookie helpers (server-side / route handlers) ─────────

/** Set access_token, refresh_token (httpOnly) and x-role (readable by middleware). */
export function setCookiesFromTokens(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  role: string,
): void {
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 15, // 15 min — matches JWT_ACCESS_EXPIRES_IN
  });

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 days — matches JWT_REFRESH_EXPIRES_IN
  });

  // Non-httpOnly: readable by middleware to determine role for routing.
  // Not trusted for API security — only for UI routing.
  response.cookies.set('x-role', role, {
    httpOnly: false,
    secure:   IS_PROD,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 15,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  for (const name of ['access_token', 'refresh_token', 'x-role']) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }
}
