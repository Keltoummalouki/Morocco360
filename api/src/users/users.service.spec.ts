import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { OAuthProfileData } from '../auth/oauth.types';

// ── Fixtures ──────────────────────────────────────────────
const mockRole: Role = { id: 1, name: RoleName.USER, users: [] };

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashed_password',
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
describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));
  });

  // ── findByEmail ──────────────────────────────────────────
  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  // ── findById ─────────────────────────────────────────────
  describe('findById', () => {
    it('returns the user when found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  // ── create ───────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'NewPass1',
    };

    it('creates a user with the default USER role', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(mockRole);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      const saved = { ...mockUser, ...dto, password: 'hashed_pw' } as User;
      userRepo.create.mockReturnValue(saved);
      userRepo.save.mockResolvedValue(saved);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(dto as any);

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { name: RoleName.USER },
      });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          password: 'hashed_pw',
          role: mockRole,
        }),
      );
      expect(result).toEqual(saved);
    });

    it('hashes the password with salt 12', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(mockRole);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await service.create(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
    });

    it('still creates user when USER role is not seeded (role becomes undefined)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.create(dto as any)).resolves.toBeDefined();
    });

    it('throws ConflictException when the email is already in use', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── updateRefreshToken ────────────────────────────────────
  describe('updateRefreshToken', () => {
    it('hashes and stores the token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_rt');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken(1, 'raw_refresh_token');

      expect(bcrypt.hash).toHaveBeenCalledWith('raw_refresh_token', 10);
      expect(userRepo.update).toHaveBeenCalledWith(1, {
        refresh_token_hash: 'hashed_rt',
      });
    });

    it('stores null on logout (token = null)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken(1, null);

      expect(userRepo.update).toHaveBeenCalledWith(1, {
        refresh_token_hash: null,
      });
    });
  });

  // ── updateProfile ────────────────────────────────────────
  describe('updateProfile', () => {
    it('saves when the new username is free', async () => {
      userRepo.findOne
        .mockResolvedValueOnce({ ...mockUser }) // getProfile
        .mockResolvedValueOnce(null); // username availability
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.updateProfile(1, { username: 'freshname' });

      expect(result.username).toBe('freshname');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws Conflict when the username is taken by another user', async () => {
      userRepo.findOne
        .mockResolvedValueOnce({ ...mockUser }) // getProfile
        .mockResolvedValueOnce({ ...mockUser, id: 2 } as User); // taken

      await expect(
        service.updateProfile(1, { username: 'freshname' }),
      ).rejects.toThrow(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('throws Conflict when the email is taken by another user', async () => {
      userRepo.findOne
        .mockResolvedValueOnce({ ...mockUser }) // getProfile
        .mockResolvedValueOnce({ ...mockUser, id: 2 } as User); // taken

      await expect(
        service.updateProfile(1, { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('normalizes a valid phone number to E.164 and saves', async () => {
      userRepo.findOne
        .mockResolvedValueOnce({ ...mockUser }) // getProfile
        .mockResolvedValueOnce(null); // phone availability
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.updateProfile(1, {
        phone_number: '+212612345678',
      });

      expect(result.phone_number).toBe('+212612345678');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequest for an invalid phone number', async () => {
      userRepo.findOne.mockResolvedValueOnce({ ...mockUser }); // getProfile

      await expect(
        service.updateProfile(1, { phone_number: '+2120' }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── findOrCreateFromOAuth ────────────────────────────────
  describe('findOrCreateFromOAuth', () => {
    const googleProfile: OAuthProfileData = {
      provider: 'google',
      providerId: 'google-sub-123',
      email: 'amina.b@gmail.com',
      emailVerified: true,
      firstName: 'Amina',
      lastName: 'Benali',
      fullName: 'Amina Benali',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
    };

    /** Stubs the case-insensitive email lookup used before linking. */
    function mockEmailLookup(result: User | null) {
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(result),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userRepo.createQueryBuilder.mockReturnValue(qb as any);
      return qb;
    }

    it('signs in the account already linked to that provider id', async () => {
      const linked = { ...mockUser, google_id: 'google-sub-123' } as User;
      userRepo.findOne.mockResolvedValueOnce(linked);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.findOrCreateFromOAuth(googleProfile);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { google_id: 'google-sub-123' },
      });
      expect(result.id).toBe(linked.id);
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('links the provider to an existing account with the same verified email', async () => {
      userRepo.findOne.mockResolvedValueOnce(null); // not linked yet
      mockEmailLookup({ ...mockUser, email: 'Amina.B@gmail.com' } as User);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.findOrCreateFromOAuth(googleProfile);

      expect(result.google_id).toBe('google-sub-123');
      expect(result.id).toBe(mockUser.id);
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('never links on an unverified email — it refuses instead', async () => {
      // Linking would let anyone take over an account by claiming its address
      // at the provider; creating anyway would hit the unique email index.
      userRepo.findOne.mockResolvedValueOnce(null); // not linked yet
      mockEmailLookup({ ...mockUser, email: 'amina.b@gmail.com' } as User);

      await expect(
        service.findOrCreateFromOAuth({
          ...googleProfile,
          emailVerified: false,
        }),
      ).rejects.toThrow(ConflictException);
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('creates a fresh account on an unverified email nobody else uses', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // not linked yet
        .mockResolvedValueOnce(null); // username is free
      mockEmailLookup(null);
      roleRepo.findOne.mockResolvedValue(mockRole);
      userRepo.create.mockImplementation((data) => data as User);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      await service.findOrCreateFromOAuth({
        ...googleProfile,
        emailVerified: false,
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          google_id: 'google-sub-123',
          password: null,
        }),
      );
    });

    it('creates a passwordless USER account with a username from the email', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // not linked yet
        .mockResolvedValueOnce(null); // username is free
      mockEmailLookup(null);
      roleRepo.findOne.mockResolvedValue(mockRole);
      userRepo.create.mockImplementation((data) => data as User);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.findOrCreateFromOAuth(googleProfile);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'amina.b',
          email: 'amina.b@gmail.com',
          password: null,
          role: mockRole,
          google_id: 'google-sub-123',
        }),
      );
      expect(result.password).toBeNull();
    });

    it('suffixes the username when the derived one is taken', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // not linked yet
        .mockResolvedValueOnce(mockUser) // 'amina.b' taken
        .mockResolvedValueOnce(null); // 'amina.b1' free
      mockEmailLookup(null);
      roleRepo.findOne.mockResolvedValue(mockRole);
      userRepo.create.mockImplementation((data) => data as User);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      await service.findOrCreateFromOAuth(googleProfile);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'amina.b1' }),
      );
    });

    it('writes the Facebook id to its own column', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      mockEmailLookup({ ...mockUser } as User);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.findOrCreateFromOAuth({
        ...googleProfile,
        provider: 'facebook',
        providerId: 'fb-999',
      });

      expect(result.facebook_id).toBe('fb-999');
      expect(result.google_id).toBeNull();
    });

    it('refuses rather than mint a role-less account when USER is not seeded', async () => {
      // Such an account carries `role: null` in its JWT, which the web
      // middleware reads as signed-out — and being passwordless there is no
      // way back in. Failing here is what keeps it recoverable.
      userRepo.findOne
        .mockResolvedValueOnce(null) // not linked yet
        .mockResolvedValueOnce(null); // username is free
      mockEmailLookup(null);
      roleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOrCreateFromOAuth(googleProfile),
      ).rejects.toThrow(InternalServerErrorException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequest when the provider shares no email', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.findOrCreateFromOAuth({
          ...googleProfile,
          email: null,
          emailVerified: false,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('keeps a picture the user already has', async () => {
      const linked = {
        ...mockUser,
        google_id: 'google-sub-123',
        avatar_url: 'https://eventhub.com/uploads/mine.webp',
      } as User;
      userRepo.findOne.mockResolvedValueOnce(linked);
      userRepo.save.mockImplementation((u) => Promise.resolve(u as User));

      const result = await service.findOrCreateFromOAuth(googleProfile);

      expect(result.avatar_url).toBe('https://eventhub.com/uploads/mine.webp');
    });
  });

  // ── changePassword ───────────────────────────────────────
  describe('changePassword', () => {
    it('refuses on a social account that has no password', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        password: null,
      } as User);

      await expect(
        service.changePassword(1, {
          current_password: 'whatever',
          new_password: 'NewPass1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });
});
