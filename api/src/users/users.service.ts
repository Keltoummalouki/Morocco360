import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { RegisterDto } from '../auth/dto/register.dto';

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
}
