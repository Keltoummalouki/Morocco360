import { cookies } from 'next/headers';
import Link from 'next/link';

const API_URL = process.env.API_URL;
const ACCENT = '#4A7C6F';

interface OrderEvent {
  id: number | null;
  title: string | null;
  date_start: string | null;
  date_end: string | null;
  location_name: string | null;
  city: string | null;
  image_url: string | null;
}

interface OrderTicket {
  id: number;
  qr_code: string;
  status: string;
  category: string | null;
  event: OrderEvent;
}

interface Order {
  id: number;
  created_at: string;
  total_amount: string;
  tickets: OrderTicket[];
}

interface PublicEvent {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  categories: { id: number; price: string }[];
}

async function fetchOrders(token?: string): Promise<Order[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/payments/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

async function fetchSavedCount(token?: string): Promise<number> {
  if (!token) return 0;
  try {
    const res = await fetch(`${API_URL}/events/saved`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return 0;
    const data: unknown[] = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

async function fetchUpcomingEvents(): Promise<PublicEvent[]> {
  try {
    const res = await fetch(`${API_URL}/events`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: PublicEvent[] = await res.json();
    const now = new Date();
    return data
      .filter((e) => new Date(e.date_start) > now)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .slice(0, 4);
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return formatDate(iso);
}

function minPrice(categories: { price: string }[]): string {
  if (!categories?.length) return 'Gratuit';
  const min = Math.min(...categories.map((c) => Number(c.price)));
  return min === 0 ? 'Gratuit' : `Dès ${min.toFixed(0)} MAD`;
}

export default async function UserDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const rawName = cookieStore.get('x-name')?.value ?? 'Explorer';
  const name = decodeURIComponent(rawName).split(' ')[0];

  const [orders, savedCount, publicUpcoming] = await Promise.all([
    fetchOrders(token),
    fetchSavedCount(token),
    fetchUpcomingEvents(),
  ]);

  // Stats
  const totalTickets = orders.reduce((acc, o) => acc + (o.tickets?.length ?? 0), 0);
  const uniqueCities = new Set(
    orders.flatMap((o) => o.tickets.map((t) => t.event.city).filter(Boolean)),
  ).size;

  // Upcoming events from user's orders (deduplicated by event id)
  const now = new Date();
  const seenIds = new Set<number>();
  const upcomingFromOrders = orders
    .flatMap((o) => o.tickets.map((t) => t.event))
    .filter((e): e is OrderEvent & { id: number; date_start: string } =>
      e.id !== null && e.date_start !== null && new Date(e.date_start) > now,
    )
    .filter((e) => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    })
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
    .slice(0, 4);

  // Use user's upcoming events if they have any, else show public upcoming
  const usePersonal = upcomingFromOrders.length > 0;

  // Recent orders (last 3)
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="dash-page">

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: ACCENT, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
          Bienvenue
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '6px' }}>
          {name}, explorez le Maroc
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Retrouvez vos billets, événements sauvegardés et découvrez de nouvelles expériences.
        </p>
      </div>

      {/* Stats strip */}
      <div
        className="stat-grid-3"
        style={{ marginBottom: '40px', border: '1px solid var(--border)' }}
      >
        {[
          { label: 'Billets achetés',         value: totalTickets },
          { label: 'Événements sauvegardés',  value: savedCount   },
          { label: 'Villes explorées',         value: uniqueCities },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--background)', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Upcoming events section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.375rem', fontWeight: 600 }}>
            {usePersonal ? 'Mes prochains événements' : 'Événements à venir'}
          </h2>
          <Link
            href="/dashboard/user/events"
            style={{ fontSize: '0.8125rem', color: ACCENT, textDecoration: 'none' }}
          >
            Voir tout →
          </Link>
        </div>

        {usePersonal ? (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
            {upcomingFromOrders.map((event, i) => (
              <Link
                key={event.id}
                href={`/dashboard/user/events/${event.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card-hover"
                  style={{
                    border: '1px solid var(--border)',
                    padding: '28px 24px',
                    background: i === 0 ? 'var(--foreground)' : 'var(--background)',
                    color: i === 0 ? 'var(--background)' : 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                      {event.city ?? event.location_name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: ACCENT, background: 'rgba(74,124,111,0.12)', padding: '3px 8px' }}>
                      À venir
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.3 }}>
                    {event.title}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                    {event.date_start ? formatDate(event.date_start) : '—'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : publicUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
            {publicUpcoming.map((event, i) => (
              <Link
                key={event.id}
                href={`/dashboard/user/events/${event.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card-hover"
                  style={{
                    border: '1px solid var(--border)',
                    padding: '28px 24px',
                    background: i === 0 ? 'var(--foreground)' : 'var(--background)',
                    color: i === 0 ? 'var(--background)' : 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                      {event.city ?? event.location_name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: ACCENT, background: 'rgba(74,124,111,0.12)', padding: '3px 8px' }}>
                      {event.category ?? '360°'}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.3 }}>
                    {event.title}
                  </p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '0.8125rem', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                      {formatDate(event.date_start)}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: i === 0 ? '#A8A29E' : 'var(--muted)' }}>
                      {minPrice(event.categories)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', color: 'var(--muted)' }}>
            <p style={{ marginBottom: '12px' }}>Aucun événement à venir pour le moment.</p>
            <Link href="/dashboard/user/events" style={{ fontSize: '0.875rem', color: ACCENT, textDecoration: 'underline' }}>
              Explorer les événements →
            </Link>
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div style={{ border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
            Commandes récentes
          </h2>
          <Link href="/dashboard/user/history" style={{ fontSize: '0.8125rem', color: ACCENT, textDecoration: 'none' }}>
            Voir tout →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Aucune commande pour le moment.{' '}
            <Link href="/dashboard/user/events" style={{ color: ACCENT, textDecoration: 'underline' }}>
              Réserver un événement →
            </Link>
          </div>
        ) : (
          recentOrders.map((order) => {
            const firstTicket = order.tickets?.[0];
            const eventTitle = firstTicket?.event?.title ?? `Commande #${order.id}`;
            const eventCity = firstTicket?.event?.city ?? firstTicket?.event?.location_name ?? '';
            const ticketCount = order.tickets?.length ?? 0;
            const amount = Number(order.total_amount);

            return (
              <Link
                key={order.id}
                href="/dashboard/user/history"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card-hover"
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '2px' }}>{eventTitle}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                      {eventCity && `${eventCity} · `}
                      {ticketCount} billet{ticketCount !== 1 ? 's' : ''}
                      {amount > 0 ? ` · ${amount.toFixed(0)} MAD` : ' · Gratuit'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    {formatRelative(order.created_at)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
