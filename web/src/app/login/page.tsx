import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

const CITIES = ['Marrakech', 'Fez', 'Sahara', 'Essaouira', 'Chefchaouen'];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* ── Left panel — cinematic ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Ambient glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-glow-soft) 0%, transparent 70%)',
            top: '-15%', right: '-20%',
            animation: 'glowPulse 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,154,60,0.08) 0%, transparent 70%)',
            bottom: '20%', left: '-10%',
            animation: 'glowPulse 14s ease-in-out infinite reverse',
            animationDelay: '-5s',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.02,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232E8B6A' fill-opacity='1'%3E%3Cpath d='M40 0l8 16H32L40 0zm0 80l-8-16h16L40 80zM0 40l16-8v16L0 40zm80 0L64 48V32l16 8zM13 13l14 7-7 14L13 13zm54 0l-7 21-7-14 14-7zm-54 54l7-21 7 14-14 7zm54 0L53 60l7-14 7 21z'/%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '40px 48px', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>
        </div>

        <div style={{ padding: '48px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, var(--primary), var(--accent))', marginBottom: '28px', borderRadius: '2px' }} />
          <blockquote style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(1.5rem, 2.2vw, 2.125rem)',
            lineHeight: 1.4,
            fontWeight: 500,
            marginBottom: '20px',
            letterSpacing: '-0.01em',
            color: 'var(--foreground)',
          }}>
            &ldquo;Every corner of Morocco tells a story a thousand years old.&rdquo;
          </blockquote>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', letterSpacing: '0.04em' }}>
            — Begin your panoramic journey
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '48px' }}>
            {CITIES.map((city, i) => (
              <span key={city} style={{
                padding: '7px 14px',
                fontSize: '0.6875rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                background: i === 0 ? 'var(--primary)' : 'var(--surface-2)',
                color: i === 0 ? '#FAFAF8' : 'var(--muted)',
                border: `1px solid ${i === 0 ? 'var(--primary)' : 'var(--border)'}`,
              }}>
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '32px 48px', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1, display: 'flex', gap: '32px' }}>
          {[['240+', 'Panoramas'], ['18', 'Cities'], ['50K+', 'Explorers']].map(([num, label]) => (
            <div key={label}>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '3px', color: 'var(--primary-light)' }}>{num}</p>
              <p style={{ fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'clamp(32px, 5vw, 80px)' }}>
        <div className="lg:hidden" style={{ marginBottom: '48px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>
        </div>

        <Suspense fallback={
          <div style={{ width: '100%', maxWidth: '420px', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Loading…
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
