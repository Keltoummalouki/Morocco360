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

/** Public base URL of this API — must be reachable by the browser and by the provider. */
export function apiPublicUrl(config: ConfigService): string {
  return config.get<string>('API_PUBLIC_URL', 'http://localhost:4000');
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
