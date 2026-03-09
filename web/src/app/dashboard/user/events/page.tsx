import { cookies, headers } from 'next/headers';
import EventsGrid from './EventsGrid';
import type { Locale } from '@/lib/i18n';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, getTranslations } from '@/lib/i18n';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  total_stock: number;
  is_active: boolean;
  categories: TicketCategory[];
}

async function getEvents(): Promise<Event[]> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host        = headerStore.get('host') ?? 'localhost:4001';
    const protocol    = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/events`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Event[]>;
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events      = await getEvents();
  const cookieStore = await cookies();
  const raw         = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t           = getTranslations(locale);

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#4A7C6F',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {t.events.discover}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          {t.events.title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          {t.events.subtitle}
        </p>
      </div>

      <EventsGrid events={events} />
    </div>
  );
}
