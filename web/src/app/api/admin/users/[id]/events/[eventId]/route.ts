import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id, eventId } = await params;

  try {
    const res = await fetch(`${API_URL}/admin/users/${id}/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: res.status });
    }
    try {
      const data: unknown = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      return new NextResponse(null, { status: res.status });
    }
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}
