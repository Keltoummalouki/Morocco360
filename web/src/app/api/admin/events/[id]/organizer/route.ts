import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardToApi(`/admin/events/${id}/organizer`, req);
}
