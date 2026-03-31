import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import EventsTable from './EventsTable';

export const dynamic = 'force-dynamic';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface Event {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  location_name: string;
  is_active: boolean;
  total_stock: number;
  image_url: string | null;
  categories: TicketCategory[];
}

async function getAdminEvents(): Promise<Event[]> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/events/admin`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Event[]>;
  } catch {
    return [];
  }
}

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-end justify-between" style={{ marginBottom: '36px' }}>
        <div>
          <p
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.2em',
              color: '#C2533A',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Administration
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Événements
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            {events.length} événement{events.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Link href="/dashboard/admin/events/new" className="btn-primary btn-action shrink-0">
          + Créer un événement
        </Link>
      </div>

      <EventsTable events={events} />
    </div>
  );
}
