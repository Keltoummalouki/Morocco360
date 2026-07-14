import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardToApi(`/admin/staff/${id}/events`, req);
}
