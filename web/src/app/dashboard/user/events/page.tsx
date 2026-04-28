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
  image_url: string | null;
  categories: TicketCategory[];
}

async function getEvents(host: string, cookieHeader: string): Promise<Event[]> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}/api/events`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Event[]>;
  } catch {
    return [];
  }
}

async function getSavedIds(host: string, cookieHeader: string): Promise<number[]> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}/api/events/saved`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return [];
    const data = await res.json() as { id: number }[];
    return data.map((e) => e.id);
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host        = headerStore.get('host') ?? 'localhost:4001';
  const cookieHeader = cookieStore.toString();

  const [events, savedIds] = await Promise.all([
    getEvents(host, cookieHeader),
    getSavedIds(host, cookieHeader),
  ]);

  const raw         = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t           = getTranslations(locale);

  return (
    <div className="dash-page">
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

      <EventsGrid events={events} initialSavedIds={savedIds} />
    </div>
  );
}
