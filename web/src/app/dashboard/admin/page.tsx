import { cookies, headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  role: 'ADMIN' | 'ORGANIZER' | 'USER' | null;
  created_at: string;
}

interface EventRow {
  id: number;
  title: string;
  date_start: string;
  city: string | null;
  category: string | null;
  is_active: boolean;
  total_stock: number;
}

interface Stats {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  activeEvents: number;
  recentUsers: UserRow[];
  upcomingEvents: EventRow[];
}

async function getStats(): Promise<Stats | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/admin/stats`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Stats>;
  } catch {
    return null;
  }
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:     '#C2533A',
  ORGANIZER: '#B8862D',
  USER:      '#4A7C6F',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN:     'Admin',
  ORGANIZER: 'Organisateur',
  USER:      'Utilisateur',
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: '#4A7C6F', bg: '#4A7C6F18', label: 'Actif'    },
  SUSPENDED: { color: '#C2533A', bg: '#C2533A14', label: 'Suspendu' },
};

const CAT_COLOR: Record<string, string> = {
  Musique: '#6B3FA0',
  Sport:   '#2563EB',
  Culture: '#B8862D',
  Cinema:  '#0E7490',
  Humour:  '#D97706',
  Art:     '#C2533A',
  Autre:   '#6B7280',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = stats
    ? [
        { label: 'Utilisateurs',       value: stats.totalUsers,      sub: 'comptes actifs'   },
        { label: 'Organisateurs',       value: stats.totalOrganizers, sub: 'comptes actifs'   },
        { label: 'Événements',          value: stats.totalEvents,     sub: 'total plateforme' },
        { label: 'Événements actifs',   value: stats.activeEvents,    sub: 'publiés'          },
      ]
    : null;

  return (
    <div className="dash-page">

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#C2533A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
          Administration
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '6px' }}>
          Vue d&apos;ensemble
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Statistiques et activité récente de la plateforme.
        </p>
      </div>

      {/* Stats */}
      {statCards ? (
        <div className="stat-grid-4" style={{ marginBottom: '40px' }}>
          {statCards.map((s) => (
            <div key={s.label} style={{ background: 'var(--background)', padding: '28px 24px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '4px' }}>
                {s.value.toLocaleString('fr-FR')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-grid-4" style={{ marginBottom: '40px' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{ background: 'var(--background)', padding: '28px 24px', opacity: 0.4 }}>
              <div style={{ height: '12px', background: 'var(--border)', marginBottom: '14px', width: '60%' }} />
              <div style={{ height: '36px', background: 'var(--border)', marginBottom: '8px', width: '40%' }} />
              <div style={{ height: '10px', background: 'var(--border)', width: '50%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="admin-two-col">

        {/* Recent users */}
        <div style={{ border: '1px solid var(--border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
              Utilisateurs récents
            </h2>
            <Link href="/dashboard/admin/users" style={{ fontSize: '0.8125rem', color: '#C2533A' }}>
              Voir tous →
            </Link>
          </div>

          {stats && stats.recentUsers.length > 0 ? (
            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Utilisateur', 'Rôle', 'Statut', 'Inscription'].map((col) => (
                    <th key={col} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => {
                  const st = STATUS_STYLE[u.status] ?? STATUS_STYLE.ACTIVE;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '13px 20px' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>
                          {u.full_name || u.username}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</p>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        {u.role ? (
                          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: ROLE_COLOR[u.role] ?? 'var(--muted)' }}>
                            {ROLE_LABEL[u.role] ?? u.role}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '0.8125rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {fmt(u.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                {stats ? 'Aucun utilisateur pour le moment.' : 'Impossible de charger les données.'}
              </p>
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div style={{ border: '1px solid var(--border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
              Prochains événements
            </h2>
            <Link href="/dashboard/admin/events" style={{ fontSize: '0.8125rem', color: '#C2533A' }}>
              Voir tous →
            </Link>
          </div>

          {stats && stats.upcomingEvents.length > 0 ? (
            <div>
              {stats.upcomingEvents.map((ev, idx) => (
                <Link
                  key={ev.id}
                  href={`/dashboard/admin/events/${ev.id}/edit`}
                  style={{
                    display: 'block',
                    padding: '16px 20px',
                    borderBottom: idx < stats.upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {ev.city ? `${ev.city} · ` : ''}{fmt(ev.date_start)}
                      </p>
                    </div>
                    {ev.category && (
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: CAT_COLOR[ev.category] ?? '#6B7280',
                        background: `${CAT_COLOR[ev.category] ?? '#6B7280'}14`,
                        padding: '3px 8px', flexShrink: 0,
                      }}>
                        {ev.category}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                {stats ? 'Aucun événement à venir.' : 'Impossible de charger les données.'}
              </p>
              {stats && (
                <Link href="/dashboard/admin/events/new" style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.875rem', color: '#C2533A' }}>
                  Créer un événement →
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
