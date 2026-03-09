import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
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

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
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
  const minPrice = event.categories.length
    ? Math.min(...event.categories.map((c) => Number(c.price)))
    : 0;

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>

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

      {/* Hero image placeholder */}
      <div
        style={{
          height: '280px',
          background: 'var(--surface)',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '3rem',
            color: 'var(--border)',
          }}
        >
          ◈
        </span>
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
      <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>

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
              jusqu'au {formatDate(event.date_end)}
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
        <div
          style={{
            width: '280px',
            flexShrink: 0,
            border: '1px solid var(--border)',
            padding: '24px',
            position: 'sticky',
            top: '24px',
          }}
        >
          {/* Price */}
          <p
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            {minPrice === 0 ? 'Gratuit' : `Dès ${minPrice.toFixed(0)} MAD`}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '20px' }}>
            {formatDateShort(event.date_start)} — {formatDateShort(event.date_end)}
          </p>

          {/* Ticket categories */}
          <div style={{ marginBottom: '20px' }}>
            {event.categories.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderTop: i === 0 ? '1px solid var(--border)' : undefined,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {cat.stock_allocated} places
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: Number(cat.price) === 0 ? accent : 'var(--foreground)',
                  }}
                >
                  {Number(cat.price) === 0 ? 'Gratuit' : `${Number(cat.price).toFixed(0)} MAD`}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
            Réserver
          </button>

          {/* Stock info */}
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              textAlign: 'center',
              marginTop: '12px',
            }}
          >
            {event.total_stock} places au total
          </p>
        </div>
      </div>
    </div>
  );
}
