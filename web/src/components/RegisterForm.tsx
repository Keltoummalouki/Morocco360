'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ROLE_HOME, apiRegister } from '@/lib/auth';

export default function RegisterForm() {
  const [fields, setFields] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    confirm:   '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (fields.password !== fields.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { role } = await apiRegister({
        username:  fields.email.split('@')[0],
        email:     fields.email,
        password:  fields.password,
        full_name: `${fields.firstName} ${fields.lastName}`.trim() || undefined,
      });

      window.location.href = ROLE_HOME[role] ?? '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  const label = (text: string) => (
    <span style={{ fontSize: '0.8125rem', fontWeight: 500, letterSpacing: '0.03em' }}>
      {text}
    </span>
  );

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
          Create account
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Start exploring Morocco for free
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" style={{ display: 'block', marginBottom: '8px' }}>
              {label('First name')}
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Youssef"
              autoComplete="given-name"
              className="input-field"
              value={fields.firstName}
              onChange={set('firstName')}
            />
          </div>
          <div>
            <label htmlFor="lastName" style={{ display: 'block', marginBottom: '8px' }}>
              {label('Last name')}
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Alami"
              autoComplete="family-name"
              className="input-field"
              value={fields.lastName}
              onChange={set('lastName')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" style={{ display: 'block', marginBottom: '8px' }}>
            {label('Email address')}
          </label>
          <input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="input-field"
            value={fields.email}
            onChange={set('email')}
            required
          />
        </div>

        <div>
          <label htmlFor="reg-password" style={{ display: 'block', marginBottom: '8px' }}>
            {label('Password')}
          </label>
          <input
            id="reg-password"
            type="password"
            placeholder="Min. 8 chars, uppercase + number"
            autoComplete="new-password"
            className="input-field"
            value={fields.password}
            onChange={set('password')}
            required
          />
        </div>

        <div>
          <label htmlFor="reg-confirm" style={{ display: 'block', marginBottom: '8px' }}>
            {label('Confirm password')}
          </label>
          <input
            id="reg-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="input-field"
            value={fields.confirm}
            onChange={set('confirm')}
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

        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.65 }}>
          By creating an account you agree to our{' '}
          <Link href="#" style={{ color: 'var(--foreground)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" style={{ color: 'var(--foreground)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          className="btn-primary"
          style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: '32px', paddingTop: '32px' }}>
        <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="link-underline" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
