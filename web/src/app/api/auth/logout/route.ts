import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth-server';

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;

  // Best-effort: tell the API to invalidate the refresh token hash.
  // We clear cookies regardless of whether the API call succeeds.
  if (accessToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {/* ignore */});
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
