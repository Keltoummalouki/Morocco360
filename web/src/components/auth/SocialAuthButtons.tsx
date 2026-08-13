'use client';

import { useState, type MouseEvent, type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EnabledOAuthProviders, OAuthProvider } from '@/lib/oauth';

const PROVIDERS: Array<{
  id: OAuthProvider;
  label: string;
  Icon: () => ReactElement;
}> = [
  { id: 'google', label: 'Continue with Google', Icon: GoogleMark },
  { id: 'facebook', label: 'Continue with Facebook', Icon: FacebookMark },
];

interface Props {
  providers: EnabledOAuthProviders;
  /** Path to land on after signing in, forwarded through the OAuth round trip. */
  redirect?: string | null;
}

/**
 * "Continue with…" buttons above the password form.
 *
 * Each is a plain link to a BFF route that starts the redirect dance, so they
 * work before hydration. They stay `outline` on purpose: the form's own submit
 * button is the single primary action on the page.
 */
export default function SocialAuthButtons({ providers, redirect }: Props) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const available = PROVIDERS.filter(({ id }) => providers[id]);

  if (available.length === 0) return null;

  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: OAuthProvider) {
    // A second click restarts the redirect and throws away the first attempt.
    if (pending !== null) {
      event.preventDefault();
      return;
    }
    setPending(id);
  }

  return (
    <div className="mb-7">
      <div className="flex flex-col gap-3">
        {available.map(({ id, label, Icon }) => (
          <Button
            key={id}
            asChild
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2.5 text-[0.9375rem] font-medium"
          >
            <a
              href={startUrl(id, redirect)}
              onClick={(event) => handleClick(event, id)}
              aria-busy={pending === id}
              aria-disabled={pending !== null && pending !== id}
            >
              {pending === id ? (
                <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
              ) : (
                <Icon />
              )}
              <span>{label}</span>
            </a>
          </Button>
        ))}
      </div>

      <div className="mt-7 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function startUrl(provider: OAuthProvider, redirect?: string | null): string {
  const base = `/api/auth/oauth/start/${provider}`;
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
}

// ── Brand marks ───────────────────────────────────────────
// Official artwork and colours, identical in dark mode: both marks are designed
// to read on a light or dark neutral surface, and recolouring them would breach
// the providers' brand guidelines.

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4.5" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true" focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}
