import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
