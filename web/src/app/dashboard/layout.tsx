import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { decodeJwt } from '@/lib/auth-server';
import type { Role } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawToken    = cookieStore.get('access_token')?.value;
  const payload     = rawToken ? decodeJwt(rawToken) : null;

  // Safety net — middleware is the primary guard
  if (!payload?.role) redirect('/login');

  const role = payload.role as Role;
  // Use the email username as the display name
  const name = payload.email.split('@')[0] ?? payload.email;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar role={role} name={name} />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
