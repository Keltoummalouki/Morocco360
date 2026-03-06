/* eslint-disable @typescript-eslint/unbound-method */
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
  full_name: null as unknown as string,
  phone_number: null as unknown as string,
  refresh_token_hash: null,
  created_at: new Date(),
  updated_at: new Date(),
  role: mockRole,
  orders: [],
  events: [],
} as User;

// ── Suite ─────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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
          },
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
