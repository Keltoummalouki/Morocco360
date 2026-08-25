import { apiPublicUrlProblem } from '@/lib/oauth';

/**
 * Runs once when a Next server instance starts, before it handles a request.
 *
 * Config that only breaks deep inside a redirect chain is worth checking here:
 * a bad `API_PUBLIC_URL` otherwise stays invisible until someone clicks
 * "Continue with Google" in production. It is reported, not thrown — the
 * sign-in flow is the only thing at stake, and refusing to boot the whole site
 * over it would be the larger outage.
 */
export function register() {
  if (process.env.NODE_ENV !== 'production') return;

  const problem = apiPublicUrlProblem(process.env.API_PUBLIC_URL);
  if (problem) {
    console.error(
      `[startup] Social sign-in is misconfigured: API_PUBLIC_URL ${problem}.`,
    );
  }
}
