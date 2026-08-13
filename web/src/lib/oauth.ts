export const OAUTH_PROVIDERS = ['google', 'facebook'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** Which social buttons the auth pages should render. */
export type EnabledOAuthProviders = Record<OAuthProvider, boolean>;

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Keep a post-login `redirect` on this site.
 *
 * It travels to the API and back through the provider, so treat it as
 * attacker-controlled: only a single-slash absolute path survives. `//evil.com`
 * and `https://evil.com` are protocol-relative / absolute URLs a browser would
 * happily follow off-site.
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/\\')) return null;
  return value;
}

/** Base URL the browser uses to reach the NestJS API for the OAuth redirects. */
export function apiPublicUrl(): string {
  return process.env.API_PUBLIC_URL ?? 'http://localhost:4000';
}

/** Ties a sign-in code to the browser that started the flow. */
export const NONCE_COOKIE = 'oauth_nonce';

export function nonceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // `lax` still sends the cookie on the provider's top-level GET redirect back
    // to us, which `strict` would drop.
    sameSite: 'lax' as const,
    path: '/api/auth/oauth',
    maxAge: 600, // the user has ten minutes to finish at the provider
  };
}
