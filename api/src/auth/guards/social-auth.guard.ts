import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { OAuthTokenService } from '../oauth-token.service';
import { isProviderConfigured, OAuthProvider } from '../oauth.types';

/**
 * Guard for one social provider.
 *
 * On top of the plain Passport guard it:
 * - returns 404 when the provider has no credentials configured, instead of
 *   letting Passport blow up on an unknown strategy;
 * - mints a signed `state` for every authorisation request. Passport has no
 *   session here, so state is what protects the callback from login CSRF, and
 *   it doubles as the carrier for the post-login redirect path.
 */
export function SocialAuthGuard(provider: OAuthProvider): Type<CanActivate> {
  @Injectable()
  class Guard extends AuthGuard(provider) {
    constructor(
      private readonly config: ConfigService,
      private readonly oauthTokens: OAuthTokenService,
    ) {
      super();
    }

    canActivate(context: ExecutionContext) {
      if (!isProviderConfigured(this.config, provider)) {
        throw new NotFoundException(`${provider} sign-in is not configured`);
      }
      return super.canActivate(context);
    }

    getAuthenticateOptions(context: ExecutionContext) {
      const req = context.switchToHttp().getRequest<Request>();

      // Passport runs this on both legs. Only the outbound one mints state; on
      // the way back the provider echoes it and the controller verifies it.
      if (req.path.endsWith('/callback')) return {};

      const { nonce, redirect } = req.query ?? {};

      // The nonce is the hash of a cookie the web app just set in this browser.
      // Without it the resulting sign-in code could be redeemed anywhere, so
      // refuse to start rather than issue an unbindable one.
      if (typeof nonce !== 'string' || !nonce) {
        throw new BadRequestException('Social sign-in must start from the app');
      }

      return {
        state: this.oauthTokens.signState(
          nonce,
          typeof redirect === 'string' ? redirect : undefined,
        ),
      };
    }
  }

  return Guard;
}

export const GoogleOAuthGuard = SocialAuthGuard('google');
export const FacebookOAuthGuard = SocialAuthGuard('facebook');
