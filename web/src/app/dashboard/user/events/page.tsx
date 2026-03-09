import { cookies, headers } from 'next/headers';
import EventsGrid from './EventsGrid';

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
  total_stock: number;
  is_active: boolean;
  categories: TicketCategory[];
}

async function getEvents(): Promise<Event[]> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

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
  const events = await getEvents();

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
          Découvrez
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Événements à venir
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Explorez les meilleurs événements culturels, musicaux et sportifs du Maroc.
        </p>
      </div>

      <EventsGrid events={events} />
    </div>
  );
}
