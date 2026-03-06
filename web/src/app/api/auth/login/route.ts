import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt, setCookiesFromTokens } from '@/lib/auth-server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable. Is the server running?' }, { status: 503 });
  }

  if (!apiRes.ok) {
    const rawText = await apiRes.text();
    console.error('[login route] NestJS returned', apiRes.status, rawText);
    let err: Record<string, unknown> = {};
    try { err = JSON.parse(rawText); } catch { /* ignore */ }
    return NextResponse.json(
      { message: err.message ?? 'Invalid email or password.' },
      { status: apiRes.status },
    );
  }

  const { accessToken, refreshToken } = await apiRes.json();
  const payload = decodeJwt(accessToken);

  const response = NextResponse.json({
    role:  payload?.role  ?? null,
    email: payload?.email ?? null,
  });

  setCookiesFromTokens(response, accessToken, refreshToken, payload?.role ?? '');

  return response;
}
