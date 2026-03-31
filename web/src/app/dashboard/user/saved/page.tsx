'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface SavedEvent {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  is_active: boolean;
  categories: TicketCategory[];
}

const ACCENT = '#4A7C6F';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function minPrice(categories: TicketCategory[]): string {
  if (!categories?.length) return 'Gratuit';
  const prices = categories.map((c) => Number(c.price));
  const min = Math.min(...prices);
  return min === 0 ? 'Gratuit' : `Dès ${min.toFixed(0)} MAD`;
}

function SavedCard({
  event,
  onUnsave,
}: {
  event: SavedEvent;
  onUnsave: (id: number) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleUnsave() {
    setSaving(true);
    try {
      await fetch(`/api/events/${event.id}/save`, { method: 'DELETE' });
      onUnsave(event.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Image area */}
      <div
        style={{
          height: '120px',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', color: 'var(--border)' }}>◈</span>
        {event.category && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '0.625rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: ACCENT,
              background: `${ACCENT}1A`,
              padding: '3px 8px',
            }}
          >
            {event.category}
          </span>
        )}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            fontSize: '0.6875rem',
            color: ACCENT,
            background: `${ACCENT}14`,
            padding: '3px 8px',
          }}
        >
          {minPrice(event.categories)}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 12px', flex: 1 }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '6px',
          }}
        >
          {event.city ?? event.location_name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: '8px',
          }}
        >
          {event.title}
        </p>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{formatDate(event.date_start)}</p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>— {formatDate(event.date_end)}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            href={`/dashboard/user/events/${event.id}`}
            style={{
              fontSize: '0.75rem',
              color: ACCENT,
              textDecoration: 'none',
              border: `1px solid ${ACCENT}`,
              padding: '5px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            Voir →
          </Link>
          <button
            type="button"
            onClick={handleUnsave}
            disabled={saving}
            title="Retirer des sauvegardés"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            <svg width="13" height="16" viewBox="0 0 13 16" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1.75C1 1.336 1.336 1 1.75 1h9.5C11.664 1 12 1.336 12 1.75V15l-5.5-3L1 15V1.75z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events/saved', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SavedEvent[]) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  function handleUnsave(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="dash-page">
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: ACCENT,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Sauvegardés
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Mes événements sauvegardés
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Retrouvez les événements que vous avez mis de côté.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Chargement…</p>
      ) : events.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
          }}
        >
          <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
            Aucun événement sauvegardé pour le moment.
          </p>
          <Link
            href="/dashboard/user/events"
            style={{ fontSize: '0.875rem', color: ACCENT, textDecoration: 'underline' }}
          >
            Explorer les événements →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {events.map((event) => (
            <SavedCard key={event.id} event={event} onUnsave={handleUnsave} />
          ))}
        </div>
      )}
    </div>
  );
}
