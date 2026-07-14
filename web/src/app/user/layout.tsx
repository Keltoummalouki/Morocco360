import { cookies } from 'next/headers';
import { decodeJwt } from '@/lib/auth-server';
import UserAppBar from '@/components/user/UserAppBar';
import BottomTabBar from '@/components/user/BottomTabBar';

/**
 * Shell for the user "app" — top app-bar (desktop tabs) + fixed bottom tab bar
 * (mobile). Styling is the public Imperial Trinity system, scoped under `.ev`.
 * Access is enforced by middleware (`/user` requires an authenticated USER).
 */
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('access_token')?.value ?? null;
  const payload = token ? decodeJwt(token) : null;
  const email = payload?.email ?? '';

  return (
    <div className="ev min-h-screen">
      <UserAppBar email={email} />
      <main className="user-main">{children}</main>
      <BottomTabBar />
    </div>
  );
}
