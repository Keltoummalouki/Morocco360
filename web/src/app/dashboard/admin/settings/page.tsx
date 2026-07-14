import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';

const CARDS = [
  {
    href: '/dashboard/admin/settings/countries',
    title: 'Pays',
    desc: 'Pays, coordonnées et langues associées.',
    color: '#2E8B6A',
    icon: '◇',
  },
  {
    href: '/dashboard/admin/settings/cities',
    title: 'Villes',
    desc: 'Villes rattachées à un pays.',
    color: '#C49A3C',
    icon: '◎',
  },
  {
    href: '/dashboard/admin/settings/languages',
    title: 'Langues',
    desc: 'Langues disponibles et pays où elles sont parlées.',
    color: '#0E7490',
    icon: '◈',
  },
  {
    href: '/dashboard/admin/settings/event-categories',
    title: 'Catégories d’événements',
    desc: 'Taxonomie de classement des événements.',
    color: '#C4623F',
    icon: '◆',
  },
];

export default function AdminSettingsIndex() {
  return (
    <DashboardPage>
      <div className="dash-page">
        <div className="dash-header">
          <p className="eyebrow">Administration</p>
          <h1>Paramètres</h1>
          <p>Données de référence de la plateforme.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="stat-card"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span style={{ color: c.color, fontSize: '1.125rem' }}>
                  {c.icon}
                </span>
                <span style={{ color: 'var(--muted-dim)' }}>→</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                {c.title}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {c.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
}
