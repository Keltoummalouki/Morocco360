import Link from 'next/link';

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  await searchParams; // consume to avoid unused warning

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
            background: 'rgba(194,83,58,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '1.75rem',
            color: '#C2533A',
          }}
        >
          ✕
        </div>

        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#C2533A',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Paiement annulé
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          Réservation annulée
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Votre paiement a été annulé. Aucun montant n&apos;a été débité. Vous pouvez réessayer à tout moment.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/dashboard/user/events"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center' }}
          >
            Retour aux événements
          </Link>
        </div>
      </div>
    </div>
  );
}
