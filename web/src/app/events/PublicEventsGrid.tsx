'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { InitialFilters, PublicEvent } from './page';

// ── Constants ──────────────────────────────────────────────

const ACCENT = '#4A7C6F';

const CATEGORIES = [
  'Musique', 'Sport', 'Culture', 'Cinema', 'Humour', 'Art', 'Autre',
] as const;

const DATE_OPTIONS = [
  { value: 'all',     label: 'Any date'      },
  { value: 'month',   label: 'This month'    },
  { value: '3months', label: 'Next 3 months' },
  { value: 'year',    label: 'This year'     },
];

const PRICE_OPTIONS = [
  { value: 'all',      label: 'All prices'    },
  { value: 'free',     label: 'Free'          },
  { value: 'under200', label: 'Under 200 MAD' },
  { value: '200to500', label: '200–500 MAD'   },
  { value: '500plus',  label: '500 MAD+'      },
];

const SORT_OPTIONS = [
  { value: 'date',  label: 'Date (soonest)' },
  { value: 'price', label: 'Price (lowest)' },
  { value: 'title', label: 'Name (A–Z)'     },
];

// ── Helpers ────────────────────────────────────────────────

function getMinPrice(categories: PublicEvent['categories']): number | null {
  if (!categories?.length) return null;
  return Math.min(...categories.map((c) => Number(c.price)));
}

function formatMinPrice(categories: PublicEvent['categories']): string {
  const min = getMinPrice(categories);
  if (min === null) return '—';
  return min === 0 ? 'Free' : `From ${min.toFixed(0)} MAD`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function matchesDate(dateStart: string, filter: string): boolean {
  if (filter === 'all') return true;
  const now   = new Date();
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

function matchesPrice(categories: PublicEvent['categories'], filter: string): boolean {
  if (filter === 'all') return true;
  const min = getMinPrice(categories);
  if (min === null) return true;
  if (filter === 'free')     return min === 0;
  if (filter === 'under200') return min < 200;
  if (filter === '200to500') return min >= 200 && min <= 500;
  if (filter === '500plus')  return min > 500;
  return true;
}

/** Update the browser URL bar without triggering any navigation or re-render. */
function syncUrl(q: string, category: string, city: string, date: string, price: string, sort: string) {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (q.trim())             p.set('q',        q.trim());
  if (category)             p.set('category', category);
  if (city)                 p.set('city',     city);
  if (date  !== 'all')      p.set('date',     date);
  if (price !== 'all')      p.set('price',    price);
  if (sort  !== 'date')     p.set('sort',     sort);
  const qs  = p.toString();
  const url = qs ? `/events?${qs}` : '/events';
  window.history.replaceState(null, '', url);
}

// ── Sub-components ─────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function EventCard({
  event,
  isAuthenticated,
}: {
  event: PublicEvent;
  isAuthenticated: boolean;
}) {
  const minPrice    = formatMinPrice(event.categories);
  const isFree      = getMinPrice(event.categories) === 0;
  const reserveHref = isAuthenticated
    ? `/dashboard/user/events/${event.id}`
    : `/login?redirect=/dashboard/user/events/${event.id}`;

  return (
    <div
      className="card-hover"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Full-card link (sits behind interactive elements) */}
      <Link
        href={reserveHref}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        aria-label={event.title}
      />

      {/* Image */}
      <div
        style={{
          height: '200px',
          flexShrink: 0,
          background: 'var(--surface)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          pointerEvents: 'none',
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-playfair" style={{ fontSize: '2.5rem', opacity: 0.07 }}>M</span>
          </div>
        )}

        {/* Category badge */}
        {event.category && (
          <span
            className="label-caps"
            style={{
              position: 'absolute', top: 12, left: 12,
              fontSize: '0.5625rem', color: ACCENT,
              background: `${ACCENT}22`, padding: '3px 8px',
            }}
          >
            {event.category}
          </span>
        )}

        {/* Price pill */}
        <span
          style={{
            position: 'absolute', top: 12, right: 12,
            fontSize: '0.6875rem', fontWeight: 600,
            color: isFree ? ACCENT : 'var(--foreground)',
            background: 'var(--background)',
            padding: '3px 8px',
            border: '1px solid var(--border)',
          }}
        >
          {minPrice}
        </span>

        {/* Sold-out overlay */}
        {event.is_sold_out && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(19,17,16,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span
              className="label-caps"
              style={{
                fontSize: '0.6875rem', color: '#FAFAF8',
                border: '1.5px solid #FAFAF8', padding: '5px 14px',
              }}
            >
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          {event.city ?? event.location_name} · {formatDate(event.date_start)}
        </p>

        <p
          className="font-playfair"
          style={{
            fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.3,
            marginBottom: '8px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {event.title}
        </p>

        <p
          style={{
            fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.6,
            flex: 1, marginBottom: '16px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {event.description}
        </p>

        {event.date_end !== event.date_start && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Until {formatDate(event.date_end)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px',
          position: 'relative', zIndex: 1, pointerEvents: 'auto',
        }}
      >
        <span className="font-playfair" style={{ fontSize: '1rem', fontWeight: 700 }}>
          {minPrice}
        </span>
        {event.is_sold_out ? (
          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', padding: '7px 16px', border: '1px solid var(--border)' }}>
            Sold Out
          </span>
        ) : (
          <Link href={reserveHref} className="btn-primary btn-sm" style={{ textAlign: 'center' }}>
            {isAuthenticated ? 'Reserve' : 'Sign in to Reserve'}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function PublicEventsGrid({
  events,
  isAuthenticated,
  initialFilters,
}: {
  events: PublicEvent[];
  isAuthenticated: boolean;
  initialFilters: InitialFilters;
}) {
  // All filter state lives here — no server round-trips on change
  const [search,   setSearch]   = useState(initialFilters.q        ?? '');
  const [category, setCategory] = useState(initialFilters.category ?? '');
  const [city,     setCity]     = useState(initialFilters.city     ?? '');
  const [date,     setDate]     = useState(initialFilters.date     ?? 'all');
  const [price,    setPrice]    = useState(initialFilters.price    ?? 'all');
  const [sort,     setSort]     = useState(initialFilters.sort     ?? 'date');

  // Sync URL silently on every filter change (skip first render — URL is already correct)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    syncUrl(search, category, city, date, price, sort);
  }, [search, category, city, date, price, sort]);

  // Unique cities derived from the full event list (not filtered, so city options stay stable)
  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [events]);

  // Client-side filtering + sorting — instant, no network
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let result = events.filter((e) => {
      if (q) {
        const hit =
          e.title.toLowerCase().includes(q) ||
          (e.city ?? '').toLowerCase().includes(q) ||
          e.location_name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (category && e.category !== category) return false;
      if (city     && e.city     !== city)     return false;
      if (!matchesDate(e.date_start, date))    return false;
      if (!matchesPrice(e.categories, price))  return false;
      return true;
    });

    if (sort === 'price') {
      result = [...result].sort((a, b) => {
        const pa = getMinPrice(a.categories) ?? Infinity;
        const pb = getMinPrice(b.categories) ?? Infinity;
        return pa - pb;
      });
    } else if (sort === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort(
        (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
      );
    }

    return result;
  }, [events, search, category, city, date, price, sort]);

  const hasFilters = !!(search || category || city || date !== 'all' || price !== 'all');

  function resetFilters() {
    setSearch('');
    setCategory('');
    setCity('');
    setDate('all');
    setPrice('all');
    setSort('date');
  }

  const selectStyle: React.CSSProperties = {
    border: '1.5px solid var(--border)',
    background: 'var(--input-bg)',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: 'var(--foreground)',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    minWidth: '140px',
  };

  return (
    <>
      {/* ── Search ──────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <input
          className="input-field"
          type="search"
          placeholder="Search events, cities, or keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '480px' }}
        />
      </div>

      {/* ── Category chips ──────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <Chip active={category === ''} onClick={() => setCategory('')}>All</Chip>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
          >
            {cat}
          </Chip>
        ))}
      </div>

      {/* ── City / Date / Price row ──────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '28px' }}>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ ...selectStyle, color: city ? 'var(--foreground)' : 'var(--muted)' }}
        >
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={date} onChange={(e) => setDate(e.target.value)} style={selectStyle}>
          {DATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={price} onChange={(e) => setPrice(e.target.value)} style={selectStyle}>
          {PRICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              fontSize: '0.75rem', color: 'var(--muted)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px 0',
              textDecoration: 'underline', fontFamily: 'inherit',
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ── Count + sort ────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
          {filtered.length === events.length
            ? `${events.length} event${events.length !== 1 ? 's' : ''}`
            : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} of ${events.length}`}
          {!isAuthenticated && filtered.length > 0 && (
            <span style={{ marginLeft: '12px' }}>
              —{' '}
              <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                Sign in to reserve
              </Link>
            </span>
          )}
        </p>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ ...selectStyle, minWidth: '160px', fontSize: '0.8125rem' }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Grid ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="border border-border" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <p className="font-playfair" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
            No events found
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: '20px' }}>
            Try adjusting your filters or search term.
          </p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="btn-outline btn-sm">
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '20px' }}>
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}

      {/* ── Guest CTA ───────────────────────────────────── */}
      {!isAuthenticated && filtered.length > 0 && (
        <div
          className="bg-surface border border-border"
          style={{ marginTop: '48px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}
        >
          <p className="font-playfair" style={{ fontSize: '1.375rem', fontWeight: 600 }}>
            Ready to attend an event?
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', maxWidth: '400px', lineHeight: 1.7 }}>
            Create a free account to reserve tickets, save events, and manage your bookings.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" className="btn-primary">Create Free Account</Link>
            <Link href="/login"    className="btn-outline">Sign in</Link>
          </div>
        </div>
      )}
    </>
  );
}
