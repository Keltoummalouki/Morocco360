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

/**
 * `path` joined onto the public API URL.
 *
 * Trailing slashes are trimmed rather than the whole thing resolved through
 * `new URL(path, base)`, which would drop a base path — an API served at
 * `https://host/api` must keep it, and the API builds its provider callbacks
 * the same way.
 */
export function apiPublicUrlFor(path: string): URL {
  return new URL(`${apiPublicUrl().replace(/\/+$/, '')}${path}`);
}

const LOOPBACK_HOSTS = new Set(['localhost', '0.0.0.0', '::1']);

/**
 * Is this hostname the local machine? Mirrors the API's boot-time check.
 *
 * Covers the whole `127.0.0.0/8` block, the IPv4-mapped IPv6 form, and the
 * trailing-dot FQDN spelling.
 *
 * @param hostname a bare host, as `URL.hostname` gives it — no port.
 */
export function isLoopbackHost(hostname: string): boolean {
  // `URL.hostname` keeps the brackets around an IPv6 literal: `[::1]`.
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');

  return (
    LOOPBACK_HOSTS.has(host) ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    // `URL` normalises an IPv4-mapped address to hex, so ::ffff:127.0.0.1
    // arrives as ::ffff:7f00:1 — `7f` being 127.
    /^::ffff:(127\.|7f[0-9a-f]{2}:)/.test(host)
  );
}

/**
 * Hostname the browser actually used to reach us.
 *
 * Behind a proxy — Vercel, Render — the public domain arrives in a header
 * rather than on the request URL, so prefer those over `fallback`.
 */
export function requestHostname(
  forwardedHost: string | null,
  host: string | null,
  fallback: string,
): string {
  const header = forwardedHost ?? host;
  if (!header) return fallback;
  // Chained proxies join their values with commas, client-facing one first.
  const first = header.split(',')[0].trim();
  // Strip the port only where it is unambiguous — a bracketed IPv6 literal, or
  // a name/IPv4 with a single colon. A bare IPv6 address is all colons, and
  // `::1` must not be truncated to `:`.
  const hasPort = /^\[.+\]:\d+$/.test(first) || /^[^:]+:\d+$/.test(first);
  return (hasPort ? first.replace(/:\d+$/, '') : first) || fallback;
}

/**
 * Would sending this browser to `apiUrl` strand it on its own machine?
 *
 * A loopback API is correct when the site itself is served from loopback —
 * local dev, and the production build the Lighthouse workflow runs. It is only
 * ever wrong when the request came from a real domain, which is exactly the
 * deploy that forgot to set `API_PUBLIC_URL`. Left unchecked the user is
 * redirected to whatever happens to run on their own machine, finishes sign-in
 * against it, and lands back without the nonce cookie this origin planted —
 * reported to them as "that sign-in took too long", which points nowhere near
 * the actual mistake.
 */
export function isStrandingRedirect(
  requestHost: string,
  apiUrl: URL,
): boolean {
  return isLoopbackHost(apiUrl.hostname) && !isLoopbackHost(requestHost);
}

/**
 * Why `API_PUBLIC_URL` could never work in a real deployment, or null.
 *
 * Reported at boot rather than thrown: a bad value breaks social sign-in, and
 * taking the whole site down over it would be a worse outage than the bug it
 * guards against. The loopback case is deliberately absent — it is correct
 * whenever the site itself is on localhost, so `isStrandingRedirect` judges
 * that one per request, where the visitor's own host is known.
 */
export function apiPublicUrlProblem(value: string | undefined): string | null {
  if (!value) {
    return 'is not set, so social sign-in falls back to localhost and will ' +
      'send visitors to their own machine';
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return `is not a valid URL: "${value}"`;
  }

  if (isLoopbackHost(url.hostname)) return null;
  if (url.protocol !== 'https:') {
    return `must be https in production, got "${value}" — OAuth providers ` +
      'reject plain-http redirect URIs';
  }
  // A hostname with no dot is a container/service name: routable from inside
  // the network, meaningless in the visitor's browser.
  if (!url.hostname.includes('.')) {
    return `points at "${url.hostname}", which looks like an internal ` +
      'hostname — the visitor\'s browser has to be able to reach it';
  }
  return null;
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
