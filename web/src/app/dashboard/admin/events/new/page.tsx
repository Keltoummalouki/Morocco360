import Link from 'next/link';
import EventForm from '@/components/EventForm';

export default function NewEventPage() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: '800px' }}>
      <Link
        href="/dashboard/admin/events"
        style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'inline-block', marginBottom: '32px' }}
      >
        ← Retour aux événements
      </Link>

      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: '#C2533A',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Administration
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
          }}
        >
          Créer un événement
        </h1>
      </div>

      <EventForm />
    </div>
  );
}
