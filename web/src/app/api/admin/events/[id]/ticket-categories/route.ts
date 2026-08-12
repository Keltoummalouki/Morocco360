import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardToApi(`/admin/events/${id}/ticket-categories`, req);
}
