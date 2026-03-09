'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface Event {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  location_name: string;
  is_active: boolean;
  total_stock: number;
  categories: TicketCategory[];
}

const accent = '#C2533A';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EventsTable({ events }: { events: Event[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ id: number; title: string } | null>(null);

  function askDelete(id: number, title: string) {
    setConfirm({ id, title });
  }

  async function handleDelete() {
    if (!confirm) return;
    const { id } = confirm;
    setConfirm(null);
    setDeleting(id);
    setError('');
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erreur lors de la suppression.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setDeleting(null);
    }
  }

  if (events.length === 0) {
    return (
      <div style={{ border: '1px solid var(--border)', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>
          Aucun événement
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          Créez le premier événement via le bouton ci-dessus.
        </p>
      </div>
    );
  }

  return (
    <>
      {confirm && (
        <ConfirmModal
          title="Supprimer l'événement"
          message={`Vous êtes sur le point de supprimer « ${confirm.title} ». Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {error && (
        <p style={{ fontSize: '0.875rem', color: accent, marginBottom: '12px' }}>{error}</p>
      )}

      <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['Titre', 'Lieu', 'Dates', 'Capacité', 'Statut', ''].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{event.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {event.categories.length} catégorie{event.categories.length !== 1 ? 's' : ''}
                  </p>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {event.location_name}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.8125rem' }}>{formatDate(event.date_start)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>→ {formatDate(event.date_end)}</p>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem', textAlign: 'right' }}>
                  {event.total_stock}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: event.is_active ? '#4A7C6F' : 'var(--muted)',
                      background: event.is_active ? 'rgba(74,124,111,0.12)' : 'var(--surface)',
                      padding: '3px 8px',
                    }}
                  >
                    {event.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link
                      href={`/dashboard/admin/events/${event.id}/edit`}
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.06em',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        padding: '4px 10px',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => askDelete(event.id, event.title)}
                      disabled={deleting === event.id}
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.06em',
                        color: accent,
                        border: `1px solid ${accent}`,
                        background: 'transparent',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        opacity: deleting === event.id ? 0.5 : 1,
                        fontFamily: 'var(--font-inter), system-ui, sans-serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {deleting === event.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
