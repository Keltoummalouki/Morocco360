import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { AuthService } from './auth.service';
import { OAuthTokenService } from './oauth-token.service';
import { OAuthProfileData } from './oauth.types';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';

// ── Fixtures ──────────────────────────────────────────────
const mockRole: Role = { id: 1, name: RoleName.USER, users: [] };

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  first_name: null as unknown as string,
  last_name: null as unknown as string,
  full_name: null as unknown as string,
  date_of_birth: null,
  phone_number: null as unknown as string,
  refresh_token_hash: null,
  google_id: null,
  facebook_id: null,
  avatar_url: null,
  status: 'ACTIVE' as const,
  created_at: new Date(),
  updated_at: new Date(),
  role: mockRole,
  orders: [],
  events: [],
  savedEvents: [],
} as User;

// ── Suite ─────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let oauthTokens: jest.Mocked<OAuthTokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
            findOrCreateFromOAuth: jest.fn(),
          },
        },
        {
          provide: OAuthTokenService,
          useValue: { consumeExchangeCode: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test_secret'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    oauthTokens = module.get(OAuthTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── validateUser ────────────────────────────────────────
  describe('validateUser', () => {
    it('returns the user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'Password1',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('returns null when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'ghost@example.com',
        'Password1',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns null when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'WrongPass1',
      );

      expect(result).toBeNull();
    });

    it('returns null for a social account, without touching bcrypt', async () => {
      // bcrypt.compare against a null hash would throw; a passwordless account
      // must simply fail the password login.
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: null,
      } as User);

      const result = await service.validateUser('test@example.com', 'anything');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  // ── OAuth ────────────────────────────────────────────────
  describe('validateOAuthUser', () => {
    it('delegates to the users service', async () => {
      const profile: OAuthProfileData = {
        provider: 'google',
        providerId: 'sub-1',
        email: 'a@b.com',
        emailVerified: true,
        firstName: null,
        lastName: null,
        fullName: null,
        avatarUrl: null,
      };
      usersService.findOrCreateFromOAuth.mockResolvedValue(mockUser);

      await expect(service.validateOAuthUser(profile)).resolves.toEqual(
        mockUser,
      );
      expect(usersService.findOrCreateFromOAuth).toHaveBeenCalledWith(profile);
    });
  });

  describe('exchangeOAuthCode', () => {
    beforeEach(() => {
      jwtService.signAsync
        .mockResolvedValueOnce('access.jwt')
        .mockResolvedValueOnce('refresh.jwt');
    });

    it('spends the code and issues a token pair', async () => {
      oauthTokens.consumeExchangeCode.mockReturnValue(1);
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.exchangeOAuthCode('the-code', 'the-nonce');

      expect(oauthTokens.consumeExchangeCode).toHaveBeenCalledWith(
        'the-code',
        'the-nonce',
      );
      expect(result).toEqual({
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        1,
        'refresh.jwt',
      );
    });

    it('throws when the code points at a user who no longer exists', async () => {
      oauthTokens.consumeExchangeCode.mockReturnValue(404);
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.exchangeOAuthCode('the-code', 'the-nonce'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  // ── login ────────────────────────────────────────────────
  describe('login', () => {
    beforeEach(() => {
      jwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);
    });

    it('returns accessToken and refreshToken', async () => {
      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });
    });

    it('signs the JWT with sub, email, and role from the user', async () => {
      await service.login(mockUser);

      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockRole.name,
        status: mockUser.status,
      };
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expectedPayload,
        expect.objectContaining({ secret: 'test_secret' }),
      );
    });

    it('stores the hashed refresh token', async () => {
      await service.login(mockUser);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'mock_refresh_token',
      );
    });
  });

  // ── register ─────────────────────────────────────────────
  describe('register', () => {
    const dto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'NewPass1',
    };

    beforeEach(() => {
      usersService.create.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);
    });

    it('creates the user and returns tokens', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.register(dto as any);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });
    });
  });

  // ── logout ───────────────────────────────────────────────
  describe('logout', () => {
    it('clears the refresh token hash', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(mockUser.id);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });
  });

  // ── refreshTokens ────────────────────────────────────────
  describe('refreshTokens', () => {
    it('throws UnauthorizedException when the user is not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues new tokens for a valid user', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens(mockUser.id);

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'new_refresh_token',
      );
    });
  });

  // ── generateTokens (role null edge case) ─────────────────
  describe('generateTokens (edge cases)', () => {
    it('sets role to null in the payload when the user has no role', async () => {
      const userNoRole = { ...mockUser, role: null } as unknown as User;
      usersService.findById.mockResolvedValue(userNoRole);
      jwtService.signAsync.mockResolvedValue('token' as never);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.refreshTokens(userNoRole.id);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ role: null }),
        expect.anything(),
      );
    });
  });
});
