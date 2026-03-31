'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface EventStats { totalTickets: number; checkedIn: number; }
interface EventSummary {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  city: string;
  location_name: string;
  stats: EventStats;
}

const PAGE_SIZE = 6;

function pct(ev: EventSummary) {
  const t = ev.stats?.totalTickets ?? 0;
  return t > 0 ? Math.round(((ev.stats?.checkedIn ?? 0) / t) * 100) : 0;
}

export default function OrganizerEventsPage() {
  const [events, setEvents]   = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/events');
      if (!res.ok) throw new Error();
      const data = await res.json() as EventSummary[];
      setEvents(data.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()));
      setError(null);
    } catch {
      setError('Impossible de charger les événements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const pageEvents = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="dash-page" style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/dashboard/organizer" style={{ fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Tableau de bord
        </Link>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
          Espace Organisateur
        </p>
        <div className="flex items-baseline justify-between gap-4">
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, lineHeight: 1.2 }}>
            Tous les événements
          </h1>
          {!loading && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {events.length} événement{events.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ height: '88px', background: 'var(--border)', opacity: 0.35 }} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', border: '1px solid #dc262630', background: '#dc262608', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Aucun événement</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Aucun événement ne vous a été assigné.</p>
        </div>
      )}

      {/* Event list */}
      {!loading && pageEvents.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', marginBottom: '24px' }}>
            {pageEvents.map((ev) => {
              const p = pct(ev);
              const t = ev.stats?.totalTickets ?? 0;
              const c = ev.stats?.checkedIn ?? 0;
              const pColor = p >= 80 ? '#4A7C6F' : p >= 40 ? '#B8862D' : 'var(--muted)';
              const barColor = p >= 80 ? '#4A7C6F' : p >= 40 ? '#B8862D' : '#6B7280';
              return (
                <div key={ev.id} style={{ background: 'var(--background)', padding: '16px' }}>

                  {/* Top row: date | info | button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                    {/* Date block */}
                    <div style={{ textAlign: 'center', minWidth: '44px', flexShrink: 0 }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-playfair)', lineHeight: 1 }}>
                        {new Date(ev.date_start).getDate()}
                      </p>
                      <p style={{ fontSize: '0.625rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {new Date(ev.date_start).toLocaleDateString('fr-FR', { month: 'short' })}
                      </p>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '36px', background: 'var(--border)', flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.city}{ev.location_name ? ` · ${ev.location_name}` : ''}
                      </p>
                    </div>

                    {/* Action */}
                    <Link
                      href={`/dashboard/organizer/${ev.id}`}
                      className="btn-primary btn-action"
                      style={{ flexShrink: 0 }}
                    >
                      Gérer
                    </Link>
                  </div>

                  {/* Bottom row: progress bar (full width) */}
                  <div style={{ marginTop: '12px', paddingLeft: '56px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c} / {t} enregistrés</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: pColor }}>{p}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p}%`, background: barColor, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: page === 1 ? 0.4 : 1 }}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{
                    padding: '7px 14px', border: '1px solid var(--border)', fontSize: '0.875rem', cursor: 'pointer',
                    background: n === page ? 'var(--foreground)' : 'none',
                    color: n === page ? 'var(--background)' : 'var(--foreground)',
                    fontWeight: n === page ? 600 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: page === totalPages ? 0.4 : 1 }}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
