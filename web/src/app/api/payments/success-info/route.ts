import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();

  const sessionId = searchParams.get('session_id');
  const orderId   = searchParams.get('order_id');
  if (sessionId) params.set('session_id', sessionId);
  if (orderId)   params.set('order_id', orderId);

  const res = await fetch(`${API_URL}/payments/success-info?${params.toString()}`);

  if (!res.ok) return NextResponse.json(null, { status: res.status });

  const data = await res.json();
  return NextResponse.json(data);
}
