import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt, setCookiesFromTokens } from '@/lib/auth-server';

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable. Is the server running?' }, { status: 503 });
  }

  if (!apiRes.ok) {
    const err = await apiRes.json().catch(() => ({}));
    // NestJS validation errors come as an array in err.message
    const message = Array.isArray(err.message)
      ? err.message.join(' ')
      : (err.message ?? 'Registration failed.');
    return NextResponse.json({ message }, { status: apiRes.status });
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
