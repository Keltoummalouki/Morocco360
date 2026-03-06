import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* ── Left panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14"
        style={{ background: 'var(--foreground)', color: 'var(--background)' }}
      >
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700 }}
        >
          Morocco<span style={{ color: 'var(--primary)' }}>360</span>
        </Link>

        <div>
          <div style={{ width: '40px', height: '2px', background: 'var(--primary)', marginBottom: '32px' }} />
          <blockquote
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(1.625rem, 2.5vw, 2.25rem)',
              lineHeight: 1.35,
              fontWeight: 500,
              marginBottom: '20px',
            }}
          >
            &ldquo;Every corner of Morocco tells a story a thousand years old.&rdquo;
          </blockquote>
          <p style={{ color: '#78716C', fontSize: '0.875rem' }}>
            — Begin your panoramic journey
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {['Marrakech', 'Fez', 'Sahara'].map((city, i) => (
            <span
              key={city}
              style={{
                background: i === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                padding: '7px 16px',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--background)',
              }}
            >
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16">
        <div className="lg:hidden mb-12">
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700 }}
          >
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>
        </div>

        {/* Suspense required because LoginForm uses useSearchParams */}
        <Suspense
          fallback={
            <div className="w-full max-w-md" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
