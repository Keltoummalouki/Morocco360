'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function minPrice(categories: TicketCategory[]): string {
  if (!categories.length) return 'Gratuit';
  const prices = categories.map((c) => Number(c.price));
  const min = Math.min(...prices);
  return min === 0 ? 'Gratuit' : `Dès ${min.toFixed(0)} MAD`;
}

function EventCard({ event }: { event: Event }) {
  const accent = '#4A7C6F';

  return (
    <Link
      href={`/dashboard/user/events/${event.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
    <div
      className="card-hover"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          height: '140px',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.5rem',
            color: 'var(--border)',
            letterSpacing: '0.05em',
          }}
        >
          ◈
        </span>
        {/* Active badge */}
        {event.is_active && (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              fontSize: '0.625rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: accent,
              background: `${accent}1A`,
              padding: '3px 8px',
            }}
          >
            Disponible
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 0', flex: 1 }}>
        {/* Location + price */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              lineHeight: 1.4,
            }}
          >
            {event.location_name}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.06em',
              color: accent,
              background: `${accent}14`,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {minPrice(event.categories)}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.0625rem',
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: '10px',
          }}
        >
          {event.title}
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {event.description}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {formatDate(event.date_start)}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
            — {formatDate(event.date_end)}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {event.categories.length} billet{event.categories.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
    </Link>
  );
}

export default function EventsGrid({ events }: { events: Event[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location_name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [events, search]);

  return (
    <>
      {/* Search bar */}
      <div style={{ marginBottom: '32px' }}>
        <input
          className="input-field"
          type="text"
          placeholder="Rechercher un événement, une ville…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '420px' }}
        />
      </div>

      {/* Count */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '20px' }}>
        {filtered.length === events.length
          ? `${events.length} événement${events.length !== 1 ? 's' : ''}`
          : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''} sur ${events.length}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            border: '1px solid var(--border)',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.125rem',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            {search ? 'Aucun résultat' : 'Aucun événement disponible'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {search
              ? 'Essayez un autre mot-clé.'
              : 'Revenez bientôt pour découvrir de nouveaux événements.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}
