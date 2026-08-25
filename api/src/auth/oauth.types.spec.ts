import { ConfigService } from '@nestjs/config';
import { oauthCallbackUrl } from './oauth.types';

const configWith = (apiPublicUrl: string) =>
  ({
    getOrThrow: (key: string) => {
      if (key !== 'API_PUBLIC_URL') throw new Error(`unexpected key ${key}`);
      return apiPublicUrl;
    },
  }) as unknown as ConfigService;

describe('oauthCallbackUrl', () => {
  it('builds the callback each provider redirects back to', () => {
    const config = configWith('https://api.morocco360.example.com');

    expect(oauthCallbackUrl(config, 'google')).toBe(
      'https://api.morocco360.example.com/auth/google/callback',
    );
    expect(oauthCallbackUrl(config, 'facebook')).toBe(
      'https://api.morocco360.example.com/auth/facebook/callback',
    );
  });

  // Concatenation would produce `//auth/google/callback`, which no longer
  // matches the URI registered with the provider — a redirect_uri_mismatch
  // that only shows up in production.
  it('survives a trailing slash on API_PUBLIC_URL', () => {
    const config = configWith('https://api.morocco360.example.com/');

    expect(oauthCallbackUrl(config, 'google')).toBe(
      'https://api.morocco360.example.com/auth/google/callback',
    );
  });

  // Matches how the web app builds the same origin, so the two agree.
  it('keeps the port', () => {
    const config = configWith('http://localhost:4000');

    expect(oauthCallbackUrl(config, 'google')).toBe(
      'http://localhost:4000/auth/google/callback',
    );
  });

  // Resolving through `new URL(path, base)` would drop the `/api` prefix and
  // produce a URI the provider was never told about.
  it('keeps a base path, for an API behind a path-prefixed proxy', () => {
    const config = configWith('https://morocco360.example.com/api');

    expect(oauthCallbackUrl(config, 'google')).toBe(
      'https://morocco360.example.com/api/auth/google/callback',
    );
  });
});
