'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { DEV_USERS, ROLE_HOME, apiLogin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--accent)',
  ORGANIZER: 'var(--gold-strong)',
  USER: 'var(--primary)',
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { role } = await apiLogin(email, password);
      const dest =
        redirectTo && redirectTo !== '/dashboard' ? redirectTo : ROLE_HOME[role] ?? '/dashboard';
      window.location.href = dest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="ev-display text-[clamp(1.75rem,3vw,2.25rem)]">Welcome back</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Sign in to book tickets and manage your events.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-[0.8125rem] text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      {/* Dev quick access */}
      <div className="mt-8 rounded-xl border border-border bg-muted p-5">
        <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Dev — Quick access
        </p>
        <div className="flex flex-col gap-1.5">
          {DEV_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword(u.password); }}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3.5 py-2.5 text-left text-[0.8125rem] text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span>{u.name}</span>
              <span
                className="rounded px-2 py-0.5 text-[0.625rem] font-bold tracking-wider uppercase"
                style={{
                  color: ROLE_COLORS[u.role] ?? 'var(--muted)',
                  background: `color-mix(in srgb, ${ROLE_COLORS[u.role] ?? 'var(--muted)'} 14%, transparent)`,
                }}
              >
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 border-t border-border pt-6 text-center">
        <p className="text-[0.9375rem] text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
