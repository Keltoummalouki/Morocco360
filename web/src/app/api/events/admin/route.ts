import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events/admin`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }

  const data: unknown = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
