import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { LocalStrategy } from '../src/auth/strategies/local.strategy';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../src/auth/strategies/jwt-refresh.strategy';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { Role, RoleName } from '../src/users/entities/role.entity';

// ── Test constants ────────────────────────────────────────
const ACCESS_SECRET = 'test_access_secret_min_32_chars_1234';
const REFRESH_SECRET = 'test_refresh_secret_min_32_chars_12';
const PLAIN_PASSWORD = 'Admin1234';

const mockRole: Role = { id: 1, name: RoleName.USER, users: [] };

async function buildMockUser(): Promise<User> {
  const password = await bcrypt.hash(PLAIN_PASSWORD, 12);
  return {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password,
    full_name: null,
    phone_number: null,
    refresh_token_hash: null,
    created_at: new Date(),
    updated_at: new Date(),
    role: mockRole,
    orders: [],
    events: [],
  } as User;
}

// ── Suite ─────────────────────────────────────────────────
describe('Auth endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let mockUser: User;

  // mutable repository mocks — reset before each test
  const userRepoMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const roleRepoMock = {
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    mockUser = await buildMockUser();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({}),
        ThrottlerModule.forRoot([{ limit: 1000, ttl: 60_000 }]),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Role), useValue: roleRepoMock },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return ACCESS_SECRET;
              if (key === 'JWT_REFRESH_SECRET') return REFRESH_SECRET;
              throw new Error(`Unknown config key: ${key}`);
            }),
            get: jest
              .fn()
              .mockImplementation((_key: string, def: string) => def ?? '15m'),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    roleRepoMock.findOne.mockResolvedValue(mockRole);
  });

  // ── POST /auth/register ────────────────────────────────
  describe('POST /auth/register', () => {
    it('201 – creates a new account and returns tokens', async () => {
      userRepoMock.findOne.mockResolvedValue(null); // no existing user
      userRepoMock.create.mockReturnValue(mockUser);
      userRepoMock.save.mockResolvedValue(mockUser);
      userRepoMock.update.mockResolvedValue({ affected: 1 });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: PLAIN_PASSWORD,
        })
        .expect(201);

      const body = res.body as { accessToken: string; refreshToken: string };
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(typeof body.accessToken).toBe('string');
    });

    it('409 – returns Conflict when the email is already in use', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser); // email exists

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: PLAIN_PASSWORD,
        })
        .expect(409);
    });

    it('400 – returns BadRequest when the body is invalid (missing username)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: PLAIN_PASSWORD })
        .expect(400);
    });

    it('400 – returns BadRequest when the password is too weak', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'user', email: 'test@example.com', password: 'weak' })
        .expect(400);
    });

    it('400 – returns BadRequest when the email is malformed', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'user',
          email: 'not-an-email',
          password: PLAIN_PASSWORD,
        })
        .expect(400);
    });
  });

  // ── POST /auth/login ───────────────────────────────────
  describe('POST /auth/login', () => {
    it('200 – returns tokens with correct credentials', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      userRepoMock.update.mockResolvedValue({ affected: 1 });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: PLAIN_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('401 – returns Unauthorized with a wrong password', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'WrongPassword1' })
        .expect(401);
    });

    it('401 – returns Unauthorized when the user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ghost@example.com', password: PLAIN_PASSWORD })
        .expect(401);
    });

    it('401 – returns Unauthorized when the body is missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: PLAIN_PASSWORD })
        .expect(401);
    });
  });

  // ── POST /auth/logout ──────────────────────────────────
  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser);
      userRepoMock.update.mockResolvedValue({ affected: 1 });
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: PLAIN_PASSWORD });
      accessToken = (res.body as { accessToken: string }).accessToken;
    });

    it('200 – clears the session with a valid JWT', async () => {
      userRepoMock.update.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify refresh_token_hash was set to null
      expect(userRepoMock.update).toHaveBeenCalledWith(mockUser.id, {
        refresh_token_hash: null,
      });
    });

    it('401 – returns Unauthorized without a Bearer token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('401 – returns Unauthorized with a tampered token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });
  });

  // ── POST /auth/refresh ─────────────────────────────────
  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // 1. Login to obtain a real refresh token
      userRepoMock.findOne.mockResolvedValue(mockUser);
      userRepoMock.update.mockResolvedValue({ affected: 1 });
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: PLAIN_PASSWORD });
      refreshToken = (res.body as { refreshToken: string }).refreshToken;

      // 2. Hash the refresh token as the service would store it
      const rtHash = await bcrypt.hash(refreshToken, 10);
      // From now on, findById (called by JwtRefreshStrategy) returns the user
      // with the stored hash so bcrypt.compare succeeds.
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: rtHash,
      });
    });

    it('200 – issues new tokens with a valid refresh token', async () => {
      userRepoMock.update.mockResolvedValue({ affected: 1 });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('401 – returns Unauthorized without a token', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });

    it('403 – returns Forbidden when the stored hash does not match', async () => {
      // Override: stored hash belongs to a different token
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: await bcrypt.hash('completely_different_token', 10),
      });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });

    it('403 – returns Forbidden when the user has no stored hash (already logged out)', async () => {
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser,
        refresh_token_hash: null,
      });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });
  });
});
