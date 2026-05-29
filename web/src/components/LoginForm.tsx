'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEV_USERS, ROLE_HOME, apiLogin } from '@/lib/auth';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#C4623F',
  ORGANIZER: '#C49A3C',
  USER: '#2E8B6A',
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { role } = await apiLogin(email, password);
      const dest = redirectTo && redirectTo !== '/dashboard' ? redirectTo : ROLE_HOME[role] ?? '/dashboard';
      window.location.href = dest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }} className="anim-fade-up">
      <div style={{ marginBottom: '36px' }}>
        <div style={{ width: '28px', height: '2px', background: 'linear-gradient(90deg, var(--primary), var(--accent))', marginBottom: '20px', borderRadius: '2px' }} />
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Sign in to continue your journey
        </p>
      </div>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" style={{ fontSize: '0.8125rem', fontWeight: 500, letterSpacing: '0.03em', display: 'block', marginBottom: '8px', color: 'var(--foreground-dim)' }}>
            Email address
          </label>
          <input
            id="email" type="email" placeholder="you@example.com"
            autoComplete="email" className="input-field"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '0.8125rem', fontWeight: 500, letterSpacing: '0.03em', color: 'var(--foreground-dim)' }}>
              Password
            </label>
            <Link href="#" className="link-underline" style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}>
              Forgot?
            </Link>
          </div>
          <input
            id="password" type="password" placeholder="••••••••"
            autoComplete="current-password" className="input-field"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            border: '1px solid rgba(224,82,82,0.3)',
            background: 'rgba(224,82,82,0.06)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg style={{ width: '16px', height: '16px', color: 'var(--error)', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '4px', opacity: loading ? 0.7 : 1, padding: '15px' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Dev quick access */}
      <div style={{ marginTop: '32px', padding: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px', fontWeight: 600 }}>
          Dev — Quick access
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {DEV_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword(u.password); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'left',
                transition: 'border-color 0.2s ease, background 0.2s ease',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
                color: 'var(--foreground)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
            >
              <span>{u.name}</span>
              <span style={{
                fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
                color: ROLE_COLORS[u.role] ?? 'var(--muted)',
                background: `${ROLE_COLORS[u.role] ?? '#666'}14`,
                padding: '3px 8px',
              }}>
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: '28px', paddingTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9375rem', color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="link-underline" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
