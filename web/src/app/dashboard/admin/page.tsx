import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: number; username: string; email: string; full_name: string | null;
  status: 'ACTIVE' | 'SUSPENDED'; role: 'ADMIN' | 'ORGANIZER' | 'USER' | null; created_at: string;
}
interface EventRow {
  id: number; title: string; date_start: string; city: string | null;
  category: string | null; is_active: boolean; total_stock: number;
}
interface Stats {
  totalUsers: number; totalOrganizers: number; totalEvents: number; activeEvents: number;
  recentUsers: UserRow[]; upcomingEvents: EventRow[];
}

async function getStats(): Promise<Stats | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const host = headerStore.get('host') ;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const res = await fetch(`${protocol}://${host}/api/admin/stats`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Stats>;
  } catch { return null; }
}

const ROLE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  ADMIN:     { color: '#C4623F', bg: 'rgba(196,98,63,0.12)',  label: 'Admin'       },
  ORGANIZER: { color: '#C49A3C', bg: 'rgba(196,154,60,0.12)', label: 'Organisateur' },
  USER:      { color: '#2E8B6A', bg: 'rgba(46,139,106,0.12)', label: 'Utilisateur'  },
};
const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: '#2E8B6A', bg: 'rgba(46,139,106,0.1)',  label: 'Actif'    },
  SUSPENDED: { color: '#C4623F', bg: 'rgba(196,98,63,0.1)',   label: 'Suspendu' },
};
const CAT_COLOR: Record<string, string> = {
  Musique: '#7C3AED', Sport: '#2563EB', Culture: '#C49A3C',
  Cinema: '#0E7490', Humour: '#D97706', Art: '#C4623F', Autre: '#6B7280',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const STAT_CARDS = stats
    ? [
        { label: 'Utilisateurs',     value: stats.totalUsers,      sub: 'comptes totaux',  color: '#2E8B6A', icon: '◈' },
        { label: 'Organisateurs',    value: stats.totalOrganizers, sub: 'comptes actifs',  color: '#C49A3C', icon: '◆' },
        { label: 'Événements',       value: stats.totalEvents,     sub: 'total plateforme',color: '#C4623F', icon: '◎' },
        { label: 'Événements actifs',value: stats.activeEvents,    sub: 'publiés',         color: '#2E8B6A', icon: '◇' },
      ]
    : null;

  return (
    <DashboardPage>
    <div className="dash-page">

      {/* Header */}
      <div className="dash-header">
        <p className="eyebrow">Administration</p>
        <h1>Vue d&apos;ensemble</h1>
        <p>Statistiques et activité récente de la plateforme.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/admin/events/new" className="btn-primary btn-sm">
          + Créer un événement
        </Link>
        <Link href="/dashboard/admin/users" className="btn-outline btn-sm">
          <span>Gérer les utilisateurs</span>
        </Link>
        <Link href="/dashboard/admin/events" className="btn-outline btn-sm">
          <span>Tous les événements</span>
        </Link>
      </div>

      {/* Stat cards */}
      {STAT_CARDS ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '48px' }}>
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: s.color, fontSize: '1rem' }}>{s.icon}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '4px', color: s.color }}>
                {s.value.toLocaleString('fr-FR')}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-dim)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '48px' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} className="stat-card shimmer" style={{ height: '130px', opacity: 0.4 }} />
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="admin-two-col">

        {/* Recent users */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ width: '18px', height: '1.5px', background: 'var(--primary)', marginBottom: '7px' }} />
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
                Utilisateurs récents
              </h2>
            </div>
            <Link href="/dashboard/admin/users" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}>
              Voir tous →
            </Link>
          </div>

          {stats && stats.recentUsers.length > 0 ? (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Utilisateur', 'Rôle', 'Statut', 'Inscription'].map((col) => (
                      <th key={col} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.625rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => {
                    const st = STATUS_STYLE[u.status] ?? STATUS_STYLE.ACTIVE;
                    const rc = u.role ? (ROLE_COLORS[u.role] ?? ROLE_COLORS.USER) : null;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0,
                              background: rc ? rc.bg : 'var(--surface-3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700,
                              color: rc ? rc.color : 'var(--muted)',
                            }}>
                              {(u.full_name || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>
                                {u.full_name || u.username}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {rc ? (
                            <span style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: rc.color, background: rc.bg, padding: '3px 8px' }}>
                              {rc.label}
                            </span>
                          ) : <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: st.color, background: st.bg }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {fmt(u.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                {stats ? 'Aucun utilisateur pour le moment.' : 'Impossible de charger les données.'}
              </p>
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ width: '18px', height: '1.5px', background: 'var(--accent)', marginBottom: '7px' }} />
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600 }}>
                Prochains événements
              </h2>
            </div>
            <Link href="/dashboard/admin/events" style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' }}>
              Voir tous →
            </Link>
          </div>

          {stats && stats.upcomingEvents.length > 0 ? (
            <div>
              {stats.upcomingEvents.map((ev, idx) => (
                <Link key={ev.id} href={`/dashboard/admin/events/${ev.id}/edit`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx < stats.upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {ev.city ? `${ev.city} · ` : ''}{fmt(ev.date_start)}
                          </p>
                          <span style={{
                            width: '5px', height: '5px', borderRadius: '50', flexShrink: 0,
                            background: ev.is_active ? '#2E8B6A' : 'var(--muted)',
                          }} />
                        </div>
                      </div>
                      {ev.category && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: CAT_COLOR[ev.category] ?? '#6B7280',
                          background: `${CAT_COLOR[ev.category] ?? '#6B7280'}14`,
                          padding: '3px 8px', flexShrink: 0,
                        }}>
                          {ev.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                {stats ? 'Aucun événement à venir.' : 'Impossible de charger les données.'}
              </p>
              {stats && (
                <Link href="/dashboard/admin/events/new" className="btn-primary btn-sm">
                  Créer un événement
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
    </DashboardPage>
  );
}
