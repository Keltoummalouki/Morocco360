import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/LoginForm';
import { getEnabledOAuthProviders } from '@/lib/oauth-server';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Morocco360 to book tickets to events across Morocco.',
};

const STATS: Array<[string, string]> = [
  ['240+', 'Events'],
  ['18', 'Cities'],
  ['50K', 'Tickets booked'],
];

export default function LoginPage() {
  const oauthProviders = getEnabledOAuthProviders();

  return (
    <AuthShell
      aside={
        <>
          <blockquote className="ev-display max-w-[18ch] text-[clamp(1.6rem,2.2vw,2.125rem)] text-white">
            Every corner of Morocco has something worth showing up for.
          </blockquote>
          <p className="mt-4 text-sm text-white/70">
            — From the medina to the main stage
          </p>

          <div className="mt-10 flex gap-8 border-t border-white/15 pt-6">
            {STATS.map(([num, label]) => (
              <div key={label}>
                <p className="ev-display text-2xl text-white">{num}</p>
                <p className="mt-0.5 text-xs tracking-wide text-white/60 uppercase">{label}</p>
              </div>
            ))}
          </div>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="w-full max-w-md text-sm text-muted-foreground">Loading…</div>
        }
      >
        <LoginForm oauthProviders={oauthProviders} />
      </Suspense>
    </AuthShell>
  );
}
