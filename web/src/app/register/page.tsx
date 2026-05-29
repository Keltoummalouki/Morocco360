import Link from 'next/link';
import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

const PERKS = [
  { icon: '◎', label: 'Unlimited 360° panoramas', desc: 'Stream any experience, any time' },
  { icon: '◈', label: 'Curated city routes', desc: 'Expert-designed virtual tours' },
  { icon: '◇', label: 'Live guide sessions', desc: 'Real-time local storytelling' },
  { icon: '○', label: 'Offline access', desc: 'Save and explore without connectivity' },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* ── Left panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Ambient glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-glow-soft) 0%, transparent 70%)',
            top: '-25%', right: '-25%',
            animation: 'glowPulse 12s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
            bottom: '10%', left: '-10%',
            animation: 'glowPulse 16s ease-in-out infinite reverse',
            animationDelay: '-6s',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.02,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232E8B6A' fill-opacity='1'%3E%3Cpath d='M40 0l8 16H32L40 0zm0 80l-8-16h16L40 80zM0 40l16-8v16L0 40zm80 0L64 48V32l16 8zM13 13l14 7-7 14L13 13zm54 0l-7 21-7-14 14-7zm-54 54l7-21 7 14-14 7zm54 0L53 60l7-14 7 21z'/%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '40px 48px', position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>
        </div>

        {/* Features */}
        <div style={{ padding: '48px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, var(--primary), var(--accent))', marginBottom: '20px', borderRadius: '2px' }} />
          <p style={{ fontSize: '0.6875rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--primary)', marginBottom: '14px' }}>
            Join the community
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.5rem, 2.2vw, 2.125rem)', lineHeight: 1.3, fontWeight: 600, marginBottom: '40px', letterSpacing: '-0.01em' }}>
            Unlock 240+ immersive experiences
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {PERKS.map((perk) => (
              <div key={perk.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '32px', height: '32px', flexShrink: 0,
                  background: 'var(--primary-glow-soft)',
                  border: '1px solid var(--primary-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', color: 'var(--primary)',
                  borderRadius: '6px',
                }}>
                  {perk.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '3px', color: 'var(--foreground)' }}>{perk.label}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ margin: '0 48px 48px', padding: '24px', background: 'var(--surface-2)', border: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '20px', height: '2px', background: 'var(--primary)', marginBottom: '14px', borderRadius: '2px' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.75, fontStyle: 'italic' }}>
            &ldquo;Morocco360 completely changed how I prepare for travel. I visited every place virtually before setting foot there.&rdquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#FAFAF8',
            }}>S</div>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Sarah M.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Paris, France</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'clamp(32px, 5vw, 80px)' }}>
        <div className="lg:hidden" style={{ marginBottom: '48px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>
        </div>

        <Suspense fallback={
          <div style={{ width: '100%', maxWidth: '420px', color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
