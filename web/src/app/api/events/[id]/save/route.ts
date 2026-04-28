import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

async function handler(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${API_URL}/events/${id}/save`, {
    method: req.method,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return new NextResponse(null, { status: res.status });
}

export const POST = handler;
export const DELETE = handler;
