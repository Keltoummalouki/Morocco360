'use client';

import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from '@/components/LocaleProvider';
import type { Translations } from '@/lib/i18n';
import type { EventWithCoords } from './EventsMap';

const EventsMap = dynamic<{ events: EventWithCoords[] }>(
  () => import('./EventsMap'),
  { ssr: false },
);

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
  latitude: number | null;
  longitude: number | null;
  total_stock: number;
  is_active: boolean;
  image_url: string | null;
  categories: TicketCategory[];
}

const CATEGORIES = ['Musique', 'Sport', 'Culture', 'Cinema', 'Humour', 'Art', 'Autre'];
const ACCENT = '#4A7C6F';

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

function minPrice(categories: TicketCategory[], te: Translations['events']): string {
  if (!categories.length) return te.free;
  const prices = categories.map((c) => Number(c.price));
  const min = Math.min(...prices);
  return min === 0 ? te.free : `${te.from} ${min.toFixed(0)} ${te.currency}`;
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
  isSaved,
  onToggleSave,
}: {
  event: Event;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const { t, locale } = useLocale();
  const te = t.events;
  return (
    <div
      className="card-hover"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Clickable overlay for navigation (below save button) */}
      <Link
        href={`/dashboard/user/events/${event.id}`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}
        aria-label={event.title}
      />

      {/* Image */}
      <div
        style={{
          height: '140px',
          background: 'var(--surface)',
          flexShrink: 0,
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', color: 'var(--border)' }}>◈</span>
          </div>
        )}
        {event.category && (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              insetInlineStart: '12px',
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
        {/* Save button — above the link overlay */}
        <button
          type="button"
          onClick={() => onToggleSave(event.id)}
          title={isSaved ? 'Retirer des sauvegardés' : 'Sauvegarder'}
          style={{
            position: 'absolute',
            top: '10px',
            insetInlineEnd: '10px',
            background: isSaved ? ACCENT : 'var(--background)',
            border: `1px solid ${isSaved ? ACCENT : 'var(--border)'}`,
            color: isSaved ? '#fff' : 'var(--muted)',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            pointerEvents: 'auto',
            zIndex: 2,
          }}
        >
          <svg width="13" height="16" viewBox="0 0 13 16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1.75C1 1.336 1.336 1 1.75 1h9.5C11.664 1 12 1.336 12 1.75V15l-5.5-3L1 15V1.75z" />
            </svg>
        </button>
      </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 0', flex: 1, position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', lineHeight: 1.4 }}>
              {event.city ?? event.location_name}
            </span>
            <span style={{ fontSize: '0.6875rem', color: ACCENT, background: `${ACCENT}14`, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {minPrice(event.categories, te)}
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
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{formatDate(event.date_start, locale)}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>— {formatDate(event.date_end, locale)}</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {event.categories.length} {event.categories.length !== 1 ? te.tickets : te.ticket}
          </span>
        </div>
      </div>
  );
}

export default function EventsGrid({
  events,
  initialSavedIds = [],
}: {
  events: Event[];
  initialSavedIds?: number[];
}) {
  const { t, locale } = useLocale();
  const te = t.events;
  const td = t.dates;

  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeCity, setActiveCity]         = useState('');
  const [activeDate, setActiveDate]         = useState('all');
  const [viewMode, setViewMode]             = useState<'grid' | 'map'>('grid');
  const [savedIds, setSavedIds]             = useState<Set<number>>(() => new Set(initialSavedIds));

  const toggleSave = useCallback(async (eventId: number) => {
    const wasSaved = savedIds.has(eventId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(eventId); else next.add(eventId);
      return next;
    });
    try {
      await fetch(`/api/events/${eventId}/save`, {
        method: wasSaved ? 'DELETE' : 'POST',
      });
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(eventId); else next.delete(eventId);
        return next;
      });
    }
  }, [savedIds]);

  const dateOptions = [
    { label: td.all,         value: 'all'     },
    { label: td.month,       value: 'month'   },
    { label: td.threeMonths, value: '3months' },
    { label: td.year,        value: 'year'    },
  ];

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

  function countLabel() {
    const n = filtered.length;
    const total = events.length;
    if (n === total) {
      return `${n} ${n !== 1 ? te.events : te.event}`;
    }
    return `${n} ${n !== 1 ? te.results : te.result} ${te.of} ${total}`;
  }

  const selectStyle: React.CSSProperties = {
    border: '1.5px solid var(--border)',
    background: 'var(--background)',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: 'var(--foreground)',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: active ? 600 : 400,
    color: active ? ACCENT : 'var(--muted)',
    background: active ? `${ACCENT}14` : 'transparent',
    border: `1px solid ${active ? ACCENT : 'var(--border)'}`,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: locale !== 'ar' ? '0.06em' : '0',
  });

  return (
    <>
      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          className="input-field"
          type="text"
          placeholder={te.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '420px' }}
        />
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <ChipButton active={activeCategory === ''} onClick={() => setActiveCategory('')}>
          {te.allCategories}
        </ChipButton>
        {CATEGORIES.map((cat) => (
          <ChipButton
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
          >
            {cat}
          </ChipButton>
        ))}
      </div>

      {/* City + Date + Reset row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px', alignItems: 'center' }}>
        <select
          value={activeCity}
          onChange={(e) => setActiveCity(e.target.value)}
          style={{ ...selectStyle, color: activeCity ? 'var(--foreground)' : 'var(--muted)' }}
        >
          <option value="">{te.allCities}</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={activeDate}
          onChange={(e) => setActiveDate(e.target.value)}
          style={selectStyle}
        >
          {dateOptions.map((o) => (
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
              fontFamily: 'inherit',
            }}
          >
            {te.reset}
          </button>
        )}
      </div>

      {/* Count + view toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
          {countLabel()}
        </p>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => setViewMode('grid')} style={viewBtnStyle(viewMode === 'grid')}>
            {te.gridView}
          </button>
          <button type="button" onClick={() => setViewMode('map')} style={viewBtnStyle(viewMode === 'map')}>
            {te.mapView}
          </button>
        </div>
      </div>

      {/* Map view */}
      {viewMode === 'map' && <EventsMap events={filtered} />}

      {/* Grid view */}
      {viewMode === 'grid' && (
        filtered.length === 0 ? (
          <div style={{ border: '1px solid var(--border)', padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>
              {te.noResults}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              {te.noResultsHint}{' '}
              <button
                onClick={resetFilters}
                style={{ color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0, fontFamily: 'inherit' }}
              >
                {te.resetHere}
              </button>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSaved={savedIds.has(event.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )
      )}
    </>
  );
}
