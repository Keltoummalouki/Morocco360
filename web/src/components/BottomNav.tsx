'use client';

import Link from 'next/link';

const ITEMS = [
  {
    label: 'Explore',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
      </svg>
    ),
    href: '#',
    active: true,
  },
  {
    label: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    href: '#',
    active: false,
  },
  {
    label: 'Gallery',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
    href: '#',
    active: false,
  },
  {
    label: 'Account',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    href: '/login',
    active: false,
  },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile navigation">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`bottom-nav-item${item.active ? ' active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
