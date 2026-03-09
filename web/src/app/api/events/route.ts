import { NextResponse } from 'next/server';

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
