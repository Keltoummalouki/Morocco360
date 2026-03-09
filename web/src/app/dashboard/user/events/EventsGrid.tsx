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
  city: string | null;
  category: string | null;
  total_stock: number;
  is_active: boolean;
  categories: TicketCategory[];
}

const CATEGORIES = ['Musique', 'Sport', 'Culture', 'Cinema', 'Humour', 'Art', 'Autre'];

const DATE_OPTIONS = [
  { label: 'Toutes dates', value: 'all' },
  { label: 'Ce mois-ci',   value: 'month' },
  { label: '3 prochains mois', value: '3months' },
  { label: 'Cette année',  value: 'year' },
];

const ACCENT = '#4A7C6F';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function minPrice(categories: TicketCategory[]): string {
  if (!categories.length) return 'Gratuit';
  const prices = categories.map((c) => Number(c.price));
  const min = Math.min(...prices);
  return min === 0 ? 'Gratuit' : `Dès ${min.toFixed(0)} MAD`;
}

function matchesDate(dateStart: string, filter: string): boolean {
  if (filter === 'all') return true;
  const now = new Date();
  const start = new Date(dateStart);
  if (filter === 'month') {
    return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
  }
  if (filter === '3months') {
    const limit = new Date(now);
    limit.setMonth(limit.getMonth() + 3);
    return start >= now && start <= limit;
  }
  if (filter === 'year') {
    return start.getFullYear() === now.getFullYear();
  }
  return true;
}

function ChipButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        fontWeight: active ? 600 : 400,
        color: active ? ACCENT : 'var(--muted)',
        background: active ? `${ACCENT}14` : 'transparent',
        border: `1px solid ${active ? ACCENT : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/dashboard/user/events/${event.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
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
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', color: 'var(--border)' }}>◈</span>
          {/* Category badge */}
          {event.category && (
            <span
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
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
                color: ACCENT,
                background: `${ACCENT}1A`,
                padding: '3px 8px',
              }}
            >
              Disponible
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 0', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', lineHeight: 1.4 }}>
              {event.city ?? event.location_name}
            </span>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.06em', color: ACCENT, background: `${ACCENT}14`, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {minPrice(event.categories)}
            </span>
          </div>

          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '10px' }}>
            {event.title}
          </p>

          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '16px' }}>
            {event.description}
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{formatDate(event.date_start)}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>— {formatDate(event.date_end)}</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {event.categories.length} billet{event.categories.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function EventsGrid({ events }: { events: Event[] }) {
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeCity, setActiveCity]         = useState('');
  const [activeDate, setActiveDate]         = useState('all');

  // Build unique city list from events
  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q) && !e.location_name.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
      if (activeCategory && e.category !== activeCategory) return false;
      if (activeCity && e.city !== activeCity) return false;
      if (!matchesDate(e.date_start, activeDate)) return false;
      return true;
    });
  }, [events, search, activeCategory, activeCity, activeDate]);

  const hasFilters = search || activeCategory || activeCity || activeDate !== 'all';

  function resetFilters() {
    setSearch('');
    setActiveCategory('');
    setActiveCity('');
    setActiveDate('all');
  }

  return (
    <>
      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          className="input-field"
          type="text"
          placeholder="Rechercher un événement, une ville…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '420px' }}
        />
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <ChipButton active={activeCategory === ''} onClick={() => setActiveCategory('')}>
          Toutes
        </ChipButton>
        {CATEGORIES.map((cat) => (
          <ChipButton key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}>
            {cat}
          </ChipButton>
        ))}
      </div>

      {/* City + Date row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', alignItems: 'center' }}>
        <select
          value={activeCity}
          onChange={(e) => setActiveCity(e.target.value)}
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--background)',
            padding: '8px 12px',
            fontSize: '0.875rem',
            color: activeCity ? 'var(--foreground)' : 'var(--muted)',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
          }}
        >
          <option value="">Toutes les villes</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={activeDate}
          onChange={(e) => setActiveDate(e.target.value)}
          style={{
            border: '1.5px solid var(--border)',
            background: 'var(--background)',
            padding: '8px 12px',
            fontSize: '0.875rem',
            color: 'var(--foreground)',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
          }}
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              textDecoration: 'underline',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Count */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '20px' }}>
        {filtered.length === events.length
          ? `${events.length} événement${events.length !== 1 ? 's' : ''}`
          : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''} sur ${events.length}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ border: '1px solid var(--border)', padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>
            Aucun résultat
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Essayez d&apos;autres filtres ou{' '}
            <button onClick={resetFilters} style={{ color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0, fontFamily: 'inherit' }}>
              réinitialisez
            </button>.
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
