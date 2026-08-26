import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiPublicUrlFor,
  apiPublicUrlProblem,
  isLoopbackHost,
  isOAuthProvider,
  isStrandingRedirect,
  requestHostname,
  safeRedirect,
} from './oauth';

describe('isOAuthProvider', () => {
  it('accepts the providers we support', () => {
    expect(isOAuthProvider('google')).toBe(true);
    expect(isOAuthProvider('facebook')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isOAuthProvider('twitter')).toBe(false);
    expect(isOAuthProvider('Google')).toBe(false);
    expect(isOAuthProvider('')).toBe(false);
    expect(isOAuthProvider('../auth/login')).toBe(false);
  });
});

describe('safeRedirect', () => {
  it('keeps a same-site path', () => {
    expect(safeRedirect('/user/events')).toBe('/user/events');
    expect(safeRedirect('/dashboard/admin?tab=events')).toBe(
      '/dashboard/admin?tab=events',
    );
  });

  it('drops an empty value', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect('')).toBeNull();
  });

  // The value survives a round trip through the provider, so it has to be
  // treated as attacker-controlled: none of these may send a user off-site.
  it('drops anything that could leave the site', () => {
    expect(safeRedirect('//evil.com')).toBeNull();
    expect(safeRedirect('https://evil.com')).toBeNull();
    expect(safeRedirect('http://evil.com')).toBeNull();
    expect(safeRedirect('/\\evil.com')).toBeNull();
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
    expect(safeRedirect('user/events')).toBeNull();
  });
});

describe('isLoopbackHost', () => {
  // `[::1]` is the bracketed form `URL.hostname` actually returns.
  it.each(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]', 'LOCALHOST'])(
    'treats %s as loopback',
    (host) => {
      expect(isLoopbackHost(host)).toBe(true);
    },
  );

  // Loopback has more spellings than `localhost`. The `7f..` forms are what
  // `URL` normalises an IPv4-mapped IPv6 address to.
  it.each([
    '127.0.0.2',
    '127.1.2.3',
    'localhost.',
    '::ffff:127.0.0.1',
    '[::ffff:7f00:1]',
    '[::ffff:7f01:203]',
  ])('treats %s as loopback too', (host) => {
    expect(isLoopbackHost(host)).toBe(true);
  });

  // A host merely containing "localhost" is a real domain, not the loopback.
  it.each([
    'eventhub.com',
    'api.eventhub.com',
    'localhost.eventhub.com',
    'notlocalhost',
    '128.0.0.1',
  ])('treats %s as public', (host) => {
    expect(isLoopbackHost(host)).toBe(false);
  });
});

describe('apiPublicUrlFor', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('joins onto the configured API URL', () => {
    vi.stubEnv('API_PUBLIC_URL', 'https://api.eventhub.com');

    expect(apiPublicUrlFor('/auth/google').toString()).toBe(
      'https://api.eventhub.com/auth/google',
    );
  });

  it('survives a trailing slash', () => {
    vi.stubEnv('API_PUBLIC_URL', 'https://api.eventhub.com/');

    expect(apiPublicUrlFor('/auth/google').toString()).toBe(
      'https://api.eventhub.com/auth/google',
    );
  });

  // Must agree with how the API builds its own provider callback URL.
  it('keeps a base path', () => {
    vi.stubEnv('API_PUBLIC_URL', 'https://eventhub.com/api');

    expect(apiPublicUrlFor('/auth/google').toString()).toBe(
      'https://eventhub.com/api/auth/google',
    );
  });
});

describe('apiPublicUrlProblem', () => {
  it('reports a missing value', () => {
    expect(apiPublicUrlProblem(undefined)).toContain('not set');
  });

  it('reports a malformed URL', () => {
    expect(apiPublicUrlProblem('api.eventhub.com')).toContain('not a valid');
  });

  it('reports plain http, which providers reject', () => {
    expect(apiPublicUrlProblem('http://api.eventhub.com')).toContain('https');
  });

  it('reports an internal service name', () => {
    expect(apiPublicUrlProblem('https://eventhub-api')).toContain('internal');
  });

  it('accepts a public https URL', () => {
    expect(apiPublicUrlProblem('https://api.eventhub.com')).toBeNull();
  });

  // Judged per request instead, where the visitor's own host is known — it is
  // correct whenever the site itself is on localhost.
  it('stays quiet about loopback', () => {
    expect(apiPublicUrlProblem('http://localhost:4000')).toBeNull();
  });
});

describe('requestHostname', () => {
  it('prefers the proxy header, since that is the public domain', () => {
    expect(
      requestHostname('eventhub.com', 'internal.vercel.app', 'localhost'),
    ).toBe('eventhub.com');
  });

  it('falls back to the host header, then to the request URL', () => {
    expect(requestHostname(null, 'eventhub.com', 'localhost')).toBe(
      'eventhub.com',
    );
    expect(requestHostname(null, null, 'localhost')).toBe('localhost');
  });

  it('drops the port', () => {
    expect(requestHostname(null, 'localhost:4001', 'x')).toBe('localhost');
    expect(requestHostname(null, '[::1]:4001', 'x')).toBe('[::1]');
  });

  // A bare IPv6 address is all colons — truncating at the last one would
  // leave `:` and make the loopback check read it as a public host.
  it('leaves an unbracketed IPv6 address intact', () => {
    expect(requestHostname(null, '::1', 'x')).toBe('::1');
    expect(requestHostname(null, 'fe80::1', 'x')).toBe('fe80::1');
  });

  // Chained proxies append; the client-facing value comes first.
  it('takes the first of a comma-joined list', () => {
    expect(requestHostname('eventhub.com, internal', null, 'x')).toBe(
      'eventhub.com',
    );
  });
});

describe('isStrandingRedirect', () => {
  const api = (url: string) => new URL(url);

  // The production misconfiguration this guard exists for.
  it('flags a public site pointed at a localhost API', () => {
    expect(
      isStrandingRedirect('eventhub.com', api('http://localhost:4000')),
    ).toBe(true);
  });

  it.each(['http://127.0.0.1:4000', 'http://0.0.0.0:4000', 'http://[::1]:4000'])(
    'flags %s too',
    (url) => {
      expect(isStrandingRedirect('eventhub.com', api(url))).toBe(true);
    },
  );

  // Local dev, and the production build the Lighthouse workflow runs.
  it('allows a localhost API when the site is also on localhost', () => {
    expect(isStrandingRedirect('localhost', api('http://localhost:4000'))).toBe(
      false,
    );
  });

  it('allows a correctly configured deployment', () => {
    expect(
      isStrandingRedirect('eventhub.com', api('https://api.eventhub.com')),
    ).toBe(false);
  });
});
