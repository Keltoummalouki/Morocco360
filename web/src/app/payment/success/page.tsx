import Link from 'next/link';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const accent = '#4A7C6F';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          border: '1px solid var(--border)',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `${accent}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '1.75rem',
          }}
        >
          ✓
        </div>

        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: accent,
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Paiement confirmé
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          Réservation réussie !
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '8px' }}>
          Votre paiement a été traité avec succès. Vos billets ont été générés.
        </p>

        {order_id && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '32px' }}>
            Référence commande :{' '}
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              #{order_id}
            </span>
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/dashboard/user/events"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center' }}
          >
            Voir les événements
          </Link>
          <Link
            href="/dashboard/user"
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted)',
              textDecoration: 'underline',
            }}
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
