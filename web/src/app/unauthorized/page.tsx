import Link from 'next/link';
import { cookies } from 'next/headers';
import { ROLE_HOME, type Role } from '@/lib/auth';

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('x-role')?.value as Role | undefined;
  const home = role ? ROLE_HOME[role] : '/login';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--background)', color: 'var(--foreground)', padding: '40px' }}
    >
      {/* Decorative number */}
      <p
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: 'clamp(6rem, 18vw, 14rem)',
          fontWeight: 800,
          color: 'var(--surface)',
          lineHeight: 1,
          userSelect: 'none',
          marginBottom: '-24px',
        }}
      >
        403
      </p>

      {/* Content */}
      <div style={{ textAlign: 'center', maxWidth: '460px' }}>
        <div style={{ width: '40px', height: '2px', background: 'var(--primary)', margin: '0 auto 24px' }} />

        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: '14px',
            lineHeight: 1.2,
          }}
        >
          Access restricted
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.8, marginBottom: '36px' }}>
          You don&apos;t have permission to view this page.
          {role
            ? ` Your current role (${role}) does not grant access to this resource.`
            : ' Please sign in to continue.'}
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href={home} className="btn-primary">
            {role ? 'Go to my dashboard' : 'Sign in'}
          </Link>
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </div>
      </div>

      {/* Role info strip */}
      {role && (
        <div
          style={{
            marginTop: '56px',
            padding: '16px 24px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Signed in as
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'var(--primary)',
            }}
          >
            {role}
          </span>
        </div>
      )}

      {/* Brand */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '24px',
          left: '32px',
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.125rem',
          fontWeight: 700,
        }}
      >
        Morocco<span style={{ color: 'var(--primary)' }}>360</span>
      </Link>
    </div>
  );
}
