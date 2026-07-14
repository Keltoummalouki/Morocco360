import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

type Ctx = { params: Promise<{ id: string; categoryId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, categoryId } = await params;
  return forwardToApi(`/admin/events/${id}/ticket-categories/${categoryId}`, req);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id, categoryId } = await params;
  return forwardToApi(`/admin/events/${id}/ticket-categories/${categoryId}`, req);
}
