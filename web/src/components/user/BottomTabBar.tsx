'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Bookmark, Ticket, User } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

const TABS = [
  { href: '/user/events', key: 'tabEvents', Icon: CalendarDays },
  { href: '/user/saved', key: 'tabSaved', Icon: Bookmark },
  { href: '/user/history', key: 'tabHistory', Icon: Ticket },
  { href: '/user/profile', key: 'tabProfile', Icon: User },
] as const;

/** Fixed mobile bottom tab bar. */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav className="ev-tabbar md:hidden" aria-label="App navigation">
      {TABS.map(({ href, key, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="ev-tab"
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            {t.app[key]}
          </Link>
        );
      })}
    </nav>
  );
}
