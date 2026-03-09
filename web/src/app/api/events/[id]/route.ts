import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events/${id}`, { cache: 'no-store' });
  } catch {
    return NextResponse.json(
      { message: 'API unavailable. Is the server running?' },
      { status: 503 },
    );
  }

  if (!apiRes.ok) {
    return NextResponse.json(
      { message: `Event #${id} not found.` },
      { status: apiRes.status },
    );
  }

  const data: unknown = await apiRes.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events/${id}`, {
      method: 'PATCH',
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

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }

  if (apiRes.status === 204) return new NextResponse(null, { status: 204 });
  const data: unknown = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
