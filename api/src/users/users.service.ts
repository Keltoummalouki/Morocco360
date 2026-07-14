import {
  BadRequestException,
  ConflictException,
  Injectable,
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

    const valid = await bcrypt.compare(dto.current_password, user.password);
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.new_password, 12);
    await this.repo.save(user);
  }
}
