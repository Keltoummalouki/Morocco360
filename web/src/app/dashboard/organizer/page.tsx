'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';
import { AnimatedProgressBar } from '@/components/DashboardAnimations';

interface EventStats { totalTickets: number; checkedIn: number; pending: number; cancelled: number; }
interface EventSummary {
  id: number; title: string; date_start: string; date_end: string;
  city: string; location_name: string; stats: EventStats;
}

function pct(ev: EventSummary) {
  const t = ev.stats?.totalTickets ?? 0;
  return t > 0 ? Math.round(((ev.stats?.checkedIn ?? 0) / t) * 100) : 0;
}

function EventCard({ ev }: { ev: EventSummary }) {
  const p    = pct(ev);
  const t    = ev.stats?.totalTickets ?? 0;
  const c    = ev.stats?.checkedIn    ?? 0;
  const color = p >= 80 ? '#2E8B6A' : p >= 40 ? '#C49A3C' : 'var(--muted)';

  return (
    <Link href={`/dashboard/organizer/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="border-glow-card" style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 600, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.title}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
              {ev.city} · {new Date(ev.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.875rem', fontWeight: 700, color, lineHeight: 1 }}>{p}%</p>
            <p style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '3px' }}>check-in</p>
          </div>
        </div>

        {/* Progress bar */}
        <AnimatedProgressBar value={p} color={color} height={4} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c} / {t} enregistrés</p>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600, color: '#C49A3C',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            Gérer
            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function OrganizerDashboard() {
  const [events,  setEvents]  = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/events');
      if (!res.ok) throw new Error();
      setEvents(await res.json() as EventSummary[]);
      setError(null);
    } catch {
      setError('Impossible de charger les événements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const iv = setInterval(() => void load(), 30_000);
    return () => clearInterval(iv);
  }, [load]);

  const totalTickets = events.reduce((s, e) => s + (e.stats?.totalTickets ?? 0), 0);
  const totalChecked = events.reduce((s, e) => s + (e.stats?.checkedIn   ?? 0), 0);
  const overallRate  = totalTickets > 0 ? Math.round((totalChecked / totalTickets) * 100) : 0;
  const recent       = [...events].sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()).slice(0, 3);

  const STATS = events.length > 0
    ? [
        { label: 'Événements',       value: String(events.length),  color: '#2E8B6A', icon: '◆' },
        { label: 'Billets vendus',   value: String(totalTickets),   color: '#C49A3C', icon: '◈' },
        { label: 'Enregistrements', value: String(totalChecked),   color: '#C4623F', icon: '◎' },
        { label: 'Taux global',      value: `${overallRate}%`,      color: '#2E8B6A', icon: '◇' },
      ]
    : null;

  return (
    <DashboardPage>
    <div className="dash-page">

      {/* Header */}
      <div className="dash-header">
        <p className="eyebrow">Espace Organisateur</p>
        <h1>Tableau de bord</h1>
        <p>Vue d&apos;ensemble de vos événements en temps réel.</p>
      </div>

      {/* CTA bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/organizer/events" className="btn-primary btn-sm">
          Tous les événements
        </Link>
        <button
          onClick={() => void load()}
          className="btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualiser</span>
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} className="stat-card shimmer" style={{ height: '120px', opacity: 0.5 }} />
          ))}
        </div>
      ) : STATS ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: s.color, fontSize: '0.9375rem' }}>{s.icon}</span>
                <span className="live-pulse" style={{ background: s.color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '5px', color: s.color }}>
                {s.value}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <div style={{
          padding: '16px 20px', marginBottom: '24px',
          border: '1px solid rgba(224,82,82,0.25)',
          background: 'rgba(224,82,82,0.06)',
          color: 'var(--error)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '0.875rem',
        }}>
          <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Recent events */}
      {!loading && !error && events.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div className="section-divider" />
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 600 }}>
                Événements récents
              </h2>
            </div>
            <Link href="/dashboard/organizer/events" style={{ fontSize: '0.875rem', color: '#C49A3C', textDecoration: 'none', fontWeight: 500 }}>
              Voir tous ({events.length}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div style={{ padding: '64px 24px', textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--surface)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.3 }}>◆</div>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Aucun événement</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto' }}>
            Aucun événement ne vous a encore été assigné par l&apos;administrateur.
          </p>
        </div>
      )}
    </div>
    </DashboardPage>
  );
}
