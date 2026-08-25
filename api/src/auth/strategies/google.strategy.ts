import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { oauthCallbackUrl, OAuthProfileData } from '../oauth.types';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: oauthCallbackUrl(config, 'google'),
      scope: ['profile', 'email'],
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
  // Google reports verification status on the raw payload; treat anything
  // other than an explicit `true` as unverified so we never auto-link.
  const emailVerified =
    (profile._json as { email_verified?: boolean }).email_verified === true;

  return {
    provider: 'google',
    providerId: profile.id,
    email: email?.toLowerCase() ?? null,
    emailVerified,
    firstName: profile.name?.givenName ?? null,
    lastName: profile.name?.familyName ?? null,
    fullName: profile.displayName || null,
    avatarUrl: profile.photos?.[0]?.value ?? null,
  };
}
