'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_LABEL, apiLogout, type Role } from '@/lib/auth';
import { useLocale } from './LocaleProvider';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';
import type { Translations } from '@/lib/i18n';

type NavKey = keyof Translations['nav'];
type NavItem = { key: NavKey; href: string; icon: React.ReactNode };

function Icon({ d, strokeWidth = 1.5 }: { d: string; strokeWidth?: number }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  overview:  <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  events:    <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  users:     <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  explore:   <Icon d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />,
  saved:     <Icon d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
  history:   <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  profile:   <Icon d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { key: 'overview', href: '/dashboard/admin',        icon: ICONS.overview },
    { key: 'events',   href: '/dashboard/admin/events', icon: ICONS.events   },
    { key: 'users',    href: '/dashboard/admin/users',  icon: ICONS.users    },
  ],
  ORGANIZER: [
    { key: 'overview', href: '/dashboard/organizer',        icon: ICONS.overview },
    { key: 'events',   href: '/dashboard/organizer/events', icon: ICONS.events   },
  ],
  USER: [
    { key: 'explore',  href: '/dashboard/user',          icon: ICONS.explore },
    { key: 'events',   href: '/dashboard/user/events',   icon: ICONS.events  },
    { key: 'saved',    href: '/dashboard/user/saved',    icon: ICONS.saved   },
    { key: 'history',  href: '/dashboard/user/history',  icon: ICONS.history },
    { key: 'profile',  href: '/dashboard/user/profile',  icon: ICONS.profile },
  ],
};

const ROLE_COLORS: Record<Role, { bg: string; text: string; dot: string }> = {
  ADMIN:     { bg: 'rgba(196,98,63,0.12)', text: '#C4623F', dot: '#C4623F' },
  ORGANIZER: { bg: 'rgba(196,154,60,0.12)', text: '#C49A3C', dot: '#C49A3C' },
  USER:      { bg: 'rgba(46,139,106,0.12)', text: '#2E8B6A', dot: '#2E8B6A' },
};

interface SidebarProps {
  role: Role;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, name, isOpen, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { t }     = useLocale();
  const items     = NAV_ITEMS[role] ?? [];
  const roleColor = ROLE_COLORS[role];

  async function logout() {
    await apiLogout();
    router.push('/login');
    router.refresh();
  }

  const initial = decodeURIComponent(name).charAt(0).toUpperCase();

  const sidebarContent = (
    <aside className="sidebar-premium">

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" onClick={onClose} style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none', color: 'var(--foreground)' }}>
          Morocco<span style={{ color: 'var(--primary)' }}>360</span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="sidebar-close-btn"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.25rem', padding: '4px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* User card */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#FAFAF8',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
              {decodeURIComponent(name)}
            </p>
            <span style={{ fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: roleColor.text, background: roleColor.bg, padding: '2px 7px', borderRadius: '3px' }}>
              {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-nav-item${active ? ' active' : ''}`}
            >
              {item.icon}
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      {/* Logout */}
      <div style={{ padding: '12px 10px 20px' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 14px',
            fontSize: '0.875rem',
            color: 'var(--muted)',
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#E05252';
            (e.currentTarget as HTMLElement).style.background = 'rgba(224,82,82,0.08)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,82,82,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          }}
        >
          <svg style={{ width: '15px', height: '15px', flexShrink: 0, opacity: 0.7 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.nav.signOut}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block" style={{ flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div className="sidebar-overlay lg:hidden" onClick={onClose} aria-hidden="true" />
          <div className="lg:hidden" style={{ position: 'fixed', top: 0, insetInlineStart: 0, bottom: 0, zIndex: 50, animation: 'fadeIn 0.2s ease forwards' }}>
            <style>{`.sidebar-close-btn { display: flex !important; }`}</style>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
