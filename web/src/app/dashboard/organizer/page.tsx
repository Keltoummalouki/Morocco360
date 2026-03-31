'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface EventStats { totalTickets: number; checkedIn: number; pending: number; cancelled: number; }
interface EventSummary {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  city: string;
  location_name: string;
  stats: EventStats;
}

function pct(ev: EventSummary) {
  const t = ev.stats?.totalTickets ?? 0;
  return t > 0 ? Math.round(((ev.stats?.checkedIn ?? 0) / t) * 100) : 0;
}

function EventCard({ ev }: { ev: EventSummary }) {
  const p = pct(ev);
  const t = ev.stats?.totalTickets ?? 0;
  const c = ev.stats?.checkedIn ?? 0;
  return (
    <Link href={`/dashboard/organizer/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ border: '1px solid var(--border)', padding: '20px 24px', cursor: 'pointer', background: 'var(--background)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.title}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
              {ev.city} · {new Date(ev.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, color: p >= 80 ? '#4A7C6F' : p >= 40 ? '#B8862D' : 'var(--muted)' }}>
            {p}%
          </span>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${p}%`, background: p >= 80 ? '#4A7C6F' : p >= 40 ? '#B8862D' : '#6B7280', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c} / {t} enregistrés</p>
          <span style={{ fontSize: '0.8125rem', color: '#B8862D', fontWeight: 500 }}>Gérer →</span>
        </div>
      </div>
    </Link>
  );
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const totalChecked = events.reduce((s, e) => s + (e.stats?.checkedIn ?? 0), 0);
  const overallRate  = totalTickets > 0 ? Math.round((totalChecked / totalTickets) * 100) : 0;
  const recent       = [...events].sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()).slice(0, 3);

  return (
    <div className="dash-page" style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
          Espace Organisateur
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '6px' }}>
          Tableau de bord
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Vue d&apos;ensemble de vos événements en temps réel.
        </p>
      </div>

      {/* Stat cards */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1px', background: 'var(--border)', marginBottom: '40px' }}>
          {[
            { label: 'Événements',       value: String(events.length)  },
            { label: 'Billets vendus',   value: String(totalTickets)   },
            { label: 'Enregistrements', value: String(totalChecked)   },
            { label: 'Taux global',      value: `${overallRate}%`      },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--background)', padding: '24px' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: '100px', background: 'var(--border)', opacity: 0.4 }} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', border: '1px solid #dc262630', background: '#dc262608', color: '#dc2626', fontSize: '0.875rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Recent events */}
      {!loading && !error && events.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 600 }}>
              Événements récents
            </h2>
            <Link href="/dashboard/organizer/events" style={{ fontSize: '0.875rem', color: '#B8862D', textDecoration: 'none', fontWeight: 500 }}>
              Voir tous ({events.length}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recent.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Aucun événement</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Aucun événement ne vous a encore été assigné par l&apos;administrateur.</p>
        </div>
      )}
    </div>
  );
}
