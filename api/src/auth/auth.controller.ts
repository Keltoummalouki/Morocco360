import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { OAuthFailureFilter } from './filters/oauth-failure.filter';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import {
  FacebookOAuthGuard,
  GoogleOAuthGuard,
} from './guards/social-auth.guard';
import { OAuthTokenService } from './oauth-token.service';
import { User } from '../users/entities/user.entity';

interface JwtUser {
  id: number;
  sub: number;
  email: string;
  role: string | null;
}

type OAuthCallbackRequest = ExpressRequest & { user: User };

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
    private oauthTokens: OAuthTokenService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: Express.Request & { user: User }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: Express.Request & { user: JwtUser }) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Request() req: Express.Request & { user: JwtUser }) {
    return this.authService.refreshTokens(req.user.sub);
  }

  // ── Social sign-in ───────────────────────────────────────
  // The browser is redirected here, over to the provider, and back to the
  // callback below, which hands the web app a single-use code. The web app
  // then trades that code for tokens server-to-server via /auth/oauth/exchange,
  // so no real token ever appears in a URL.

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseFilters(OAuthFailureFilter)
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  googleStart() {
    // The guard redirects to Google; this body never runs.
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseFilters(OAuthFailureFilter)
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  googleCallback(
    @Request() req: OAuthCallbackRequest,
    @Res() res: Response,
  ): void {
    this.completeOAuth(req, res);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseFilters(OAuthFailureFilter)
  @UseGuards(FacebookOAuthGuard)
  @Get('facebook')
  facebookStart() {
    // The guard redirects to Facebook; this body never runs.
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseFilters(OAuthFailureFilter)
  @UseGuards(FacebookOAuthGuard)
  @Get('facebook/callback')
  facebookCallback(
    @Request() req: OAuthCallbackRequest,
    @Res() res: Response,
  ): void {
    this.completeOAuth(req, res);
  }

  // Called server-to-server by the web app, so every request shares one IP and
  // the limit is effectively global. It is a runaway backstop, not a per-user
  // control — the code itself is signed, single-use and expires in a minute.
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  oauthExchange(@Body() dto: OAuthExchangeDto) {
    return this.authService.exchangeOAuthCode(dto.code, dto.nonce);
  }

  /** Verify the state, then bounce back to the web app with a one-time code. */
  private completeOAuth(req: OAuthCallbackRequest, res: Response): void {
    const { nonce, redirect } = this.oauthTokens.verifyState(req.query?.state);
    const code = this.oauthTokens.signExchangeCode(req.user.id, nonce);

    const url = new URL(
      '/api/auth/oauth/callback',
      this.config.getOrThrow<string>('FRONTEND_URL'),
    );
    url.searchParams.set('code', code);
    if (redirect) url.searchParams.set('redirect', redirect);

    res.redirect(url.toString());
  }
}
