import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
        background: 'var(--background)',
      }}
    >
      {/* Brand */}
      <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '48px', color: 'var(--foreground)' }}>
        Morocco<span style={{ color: 'var(--primary)' }}>360</span>
      </p>

      {/* Icon */}
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: '#C2533A14', border: '2px solid #C2533A30',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', marginBottom: '24px',
      }}>
        ⊘
      </div>

      {/* Heading */}
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>
        Compte suspendu
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '380px', lineHeight: 1.6, marginBottom: '32px' }}>
        Votre compte a été suspendu par un administrateur. Pour toute question, veuillez contacter le support.
      </p>

      {/* Contact */}
      <a
        href="mailto:support@morocco360.ma"
        style={{
          display: 'inline-block', padding: '11px 28px',
          background: '#C2533A', color: '#fff',
          fontSize: '0.9375rem', fontWeight: 600,
          textDecoration: 'none', marginBottom: '16px',
        }}
      >
        Contacter le support
      </a>

      {/* Logout link */}
      <Link
        href="/api/auth/logout"
        style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'underline' }}
      >
        Se déconnecter
      </Link>
    </div>
  );
}
