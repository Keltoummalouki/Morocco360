'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_LABEL, apiLogout, type Role } from '@/lib/auth';

type NavItem = { label: string; href: string; symbol: string };

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Overview',   href: '/dashboard/admin',              symbol: '◎' },
    { label: 'Users',      href: '/dashboard/admin/users',        symbol: '◈' },
    { label: 'Content',    href: '/dashboard/admin/content',      symbol: '◇' },
    { label: 'Settings',   href: '/dashboard/admin/settings',     symbol: '○' },
  ],
  ORGANIZER: [
    { label: 'Overview',    href: '/dashboard/organizer',               symbol: '◎' },
    { label: 'Experiences', href: '/dashboard/organizer/experiences',   symbol: '◈' },
    { label: 'Analytics',   href: '/dashboard/organizer/analytics',     symbol: '◇' },
    { label: 'Bookings',    href: '/dashboard/organizer/bookings',      symbol: '○' },
  ],
  USER: [
    { label: 'Explore',  href: '/dashboard/user',               symbol: '◎' },
    { label: 'Events',   href: '/dashboard/user/events',        symbol: '◆' },
    { label: 'Saved',    href: '/dashboard/user/saved',         symbol: '◈' },
    { label: 'History',  href: '/dashboard/user/history',       symbol: '◇' },
    { label: 'Profile',  href: '/dashboard/user/profile',       symbol: '○' },
  ],
};

const ROLE_ACCENT: Record<Role, string> = {
  ADMIN:     '#C2533A',
  ORGANIZER: '#B8862D',
  USER:      '#4A7C6F',
};

interface SidebarProps {
  role: Role;
  name: string;
}

export default function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const items    = NAV_ITEMS[role] ?? [];
  const accent   = ROLE_ACCENT[role];

  async function logout() {
    await apiLogout();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        borderRight: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 700 }}
        >
          Morocco<span style={{ color: 'var(--primary)' }}>360</span>
        </Link>
      </div>

      {/* Role badge */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <span
          style={{
            fontSize: '0.625rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: accent,
            background: `${accent}14`,
            padding: '4px 10px',
            display: 'inline-block',
          }}
        >
          {ROLE_LABEL[role]}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '2px',
                fontSize: '0.875rem',
                color: active ? accent : 'var(--muted)',
                background: active ? `${accent}10` : 'transparent',
                borderLeft: active ? `2px solid ${accent}` : '2px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: active ? 500 : 400,
              }}
            >
              <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{item.symbol}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>
          {decodeURIComponent(name)}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '12px' }}>
          {role.toLowerCase()}@morocco360.ma
        </p>
        <button
          onClick={logout}
          className="btn-outline"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: '0.75rem',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
