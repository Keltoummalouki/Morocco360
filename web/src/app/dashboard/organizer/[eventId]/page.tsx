'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';

interface EventStats {
  title: string;
  capacity: number;
  sold: number;
  checkedIn: number;
  pending: number;
  cancelled: number;
  remaining: number;
  checkInRate: number;
  byCategory: { name: string; total: number; checked: number; remaining: number }[];
}

type Tab = 'overview' | 'participants';

function DonutChart({ pct, size = 148 }: { pct: number; size?: number }) {
  const r = (size / 2) * 0.74;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#4A7C6F" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={size / 2} y={size / 2 - 9} textAnchor="middle" fontSize={size * 0.21} fontWeight="700" fill="var(--foreground)" style={{ fontFamily: 'var(--font-playfair)' }}>
        {pct}%
      </text>
      <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontSize={size * 0.085} fill="var(--muted)">
        enregistrés
      </text>
    </svg>
  );
}

export default function ManageEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [tab, setTab]           = useState<Tab>('overview');
  const [stats, setStats]       = useState<EventStats | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    if (!/^\d+$/.test(eventId)) { setError(`ID invalide : "${eventId}"`); return; }
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/stats`);
      if (!res.ok) throw new Error();
      setStats(await res.json() as EventStats);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError('Impossible de charger les statistiques.');
    }
  }, [eventId]);

  useEffect(() => {
    void loadStats();
    const iv = setInterval(() => void loadStats(), 10_000);
    return () => clearInterval(iv);
  }, [loadStats]);

  const total     = stats?.sold      ?? 0;
  const checkedIn = stats?.checkedIn ?? 0;
  const pending   = stats?.pending   ?? 0;
  const cancelled = stats?.cancelled ?? 0;
  const valid     = Math.max(0, total - checkedIn - pending - cancelled);
  const p         = stats?.checkInRate ?? 0;

  const breakdown = stats ? [
    { label: 'Enregistrés', count: checkedIn, color: '#4A7C6F', bg: '#4A7C6F18' },
    { label: 'Valides',     count: valid,     color: '#6B7280', bg: '#6B728014' },
    { label: 'En attente',  count: pending,   color: '#B8862D', bg: '#B8862D18' },
    { label: 'Annulés',     count: cancelled, color: '#C2533A', bg: '#C2533A14' },
  ] : [];

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>

      {/* Breadcrumb + title */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/dashboard/organizer/events" style={{ fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
          ← Tous les événements
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
              Gestion événement
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700 }}>
              {stats?.title ?? '—'}
            </h1>
          </div>

          {/* Scan button */}
          <Link
            href={`/dashboard/scanner/${eventId}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 24px', background: '#4A7C6F', color: '#fff',
              fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none',
              flexShrink: 0, marginTop: '28px',
            }}
          >
            ◎ Scanner les billets
          </Link>
        </div>

        {lastRefresh && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', border: '1px solid #dc262630', background: '#dc262608', color: '#dc2626', fontSize: '0.875rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '28px' }}>
        {([
          { key: 'overview' as Tab,      label: 'Statistiques'  },
          { key: 'participants' as Tab,  label: 'Participants'  },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 24px', fontSize: '0.875rem',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--foreground)' : 'var(--muted)',
              background: 'none', border: 'none',
              borderBottom: tab === key ? '2px solid var(--foreground)' : '2px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── STATISTICS TAB ── */}
      {tab === 'overview' && stats && (
        <>
          {/* Donut + breakdown side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1px', background: 'var(--border)', marginBottom: '20px' }}>

            {/* Donut */}
            <div style={{ background: 'var(--background)', padding: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DonutChart pct={p} size={148} />
            </div>

            {/* Breakdown */}
            <div style={{ background: 'var(--background)', padding: '28px 32px' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
                Répartition des billets
              </p>
              {/* Stacked bar */}
              {total > 0 && (
                <div style={{ display: 'flex', height: '7px', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                  {breakdown.filter((s) => s.count > 0).map((s) => (
                    <div key={s.label} style={{ width: `${(s.count / total) * 100}%`, background: s.color, transition: 'width 0.6s ease' }} />
                  ))}
                </div>
              )}
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {breakdown.map((s) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: s.color }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.count}</span>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 8px', background: s.bg, color: s.color, borderRadius: '2px', minWidth: '38px', textAlign: 'center' }}>
                        {total > 0 ? Math.round((s.count / total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1px', background: 'var(--border)' }}>
            {[
              { label: 'Billets vendus',   value: total,      accent: false },
              { label: 'Enregistrés',     value: checkedIn,  accent: true  },
              { label: 'En attente',      value: pending,    accent: false },
              { label: 'Annulés',         value: cancelled,  accent: false },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--background)', padding: '22px 24px' }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.875rem', fontWeight: 700, color: s.accent ? '#4A7C6F' : 'var(--foreground)' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* By category */}
          {stats.byCategory && stats.byCategory.length > 0 && (
            <div style={{ marginTop: '20px', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Par catégorie</p>
              </div>
              {stats.byCategory.map((cat) => {
                const catPct = cat.total > 0 ? Math.round((cat.checked / cat.total) * 100) : 0;
                return (
                  <div key={cat.name} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{cat.name || '—'}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', minWidth: '80px', textAlign: 'right' }}>{cat.checked} / {cat.total}</p>
                    <div style={{ width: '100px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${catPct}%`, background: '#4A7C6F' }} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>{catPct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── PARTICIPANTS TAB ── */}
      {tab === 'participants' && (
        <div>
          <div style={{ border: '1px solid var(--border)', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>
                Exporter la liste des participants
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                CSV avec noms, emails, catégories et statut de pointage.
              </p>
            </div>
            <a
              href={`/api/organizer/events/${eventId}/attendees/export`}
              download
              style={{ padding: '10px 24px', background: '#B8862D', color: '#fff', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '24px' }}
            >
              Exporter CSV
            </a>
          </div>

          {stats && (
            <div className="grid grid-cols-3" style={{ gap: '1px', background: 'var(--border)' }}>
              {[
                { label: 'Total',        value: total            },
                { label: 'Enregistrés', value: checkedIn        },
                { label: 'Non arrivés', value: total - checkedIn },
              ].map((s) => (
                <div key={s.label} style={{ background: 'var(--background)', padding: '20px 24px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{s.label}</p>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700 }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
