import type { EnabledOAuthProviders } from './oauth';

/**
 * Which social buttons to render.
 *
 * Server-only, and deliberately read from env rather than fetched from the API,
 * so the auth pages never depend on the API being reachable to render.
 *
 * Only the presence of the *public* client id is checked; no secret is read.
 *
 * These must reach the Next process itself: docker-compose passes them to the
 * web service, and for host-mode dev they belong in `web/.env.local` (Next does
 * not read the repo-root `.env`) — see [web/.env.example](../../.env.example).
 * If the two ever disagree the API answers 404 and the user lands back on
 * /login with a readable message instead of a dead button.
 */
export function getEnabledOAuthProviders(): EnabledOAuthProviders {
  return {
    google: !!process.env.GOOGLE_CLIENT_ID,
    facebook: !!process.env.FACEBOOK_APP_ID,
  };
}
