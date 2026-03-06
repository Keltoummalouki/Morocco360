/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';

// ── Fixtures ──────────────────────────────────────────────
const mockRole: Role = { id: 1, name: RoleName.USER, users: [] };

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashed_password',
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

      await service.create(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
    });

    it('still creates user when USER role is not seeded (role becomes undefined)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      await expect(service.create(dto as any)).resolves.toBeDefined();
    });

    it('throws ConflictException when the email is already in use', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

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
      userRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken(1, 'raw_refresh_token');

      expect(bcrypt.hash).toHaveBeenCalledWith('raw_refresh_token', 10);
      expect(userRepo.update).toHaveBeenCalledWith(1, {
        refresh_token_hash: 'hashed_rt',
      });
    });

    it('stores null on logout (token = null)', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken(1, null);

      expect(userRepo.update).toHaveBeenCalledWith(1, {
        refresh_token_hash: null,
      });
    });
  });
});
