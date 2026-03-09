import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET() {
  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events`, { cache: 'no-store' });
  } catch {
    return NextResponse.json(
      { message: 'API unavailable. Is the server running?' },
      { status: 503 },
    );
  }

  if (!apiRes.ok) {
    return NextResponse.json(
      { message: 'Failed to fetch events.' },
      { status: apiRes.status },
    );
  }

  const data: unknown = await apiRes.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: await req.text(),
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }

  const data: unknown = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
