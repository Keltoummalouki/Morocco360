import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(`${API_URL}/organizer/events/${eventId}/attendees/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ message: 'Export failed.' }, { status: res.status });
    }
    const csv = await res.text();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendees-${eventId}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}
