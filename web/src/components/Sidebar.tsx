'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_LABEL, apiLogout, type Role } from '@/lib/auth';
import { useLocale } from './LocaleProvider';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';
import type { Translations } from '@/lib/i18n';

type NavKey = keyof Translations['nav'];
type NavItem = { key: NavKey; href: string; symbol: string };

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { key: 'overview',  href: '/dashboard/admin',        symbol: '◎' },
    { key: 'events',    href: '/dashboard/admin/events', symbol: '◆' },
    { key: 'users',     href: '/dashboard/admin/users',  symbol: '◈' },
  ],
  ORGANIZER: [
    { key: 'overview',  href: '/dashboard/organizer',        symbol: '◎' },
    { key: 'events',    href: '/dashboard/organizer/events', symbol: '◆' },
  ],
  USER: [
    { key: 'explore',  href: '/dashboard/user',          symbol: '◎' },
    { key: 'events',   href: '/dashboard/user/events',   symbol: '◆' },
    { key: 'saved',    href: '/dashboard/user/saved',    symbol: '◈' },
    { key: 'history',  href: '/dashboard/user/history',  symbol: '◇' },
    { key: 'profile',  href: '/dashboard/user/profile',  symbol: '○' },
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
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, name, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { t }    = useLocale();
  const items    = NAV_ITEMS[role] ?? [];
  const accent   = ROLE_ACCENT[role];

  async function logout() {
    await apiLogout();
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        height: '100%',
        borderInlineEnd: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 700 }}
          onClick={onClose}
        >
          Morocco<span style={{ color: 'var(--primary)' }}>360</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '1.25rem',
            padding: '4px',
            lineHeight: 1,
          }}
          className="sidebar-close-btn"
        >
          ✕
        </button>
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
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '2px',
                fontSize: '0.875rem',
                color: active ? accent : 'var(--muted)',
                background: active ? `${accent}10` : 'transparent',
                borderInlineStart: active ? `2px solid ${accent}` : '2px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: active ? 500 : 400,
              }}
            >
              <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{item.symbol}</span>
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      {/* User info + logout */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          {t.nav.signOut}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block" style={{ flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile sidebar — drawer overlay */}
      {isOpen && (
        <>
          <div
            className="sidebar-overlay lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            className="lg:hidden"
            style={{
              position: 'fixed',
              top: 0,
              insetInlineStart: 0,
              bottom: 0,
              zIndex: 50,
              animation: 'fadeIn 0.2s ease forwards',
            }}
          >
            <style>{`.sidebar-close-btn { display: flex !important; }`}</style>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
