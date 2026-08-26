import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NONCE_COOKIE } from '@/lib/oauth';
import { GET } from './route';

/**
 * @param host what the deployment's proxy reports, i.e. the domain the browser
 *   used — not the address the server happens to listen on.
 */
function start(provider: string, host: string) {
  const request = new NextRequest(
    `https://${host}/api/auth/oauth/start/${provider}`,
    { headers: { host } },
  );
  return GET(request, { params: Promise.resolve({ provider }) });
}

describe('GET /api/auth/oauth/start/[provider]', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sends the browser to the API and plants a nonce cookie', async () => {
    vi.stubEnv('API_PUBLIC_URL', 'https://api.eventhub.com');

    const response = await start('google', 'eventhub.com');
    const location = new URL(response.headers.get('location')!);

    expect(location.origin).toBe('https://api.eventhub.com');
    expect(location.pathname).toBe('/auth/google');
    // The API only ever receives the hash, never the cookie value itself.
    expect(location.searchParams.get('nonce')).toMatch(/^[0-9a-f]{64}$/);
    expect(response.cookies.get(NONCE_COOKIE)?.value).toBeTruthy();
    expect(response.cookies.get(NONCE_COOKIE)?.value).not.toBe(
      location.searchParams.get('nonce'),
    );
  });

  // The reported production bug: a deploy that never set API_PUBLIC_URL would
  // otherwise bounce real users to their own machine.
  it('refuses to send a public visitor to a localhost API', async () => {
    vi.stubEnv('API_PUBLIC_URL', 'http://localhost:4000');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await start('google', 'eventhub.com');
    const location = new URL(response.headers.get('location')!);

    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('oauth_failed');
    expect(location.hostname).toBe('eventhub.com');
    // The cause has to reach the deploy logs, or this is just as opaque.
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('API_PUBLIC_URL'),
    );
  });

  // Local dev, and the production build the Lighthouse workflow runs.
  it('allows a localhost API when the visitor is also on localhost', async () => {
    vi.stubEnv('API_PUBLIC_URL', 'http://localhost:4000');

    const response = await start('google', 'localhost:4001');
    const location = new URL(response.headers.get('location')!);

    expect(location.origin).toBe('http://localhost:4000');
    expect(location.pathname).toBe('/auth/google');
  });

  it('rejects an unknown provider', async () => {
    const response = await start('twitter', 'eventhub.com');
    const location = new URL(response.headers.get('location')!);

    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('oauth_failed');
  });
});
