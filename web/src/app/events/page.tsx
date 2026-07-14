import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { decodeJwt, isExpired } from '@/lib/auth-server';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, getTranslations, type Locale } from '@/lib/i18n';
import EventsNav from '@/components/home/EventsNav';
import EventsFooter from '@/components/home/EventsFooter';
import PublicEventsGrid from './PublicEventsGrid';

export const metadata: Metadata = {
  title: 'Events',
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
  from?: string;   // ISO 'YYYY-MM-DD' — set by the home hero date picker
  price?: string;  // 'all' | 'free' | 'under200' | '200to500' | '500plus'
  sort?: string;   // 'date' | 'price' | 'title'
}

const ROLE_HOME: Record<string, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  STAFF:     '/dashboard/staff',
  USER:      '/user/events',
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
  const sp = await Promise.resolve(searchParams);
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

  const initialFilters: InitialFilters = {
    q:        str(sp.q),
    category: str(sp.category),
    city:     str(sp.city),
    date:     str(sp.date),
    from:     str(sp.from),
    price:    str(sp.price),
    sort:     str(sp.sort),
  };

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  const token   = cookieStore.get('access_token')?.value ?? null;
  const payload = token ? decodeJwt(token) : null;
  const isAuthenticated = !!payload && !isExpired(payload);
  const userRole = payload?.role ?? null;
  const dashboardHref = userRole ? (ROLE_HOME[userRole] ?? '/user/events') : '/user/events';

  const events = await getAllEvents();

  return (
    <div className="ev min-h-screen">
      <EventsNav
        locale={locale}
        active="events"
        isAuthenticated={isAuthenticated}
        dashboardHref={dashboardHref}
      />

      {/* ── Page header — photo hero ────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src="/events/hero-marrakech.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,16,23,0.55) 0%, rgba(10,16,23,0.84) 100%)',
          }}
        />
        <div className="ev-container relative py-12 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow mb-3" style={{ color: 'var(--gold)' }}>
                {t.events.discover}
              </div>
              <h1 className="ev-display text-white text-[clamp(1.9rem,5vw,3.25rem)]">
                {t.events.title}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {events.length > 0
                  ? `${events.length} ${events.length === 1 ? t.events.event : t.events.events}`
                  : t.events.noResults}
              </p>
            </div>

            {!isAuthenticated && (
              <div className="w-full rounded-xl border border-border bg-card p-5 shadow-lg sm:w-auto sm:max-w-sm">
                <p className="font-semibold text-foreground">{t.events.readyTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  <Link href="/register" className="text-primary underline underline-offset-2">
                    {t.events.createAccount}
                  </Link>{' '}
                  ·{' '}
                  <Link href="/login" className="text-primary underline underline-offset-2">
                    {t.events.signInCta}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters + grid ──────────────────────────────── */}
      <main className="ev-container py-10 sm:py-14">
        <PublicEventsGrid
          events={events}
          isAuthenticated={isAuthenticated}
          initialFilters={initialFilters}
        />
      </main>

      <EventsFooter locale={locale} />
    </div>
  );
}
