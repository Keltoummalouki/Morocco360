import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await params;
  return forwardToApi(`/admin/events/${id}/staff/${userId}`, req);
}
