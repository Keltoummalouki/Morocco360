import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  OAuthEmailMissingException,
  OAuthEmailTakenException,
} from '../oauth.errors';

/**
 * Anything that goes wrong during the social sign-in redirect dance ends up
 * back on the login page with a readable reason, rather than as a raw JSON
 * error in the user's browser.
 */
@Catch()
export class OAuthFailureFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthFailureFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    this.logger.warn(
      `Social sign-in failed on ${req.path}: ${
        exception instanceof Error ? exception.message : String(exception)
      }`,
    );

    const url = new URL(
      '/login',
      this.config.getOrThrow<string>('FRONTEND_URL'),
    );
    url.searchParams.set('error', reasonFor(req, exception));
    res.redirect(url.toString());
  }
}

function reasonFor(req: Request, exception: unknown): string {
  // The provider tells us when the user simply backed out of the consent screen.
  const providerError = req.query?.error;
  if (
    providerError === 'access_denied' ||
    providerError === 'user_denied' ||
    providerError === 'consent_required'
  ) {
    return 'oauth_cancelled';
  }

  // Turn the two cases the user can actually act on into their own message,
  // rather than a generic "something went wrong".
  if (exception instanceof OAuthEmailTakenException) return 'oauth_email_taken';
  if (exception instanceof OAuthEmailMissingException) return 'oauth_no_email';

  return 'oauth_failed';
}
