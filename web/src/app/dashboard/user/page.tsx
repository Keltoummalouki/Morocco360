import { cookies } from 'next/headers';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';

const API_URL = process.env.API_URL;
const GREEN   = '#2E8B6A';
const ACCENT  = '#C4623F';

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
  id: number; qr_code: string; status: string; category: string | null; event: OrderEvent;
}
interface Order {
  id: number; created_at: string; total_amount: string; tickets: OrderTicket[];
}
interface PublicEvent {
  id: number; title: string; date_start: string; date_end: string;
  location_name: string; city: string | null; category: string | null;
  categories: { id: number; price: string }[];
}

async function fetchOrders(token?: string): Promise<Order[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/payments/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}
async function fetchSavedCount(token?: string): Promise<number> {
  if (!token) return 0;
  try {
    const res = await fetch(`${API_URL}/events/saved`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    if (!res.ok) return 0;
    const data: unknown[] = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch { return 0; }
}
async function fetchUpcomingEvents(): Promise<PublicEvent[]> {
  try {
    const res = await fetch(`${API_URL}/events`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: PublicEvent[] = await res.json();
    const now = new Date();
    return data.filter((e) => new Date(e.date_start) > now)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .slice(0, 4);
  } catch { return []; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Aujourd'hui"; if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`; return formatDate(iso);
}
function minPrice(categories: { price: string }[]): string {
  if (!categories?.length) return 'Gratuit';
  const min = Math.min(...categories.map((c) => Number(c.price)));
  return min === 0 ? 'Gratuit' : `Dès ${min.toFixed(0)} MAD`;
}
function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
}
function dayLabel(iso: string) {
  return new Date(iso).getDate();
}

export default async function UserDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const rawName = cookieStore.get('x-name')?.value ?? 'Explorer';
  const name = decodeURIComponent(rawName).split(' ')[0];

  const [orders, savedCount, publicUpcoming] = await Promise.all([
    fetchOrders(token), fetchSavedCount(token), fetchUpcomingEvents(),
  ]);

  const totalTickets = orders.reduce((acc, o) => acc + (o.tickets?.length ?? 0), 0);
  const uniqueCities = new Set(orders.flatMap((o) => o.tickets.map((t) => t.event.city).filter(Boolean))).size;

  const now = new Date();
  const seenIds = new Set<number>();
  const upcomingFromOrders = orders
    .flatMap((o) => o.tickets.map((t) => t.event))
    .filter((e): e is OrderEvent & { id: number; date_start: string } =>
      e.id !== null && e.date_start !== null && new Date(e.date_start) > now)
    .filter((e) => { if (seenIds.has(e.id)) return false; seenIds.add(e.id); return true; })
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
    .slice(0, 4);

  const usePersonal = upcomingFromOrders.length > 0;
  const recentOrders = orders.slice(0, 3);

  const STATS = [
    { label: 'Tickets purchased', value: totalTickets, icon: '◆', color: GREEN },
    { label: 'Saved events',      value: savedCount,   icon: '◈', color: '#C49A3C' },
    { label: 'Cities explored',   value: uniqueCities, icon: '◎', color: ACCENT },
  ];

  return (
    <DashboardPage>
    <div className="dash-page">

      {/* Header */}
      <div className="dash-header">
        <p className="eyebrow">Bienvenue</p>
        <h1>{name}, explorez le Maroc</h1>
        <p>Retrouvez vos billets, événements sauvegardés et découvrez de nouvelles expériences.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '40px' }}>
        {STATS.map((s, i) => (
          <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '1rem', color: s.color }}>{s.icon}</span>
              <span style={{
                fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: s.color, background: `${s.color}14`, padding: '3px 8px',
              }}>Live</span>
            </div>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '6px', color: s.color }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
        <Link href="/dashboard/user/events" className="btn-primary btn-sm">
          Explore Events
        </Link>
        <Link href="/dashboard/user/saved" className="btn-outline btn-sm">
          <span>Saved</span>
        </Link>
        <Link href="/dashboard/user/history" className="btn-outline btn-sm">
          <span>History</span>
        </Link>
      </div>

      {/* Upcoming events */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div className="section-divider" />
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {usePersonal ? 'Mes prochains événements' : 'Événements à venir'}
            </h2>
          </div>
          <Link href="/dashboard/user/events" style={{ fontSize: '0.8125rem', color: GREEN, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir tout
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        {(usePersonal ? upcomingFromOrders : publicUpcoming).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {(usePersonal ? upcomingFromOrders : publicUpcoming).map((event, i) => {
              const ev = event as (OrderEvent & { id: number; date_start: string }) | PublicEvent;
              const id = 'id' in ev ? ev.id : null;
              const ds = 'date_start' in ev ? ev.date_start : null;
              const city = 'city' in ev ? ev.city : null;
              const loc = 'location_name' in ev ? ev.location_name : null;
              const cats = 'categories' in ev ? ev.categories : null;
              const featured = i === 0;

              return (
                <Link
                  key={id}
                  href={id ? `/dashboard/user/events/${id}` : '#'}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="border-glow-card"
                    style={{
                      padding: '24px',
                      height: '100%',
                      background: featured ? 'var(--surface-2)' : 'var(--surface)',
                      cursor: 'pointer',
                      borderColor: featured ? 'var(--primary-glow)' : 'var(--border)',
                    }}
                  >
                    {/* Date badge */}
                    {ds && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                          background: featured ? 'var(--primary)' : 'var(--surface-3)',
                          padding: '6px 10px', textAlign: 'center', minWidth: '48px',
                        }}>
                          <p style={{ fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: featured ? 'rgba(255,255,255,0.7)' : 'var(--muted)', lineHeight: 1 }}>
                            {monthLabel(ds)}
                          </p>
                          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: featured ? '#FAFAF8' : 'var(--foreground)', lineHeight: 1.2 }}>
                            {dayLabel(ds)}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: GREEN, background: `${GREEN}14`, padding: '3px 8px',
                        }}>
                          {usePersonal ? 'À venir' : (('category' in ev && ev.category) ? ev.category : '360°')}
                        </span>
                      </div>
                    )}

                    <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.4 }}>
                      {('title' in ev ? ev.title : null) ?? `Événement #${id}`}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                        {city ?? loc ?? '—'}
                      </p>
                      {cats && <p style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 500 }}>{minPrice(cats)}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            border: '1px dashed var(--border)', color: 'var(--muted)',
            background: 'var(--surface)',
          }}>
            <p style={{ marginBottom: '16px', fontFamily: 'var(--font-playfair)', fontSize: '1.125rem' }}>
              Aucun événement à venir
            </p>
            <Link href="/dashboard/user/events" className="btn-primary btn-sm">
              Explorer les événements
            </Link>
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ width: '20px', height: '1.5px', background: 'var(--primary)', marginBottom: '8px' }} />
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
              Commandes récentes
            </h2>
          </div>
          <Link href="/dashboard/user/history" style={{ fontSize: '0.8125rem', color: GREEN, textDecoration: 'none' }}>
            Voir tout →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ marginBottom: '12px' }}>Aucune commande pour le moment.</p>
            <Link href="/dashboard/user/events" style={{ color: GREEN, textDecoration: 'underline', fontSize: '0.875rem' }}>
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
              <Link key={order.id} href="/dashboard/user/history" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card-hover"
                  style={{
                    padding: '18px 24px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px', height: '40px', flexShrink: 0,
                      background: 'var(--primary-glow-soft)',
                      border: '1px solid var(--primary-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: GREEN, fontSize: '1rem',
                    }}>
                      ◆
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '3px' }}>{eventTitle}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                        {eventCity && `${eventCity} · `}
                        {ticketCount} billet{ticketCount !== 1 ? 's' : ''}
                        {amount > 0 ? ` · ${amount.toFixed(0)} MAD` : ' · Gratuit'}
                      </p>
                    </div>
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
    </DashboardPage>
  );
}
