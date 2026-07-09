import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import { decodeJwt } from '@/lib/auth-server';
import PublicEventsGrid from './PublicEventsGrid';

export const metadata: Metadata = {
  title: 'Events — Morocco360',
  description: 'Discover and book live events across Morocco. Music, culture, sport, art and more.',
};

export interface PublicEvent {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string;
  image_url: string | null;
  total_stock: number;
  is_active: boolean;
  is_sold_out: boolean;
  categories: {
    id: number;
    name: string;
    price: string;
    stock_remaining: number;
    stock_allocated: number;
  }[];
}

/** Initial filter values seeded from the URL (for shareable links). */
export interface InitialFilters {
  q?: string;
  category?: string;
  city?: string;
  date?: string;   // 'all' | 'month' | '3months' | 'year'
  price?: string;  // 'all' | 'free' | 'under200' | '200to500' | '500plus'
  sort?: string;   // 'date' | 'price' | 'title'
}

const ROLE_HOME: Record<string, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  STAFF:     '/dashboard/staff',
  USER:      '/dashboard/user',
};

// Fetch ALL active events — filtering is done client-side for instant UX.
// The NestJS API supports query params for direct/external consumers.
async function getAllEvents(): Promise<PublicEvent[]> {
  try {
    const API_URL = process.env.API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${API_URL}/events`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as PublicEvent[];
  } catch {
    return [];
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Works whether Next.js gives us a Promise or a plain object
  const sp = await Promise.resolve(searchParams);

  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

  const initialFilters: InitialFilters = {
    q:        str(sp.q),
    category: str(sp.category),
    city:     str(sp.city),
    date:     str(sp.date),
    price:    str(sp.price),
    sort:     str(sp.sort),
  };

  const cookieStore = await cookies();
  const token       = cookieStore.get('access_token')?.value ?? null;
  const payload     = token ? decodeJwt(token) : null;
  const isAuthenticated = !!payload && payload.exp * 1000 > Date.now();
  const userRole    = payload?.role ?? null;
  const dashboardHref = userRole ? (ROLE_HOME[userRole] ?? '/dashboard/user') : '/dashboard/user';

  const events = await getAllEvents();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border" aria-label="Main navigation">
        <div className="nav-bar max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <Link href="/" className="font-playfair text-xl font-bold shrink-0">
            Morocco<span className="text-primary">360</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/"       className="link-underline nav-link">Home</Link>
            <Link href="/events" className="nav-link" style={{ color: 'var(--foreground)', fontWeight: 500 }}>Events</Link>
            <Link href="#"       className="link-underline nav-link">Destinations</Link>
            <Link href="#"       className="link-underline nav-link">About</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href={dashboardHref} className="btn-primary btn-sm">My Dashboard</Link>
            ) : (
              <>
                <Link href="/login"    className="link-underline nav-link">Sign in</Link>
                <Link href="/register" className="btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <MobileNav isAuthenticated={isAuthenticated} dashboardHref={dashboardHref} />
          </div>
        </div>
      </nav>

      {/* ── Page header ───────────────────────────────────── */}
      <div className="pt-16 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          <p className="label-caps text-primary mb-3">Discover Morocco</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <h1 className="font-playfair text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] mb-3">
                Upcoming Events
              </h1>
              <p className="text-muted" style={{ fontSize: '0.9375rem' }}>
                {events.length > 0
                  ? `${events.length} event${events.length !== 1 ? 's' : ''} across Morocco`
                  : 'No upcoming events — check back soon'}
              </p>
            </div>

            {!isAuthenticated && (
              <div
                className="border border-border bg-background"
                style={{ padding: '16px 20px', maxWidth: '300px', flexShrink: 0 }}
              >
                <p className="font-playfair font-semibold mb-1" style={{ fontSize: '0.9375rem' }}>
                  Ready to attend?
                </p>
                <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  <Link href="/register" style={{ color: 'var(--primary)' }}>Create a free account</Link>
                  {' '}or{' '}
                  <Link href="/login" style={{ color: 'var(--primary)' }}>sign in</Link>
                  {' '}to reserve tickets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter + grid ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <PublicEventsGrid
          events={events}
          isAuthenticated={isAuthenticated}
          initialFilters={initialFilters}
        />
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          <Link href="/" className="font-playfair text-[1.125rem] font-bold">
            Morocco<span className="text-primary">360</span>
          </Link>
          <p className="text-[0.8125rem] text-muted text-center sm:text-left">
            2026 Morocco360. All rights reserved.
          </p>
          <div className="flex gap-6 sm:gap-8 flex-wrap justify-center">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <Link key={item} href="#" className="link-underline nav-link">{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
