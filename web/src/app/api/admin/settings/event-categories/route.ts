import { NextRequest } from 'next/server';
import { forwardToApi } from '@/lib/api-proxy';

export function GET(req: NextRequest) {
  return forwardToApi('/admin/settings/event-categories', req);
}

export function POST(req: NextRequest) {
  return forwardToApi('/admin/settings/event-categories', req);
}
