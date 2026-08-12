import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL;

/**
 * Forwards an admin BFF request to the NestJS API, attaching the httpOnly
 * access-token cookie as a Bearer header. It mirrors the incoming method,
 * query string, and body, and passes the backend response straight back.
 *
 * Keeps every `web/src/app/api/admin/**` handler to a one-liner.
 */
export async function forwardToApi(
  backendPath: string,
  req: NextRequest,
): Promise<NextResponse> {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const method = req.method;
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
  const body = hasBody ? await req.text() : undefined;

  try {
    const res = await fetch(`${API_URL}${backendPath}${req.nextUrl.search}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
      cache: 'no-store',
    });

    if (res.status === 204) return new NextResponse(null, { status: 204 });

    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}
