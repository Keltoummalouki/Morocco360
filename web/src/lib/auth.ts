export type Role = 'ADMIN' | 'ORGANIZER' | 'USER';

// ── Role → landing page ────────────────────────────────────
export const ROLE_HOME: Record<Role, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  USER:      '/dashboard/user',
};

// ── Role display labels ────────────────────────────────────
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN:     'Administrator',
  ORGANIZER: 'Organizer',
  USER:      'User',
};

/**
 * Seed user quick-fill data for the dev panel.
 * Passwords are already in the README — this is dev-only convenience, not secret storage.
 */
export const DEV_USERS = [
  { email: 'admin@morocco360.ma',     password: 'Admin1234',     role: 'ADMIN'     as Role, name: 'Administrator'  },
  { email: 'organizer@morocco360.ma', password: 'Organizer1234', role: 'ORGANIZER' as Role, name: 'Event Organizer' },
  { email: 'user@morocco360.ma',      password: 'User1234',      role: 'USER'      as Role, name: 'Test User'       },
];

// ── Client-side API helpers ────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Login failed.');
  return data as { role: Role; email: string };
}

export async function apiRegister(payload: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}) {
  const res = await fetch('/api/auth/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Registration failed.');
  return data as { role: Role; email: string };
}

export async function apiLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}
