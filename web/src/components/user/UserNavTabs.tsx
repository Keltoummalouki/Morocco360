'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';

const TABS = [
  { href: '/user/events', key: 'tabEvents' },
  { href: '/user/saved', key: 'tabSaved' },
  { href: '/user/history', key: 'tabHistory' },
  { href: '/user/profile', key: 'tabProfile' },
] as const;

/** Desktop tab links inside the app bar. */
export default function UserNavTabs() {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <div className="ev-nav-links">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="ev-appbar-tab"
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            {t.app[tab.key]}
          </Link>
        );
      })}
    </div>
  );
}
