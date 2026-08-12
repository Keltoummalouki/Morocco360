import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return forwardToApi(`/admin/events/${id}/staff`, req);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return forwardToApi(`/admin/events/${id}/staff`, req);
}
