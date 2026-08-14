'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { ROLE_HOME, apiRegister } from '@/lib/auth';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EnabledOAuthProviders } from '@/lib/oauth';

export default function RegisterForm({
  oauthProviders,
}: {
  oauthProviders: EnabledOAuthProviders;
}) {
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
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
        username: fields.email.split('@')[0],
        email: fields.email,
        password: fields.password,
        full_name: `${fields.firstName} ${fields.lastName}`.trim() || undefined,
      });

      window.location.href = ROLE_HOME[role] ?? '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="ev-display text-[clamp(1.75rem,3vw,2.25rem)]">Create account</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Book tickets to events across Morocco — free to join.
        </p>
      </div>

      <SocialAuthButtons providers={oauthProviders} />

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Youssef"
              autoComplete="given-name"
              value={fields.firstName}
              onChange={set('firstName')}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Alami"
              autoComplete="family-name"
              value={fields.lastName}
              onChange={set('lastName')}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-email">Email address</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={fields.email}
            onChange={set('email')}
            required
            className="h-11"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            placeholder="Min. 8 chars, uppercase + number"
            autoComplete="new-password"
            value={fields.password}
            onChange={set('password')}
            required
            className="h-11"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="reg-confirm">Confirm password</Label>
          <Input
            id="reg-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={fields.confirm}
            onChange={set('confirm')}
            required
            className="h-11"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-md border p-3"
            style={{ borderColor: 'var(--error)', background: 'var(--error-bg)' }}
          >
            <AlertCircle size={16} className="shrink-0" style={{ color: 'var(--error)' }} aria-hidden="true" />
            <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link href="#" className="text-foreground underline underline-offset-2">Terms of Service</Link>{' '}
          and{' '}
          <Link href="#" className="text-foreground underline underline-offset-2">Privacy Policy</Link>.
        </p>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center">
        <p className="text-[0.9375rem] text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
