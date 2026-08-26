import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { AuthService } from '../auth.service';
import { oauthCallbackUrl, OAuthProfileData } from '../oauth.types';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('FACEBOOK_APP_ID'),
      clientSecret: config.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      callbackURL: oauthCallbackUrl(config, 'facebook'),
      scope: ['email'],
      // Facebook returns only `id` and `name` unless the fields are requested.
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    return this.authService.validateOAuthUser(toProfileData(profile));
  }
}

function toProfileData(profile: Profile): OAuthProfileData {
  const email = profile.emails?.[0]?.value ?? null;

  return {
    provider: 'facebook',
    providerId: profile.id,
    email: email?.toLowerCase() ?? null,
    // Facebook only ever returns an address it has confirmed itself, and the
    // user may withhold it entirely — so anything it does return is verified.
    emailVerified: !!email,
    firstName: profile.name?.givenName ?? null,
    lastName: profile.name?.familyName ?? null,
    fullName: profile.displayName || null,
    avatarUrl: profile.photos?.[0]?.value ?? null,
  };
}
