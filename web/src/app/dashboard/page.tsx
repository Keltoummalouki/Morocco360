import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@/lib/auth';

const ROLE_HOME: Record<Role, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  USER:      '/dashboard/user',
};

/**
 * /dashboard — redirects to the role-specific dashboard.
 * Middleware already guarantees the user is authenticated.
 */
export default async function DashboardRedirect() {
  const cookieStore = await cookies();
  const role = cookieStore.get('x-role')?.value as Role | undefined;

  if (!role || !ROLE_HOME[role]) redirect('/login');

  redirect(ROLE_HOME[role]);
}
