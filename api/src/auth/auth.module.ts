import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthTokenService } from './oauth-token.service';
import { isProviderConfigured } from './oauth.types';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

/**
 * A Passport strategy registers itself the moment it is constructed, and the
 * OAuth ones throw without credentials. Building them through a factory keeps
 * the API bootable when a provider is not set up — the matching routes then
 * answer 404 (see SocialAuthGuard) instead of the whole app failing to start.
 */
const googleStrategyProvider: Provider = {
  provide: GoogleStrategy,
  inject: [ConfigService, AuthService],
  useFactory: (config: ConfigService, authService: AuthService) =>
    isProviderConfigured(config, 'google')
      ? new GoogleStrategy(config, authService)
      : null,
};

const facebookStrategyProvider: Provider = {
  provide: FacebookStrategy,
  inject: [ConfigService, AuthService],
  useFactory: (config: ConfigService, authService: AuthService) =>
    isProviderConfigured(config, 'facebook')
      ? new FacebookStrategy(config, authService)
      : null,
};

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthTokenService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    googleStrategyProvider,
    facebookStrategyProvider,
  ],
})
export class AuthModule {}
