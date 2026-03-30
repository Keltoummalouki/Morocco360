'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AssignedEvent {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  city: string;
  location_name: string;
}

export default function ScannerHomePage() {
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/scanner/events')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setEvents(data as AssignedEvent[]))
      .catch(() => setError('Unable to load assigned events.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
        Scanner
      </p>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
        Assigned Events
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: '32px' }}>
        Select an event to start scanning tickets.
      </p>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.map((ev) => (
          <Link key={ev.id} href={`/dashboard/scanner/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid var(--border)', padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>{ev.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  {ev.city} · {new Date(ev.date_start).toLocaleDateString('fr-FR')}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{ev.location_name}</p>
              </div>
              <span style={{ fontSize: '1.25rem', color: 'var(--muted)' }}>›</span>
            </div>
          </Link>
        ))}
        {!loading && events.length === 0 && !error && (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No events assigned to you.</p>
        )}
      </div>
    </div>
  );
}
