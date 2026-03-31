import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingPanel from '@/components/BookingPanel';

export const dynamic = 'force-dynamic';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
  stock_remaining: number;
}

interface Organizer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  total_stock: number;
  is_active: boolean;
  created_at: string;
  organizer: Organizer | null;
  categories: TicketCategory[];
}

async function getEvent(id: string): Promise<Event | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/events/${id}`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Event>;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}


export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const accent = '#4A7C6F';

  return (
    <div className="dash-page">

      {/* Back link */}
      <Link
        href="/dashboard/user/events"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
          marginBottom: '32px',
          letterSpacing: '0.04em',
        }}
      >
        ← Retour aux événements
      </Link>

      {/* Hero image */}
      <div
        style={{
          height: '280px',
          background: 'var(--surface)',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: 'var(--border)' }}>◈</span>
          </div>
        )}
        {event.is_active && (
          <span
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '0.625rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: accent,
              background: `${accent}1A`,
              padding: '4px 10px',
            }}
          >
            Disponible
          </span>
        )}
      </div>

      {/* Main layout: content + sidebar */}
      <div className="flex flex-col lg:flex-row" style={{ gap: '32px', alignItems: 'flex-start' }}>

        {/* Left — main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Location eyebrow */}
          <p
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '10px',
            }}
          >
            {event.location_name}
          </p>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: '24px',
            }}
          >
            {event.title}
          </h1>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: '24px' }} />

          {/* Dates */}
          <div style={{ marginBottom: '28px' }}>
            <p
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Dates
            </p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
              {formatDate(event.date_start)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '2px' }}>
              jusqu&apos;au {formatDate(event.date_end)}
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '28px' }}>
            <p
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              À propos
            </p>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                color: 'var(--foreground)',
              }}
            >
              {event.description}
            </p>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div>
              <p
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: accent,
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Organisateur
              </p>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                {event.organizer.first_name} {event.organizer.last_name}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                {event.organizer.email}
              </p>
            </div>
          )}
        </div>

        {/* Right — booking sidebar */}
        <BookingPanel
          eventId={event.id}
          categories={event.categories}
          dateStart={event.date_start}
          dateEnd={event.date_end}
          totalStock={event.total_stock}
        />
      </div>
    </div>
  );
}
