import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  getTranslations,
  type Locale,
} from '@/lib/i18n';

interface TicketEvent {
  id: number | null;
  title: string | null;
  date_start: string | null;
  date_end: string | null;
  location_name: string | null;
  city: string | null;
  image_url: string | null;
}

interface Ticket {
  id: number;
  qr_code: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  category: string | null;
  event: TicketEvent;
}

interface Order {
  id: number;
  created_at: string;
  total_amount: string;
  tickets: Ticket[];
}

async function getMyOrders(host: string, cookieHeader: string): Promise<Order[]> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  try {
    const res = await fetch(`${protocol}://${host}/api/orders/my`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Order[]>;
  } catch {
    return [];
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


export default async function HistoryPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('host') ?? 'localhost:4001';

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  const orders = await getMyOrders(host, cookieStore.toString());

  const now = new Date();

  // One "card" per order; derive upcoming/past from the first ticket's event date
  const upcoming: Order[] = [];
  const past: Order[] = [];

  for (const order of orders) {
    const dateStr = order.tickets[0]?.event?.date_start;
    const eventDate = dateStr ? new Date(dateStr) : null;
    if (eventDate && eventDate >= now) {
      upcoming.push(order);
    } else {
      past.push(order);
    }
  }

  const accent = '#4A7C6F';

  return (
    <div className="dash-page" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: accent,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {t.nav.history}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Mes billets
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Retrouvez vos billets à venir et passés.
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
          }}
        >
          <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
            Vous n&apos;avez aucun billet pour le moment.
          </p>
          <Link
            href="/dashboard/user/events"
            style={{
              fontSize: '0.875rem',
              color: accent,
              textDecoration: 'underline',
            }}
          >
            Découvrir les événements →
          </Link>
        </div>
      ) : (
        <>
          <Section title="À venir" accent={accent} orders={upcoming} />
          <Section title="Passés" accent="#888" orders={past} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  accent,
  orders,
}: {
  title: string;
  accent: string;
  orders: Order[];
}) {
  if (orders.length === 0) return null;

  return (
    <section style={{ marginBottom: '48px' }}>
      <h2
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: accent,
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: `1px solid ${accent}30`,
        }}
      >
        {title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} accent={accent} />
        ))}
      </div>
    </section>
  );
}

function OrderCard({ order, accent }: { order: Order; accent: string }) {
  const firstTicket = order.tickets[0];
  const event = firstTicket?.event;
  const ticketCount = order.tickets.length;
  const totalLabel =
    Number(order.total_amount) === 0
      ? 'Gratuit'
      : `${Number(order.total_amount).toFixed(2)} MAD`;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--background)',
      }}
    >
      {/* Top row: event title + PDF download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.0625rem',
              fontWeight: 600,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event?.title ?? 'Événement'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Commande #{order.id} &middot; {formatDate(event?.date_start ?? null)}
          </p>
        </div>

        <a
          href={`/api/payments/order/${order.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: accent,
            border: `1px solid ${accent}`,
            padding: '6px 14px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          Télécharger PDF
        </a>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
        }}
      >
        {event?.location_name && (
          <span>
            ◎{' '}
            {event.city
              ? `${event.location_name}, ${event.city}`
              : event.location_name}
          </span>
        )}
        <span>
          ◆ {ticketCount} billet{ticketCount > 1 ? 's' : ''} &middot; {totalLabel}
        </span>
      </div>

    </div>
  );
}
