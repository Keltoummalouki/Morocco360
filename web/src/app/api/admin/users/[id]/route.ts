import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

/** Forward JSON or return 204 — never crash on empty body */
async function forwardResponse(res: Response): Promise<NextResponse> {
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return new NextResponse(null, { status: res.status });
  }
  try {
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Backend returned non-JSON body (e.g. empty 200 after delete)
    return new NextResponse(null, { status: res.status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: await req.text(),
    });
    return forwardResponse(res);
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return forwardResponse(res);
  } catch {
    return NextResponse.json({ message: 'API unavailable.' }, { status: 503 });
  }
}
