import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL;

/**
 * Streams the invoice PDF from the NestJS API. Kept as a sibling of `invoice`
 * (not nested under it) because a route-handler segment can't also parent
 * child route segments in the App Router. Uses arrayBuffer to preserve the
 * binary payload.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/admin/payments/${id}/invoice/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return new NextResponse(text || null, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          res.headers.get('Content-Disposition') ?? 'inline',
      },
    });
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}
