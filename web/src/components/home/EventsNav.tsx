import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getTranslations, type Locale } from '@/lib/i18n';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';

type NavKey = 'discover' | 'events' | 'about';

/**
 * Shared top nav for the public surfaces (home + events).
 * Auth-aware: swaps Sign In for a dashboard link + notifications bell once the
 * visitor is logged in.
 */
export default function EventsNav({
  locale,
  active,
  isAuthenticated = false,
  dashboardHref = '/user/events',
}: {
  locale: Locale;
  /** Highlight the current section; omit on pages without a nav entry. */
  active?: NavKey;
  isAuthenticated?: boolean;
  dashboardHref?: string;
}) {
  const h = getTranslations(locale).home;

  // Real public pages only — no dead links.
  const links: Array<{ key: NavKey; href: string; label: string }> = [
    { key: 'discover', href: '/', label: h.navDiscover },
    { key: 'events', href: '/events', label: h.navEvents },
    { key: 'about', href: '/about', label: h.navAbout },
  ];

  return (
    <header className="ev-nav">
      <nav className="ev-container ev-nav-inner">
        <Link href="/" aria-label="Morocco360 — home">
          <Logo />
        </Link>

        <div className="ev-nav-links">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`ev-nav-link${active === l.key ? ' active' : ''}`}
              aria-current={active === l.key ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ev-nav-right">
          <LocaleSwitcher />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="icon" className="text-foreground" aria-label={h.navNotifications}>
                <Link href={dashboardHref}>
                  <Bell className="size-[18px]" />
                </Link>
              </Button>
              <Button asChild>
                <Link href={dashboardHref}>{h.navDashboard}</Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/login">{h.signIn}</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
