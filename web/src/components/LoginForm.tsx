'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEV_USERS, ROLE_HOME, apiLogin } from '@/lib/auth';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

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
      const roleHome = ROLE_HOME[role] ?? '/dashboard';
      // Prefer role-specific URL; only honour redirectTo if it points to a real sub-page
      const destination = redirectTo && redirectTo !== '/dashboard' ? redirectTo : roleHome;
      window.location.href = destination;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md anim-fade-up">
      <div className="mb-10">
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          Welcome back
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Sign in to continue your journey
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.03em',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
            <label
              htmlFor="password"
              style={{ fontSize: '0.8125rem', fontWeight: 500, letterSpacing: '0.03em' }}
            >
              Password
            </label>
            <Link
              href="#"
              className="link-underline"
              style={{ fontSize: '0.8125rem', color: 'var(--primary)' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--primary)',
              padding: '10px 14px',
              border: '1px solid var(--primary)',
              background: 'rgba(194,83,58,0.06)',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            marginTop: '8px',
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Quick-access panel for role testing */}
      <div
        style={{
          marginTop: '28px',
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '12px',
            fontWeight: 600,
          }}
        >
          Dev — Quick role access
        </p>
        <div className="flex flex-col gap-2">
          {DEV_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword(u.password); }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--background)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                textAlign: 'left',
                transition: 'border-color 0.2s ease',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              <span style={{ color: 'var(--foreground)' }}>{u.name}</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '24px' }}>
        <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="link-underline"
            style={{ color: 'var(--foreground)', fontWeight: 600 }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
