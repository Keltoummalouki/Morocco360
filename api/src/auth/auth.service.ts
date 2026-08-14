import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { OAuthProfileData } from './oauth.types';
import { OAuthTokenService } from './oauth-token.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private oauthTokens: OAuthTokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    // Social accounts have no password — they can only sign in via the provider.
    if (!user.password) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  /** Called by the Google / Facebook strategies once the provider vouches for a profile. */
  async validateOAuthUser(profile: OAuthProfileData): Promise<User> {
    return this.usersService.findOrCreateFromOAuth(profile);
  }

  /**
   * Trade the single-use code from the social callback for a real token pair.
   * Called server-to-server by the web app's BFF, never by the browser.
   */
  async exchangeOAuthCode(code: string, nonce: string) {
    const userId = this.oauthTokens.consumeExchangeCode(code, nonce);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.login(user);
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(user: User) {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      status: user.status,
    };

    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiry = this.config.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    const refreshExpiry = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiry as any, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }),

      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry as any, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
