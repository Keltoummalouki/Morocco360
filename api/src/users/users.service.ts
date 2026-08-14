import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { OAuthProfileData, OAuthProvider } from '../auth/oauth.types';
import {
  OAuthEmailMissingException,
  OAuthEmailTakenException,
} from '../auth/oauth.errors';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/** Which column on `users` holds each provider's subject id. */
const PROVIDER_ID_COLUMN: Record<OAuthProvider, 'google_id' | 'facebook_id'> = {
  google: 'google_id',
  facebook: 'facebook_id',
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: RegisterDto): Promise<User> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');

    const defaultRole = await this.roleRepo.findOne({
      where: { name: RoleName.USER },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      ...dto,
      password: passwordHash,
      role: defaultRole ?? undefined,
    });
    return this.repo.save(user);
  }

  /**
   * Resolve the account behind a social profile, creating or linking as needed:
   *
   * 1. the provider id is already on an account → sign that user in;
   * 2. the provider vouches for an email we already know → link the provider
   *    to that account, so signing up with a password and later using "Continue
   *    with Google" lands on the same profile;
   * 3. otherwise → create a passwordless account with the USER role.
   *
   * Step 2 only runs for a provider-verified address. An unverified one would
   * let anybody take over an account by claiming its email at the provider.
   */
  async findOrCreateFromOAuth(profile: OAuthProfileData): Promise<User> {
    const idColumn = PROVIDER_ID_COLUMN[profile.provider];

    const linked = await this.repo.findOne({
      where: { [idColumn]: profile.providerId },
    });
    if (linked) return this.refreshAvatar(linked, profile);

    if (!profile.email) {
      throw new OAuthEmailMissingException(
        `Your ${profile.provider} account did not share an email address, which we need to create your account.`,
      );
    }

    const existing = await this.findByEmailIgnoringCase(profile.email);
    if (existing) {
      // Only a provider-verified address may take over an existing account.
      if (!profile.emailVerified) {
        throw new OAuthEmailTakenException(
          `An account already uses this email. Sign in with your password first, because ${profile.provider} has not verified that the address is yours.`,
        );
      }
      existing[idColumn] = profile.providerId;
      return this.refreshAvatar(existing, profile);
    }

    const defaultRole = await this.roleRepo.findOne({
      where: { name: RoleName.USER },
    });
    // A social account with no role is unrecoverable: its JWT carries
    // `role: null`, the middleware reads that as signed-out, and there is no
    // password to fall back on — so the user would bounce to /login forever.
    // Better to fail loudly than to mint a dead account.
    if (!defaultRole) {
      throw new InternalServerErrorException(
        'The USER role is missing — run the database seed before signing in.',
      );
    }

    const user = this.repo.create({
      username: await this.generateUsername(profile.email),
      email: profile.email,
      password: null, // social accounts sign in through the provider only
      first_name: profile.firstName ?? undefined,
      last_name: profile.lastName ?? undefined,
      full_name:
        profile.fullName ||
        [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
        undefined,
      avatar_url: profile.avatarUrl,
      [idColumn]: profile.providerId,
      role: defaultRole,
    });

    return this.repo.save(user);
  }

  /** Emails are stored as typed, so match case-insensitively before linking. */
  private async findByEmailIgnoringCase(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  private async refreshAvatar(
    user: User,
    profile: OAuthProfileData,
  ): Promise<User> {
    // Keep a picture the user set themselves; only fill a blank one.
    if (profile.avatarUrl && !user.avatar_url) {
      user.avatar_url = profile.avatarUrl;
    }
    return this.repo.save(user);
  }

  /** Derive a free username from the email local part (`amina.b@gmail.com` → `amina.b`). */
  private async generateUsername(email: string): Promise<string> {
    const cleaned = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 40);
    const base = cleaned.length >= 3 ? cleaned : `${cleaned}user`.slice(0, 40);

    for (let suffix = 0; suffix < 50; suffix++) {
      const candidate = suffix === 0 ? base : `${base}${suffix}`;
      const taken = await this.repo.findOne({ where: { username: candidate } });
      if (!taken) return candidate;
    }
    return `${base}${Date.now().toString(36)}`;
  }

  async updateRefreshToken(
    userId: number,
    token: string | null,
  ): Promise<void> {
    const hash = token ? await bcrypt.hash(token, 10) : null;
    await this.repo.update(userId, { refresh_token_hash: hash });
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId);

    // ── Username: unique across other users ──────────────────
    if (dto.username !== undefined && dto.username !== user.username) {
      const taken = await this.repo.findOne({
        where: { username: dto.username, id: Not(userId) },
      });
      if (taken) throw new ConflictException('Username already taken');
      user.username = dto.username;
    }

    // ── Email: valid (DTO) + unique across other users ───────
    if (dto.email !== undefined && dto.email !== user.email) {
      const taken = await this.repo.findOne({
        where: { email: dto.email, id: Not(userId) },
      });
      if (taken) throw new ConflictException('Email already in use');
      user.email = dto.email;
    }

    // ── Phone: libphonenumber validate + E.164 + unique ──────
    if (dto.phone_number !== undefined) {
      const raw = dto.phone_number.trim();
      if (raw === '') {
        user.phone_number = null as unknown as string;
      } else {
        const parsed = parsePhoneNumberFromString(raw);
        if (!parsed || !parsed.isValid()) {
          throw new BadRequestException(
            'Invalid phone number — include the country code (e.g. +212 …)',
          );
        }
        const normalized = parsed.number; // E.164, e.g. +2126…
        if (normalized !== user.phone_number) {
          const taken = await this.repo.findOne({
            where: { phone_number: normalized, id: Not(userId) },
          });
          if (taken) throw new ConflictException('Phone number already in use');
        }
        user.phone_number = normalized;
      }
    }

    if (dto.full_name !== undefined) {
      // Store a cleared name as NULL rather than an empty string.
      user.full_name = (dto.full_name.trim() || null) as unknown as string;
    }

    return this.repo.save(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new BadRequestException(
        'This account signs in with Google or Facebook and has no password to change.',
      );
    }

    const valid = await bcrypt.compare(dto.current_password, user.password);
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.new_password, 12);
    await this.repo.save(user);
  }
}
