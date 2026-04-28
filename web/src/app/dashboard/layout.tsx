import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
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
  const name = payload.email.split('@')[0] ?? payload.email;

  return (
    <DashboardShell role={role} name={name}>
      {children}
    </DashboardShell>
  );
}
