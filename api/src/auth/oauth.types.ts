import { ConfigService } from '@nestjs/config';

export const OAUTH_PROVIDERS = ['google', 'facebook'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** Env var pair that enables a provider — both must be set. */
const PROVIDER_ENV: Record<OAuthProvider, [string, string]> = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
};

export function isProviderConfigured(
  config: ConfigService,
  provider: OAuthProvider,
): boolean {
  return PROVIDER_ENV[provider].every((key) => !!config.get<string>(key));
}

/**
 * Public base URL of this API — must be reachable by the browser and by the
 * provider. Validated at boot (see `config.schema.ts`): defaulted for local
 * dev, and held to a public https URL in production once a provider is
 * configured, so it is always present here.
 */
function apiPublicUrl(config: ConfigService): string {
  return config.getOrThrow<string>('API_PUBLIC_URL');
}

/**
 * The callback the provider must redirect to, which has to match the URI
 * registered with it byte for byte.
 *
 * Trailing slashes are trimmed rather than the whole thing resolved through
 * `URL`, which would silently drop a base path — an API served at
 * `https://host/api` must keep it. Either slip produces the same
 * `redirect_uri_mismatch`, visible only in production.
 */
export function oauthCallbackUrl(
  config: ConfigService,
  provider: OAuthProvider,
): string {
  const base = apiPublicUrl(config).replace(/\/+$/, '');
  return `${base}/auth/${provider}/callback`;
}

/** Provider profile normalised to the fields we actually persist. */
export interface OAuthProfileData {
  provider: OAuthProvider;
  providerId: string;
  email: string | null;
  /** Only a provider-verified email may be linked to an existing account. */
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}
