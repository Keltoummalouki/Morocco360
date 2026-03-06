import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Role, RoleName } from '../../users/entities/role.entity';

interface SeedUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  roleName: RoleName;
}

const SEED_USERS: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@morocco360.ma',
    password: 'Admin1234',
    full_name: 'Administrator',
    roleName: RoleName.ADMIN,
  },
  {
    username: 'organizer',
    email: 'organizer@morocco360.ma',
    password: 'Organizer1234',
    full_name: 'Event Organizer',
    roleName: RoleName.ORGANIZER,
  },
  {
    username: 'user',
    email: 'user@morocco360.ma',
    password: 'User1234',
    full_name: 'Test User',
    roleName: RoleName.USER,
  },
];

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    for (const data of SEED_USERS) {
      const exists = await this.userRepo.findOne({
        where: { email: data.email },
      });
      if (exists) {
        console.log(`  [UserSeeder] User already exists: ${data.email}`);
        continue;
      }

      const role = await this.roleRepo.findOne({
        where: { name: data.roleName },
      });
      if (!role) {
        console.warn(
          `  [UserSeeder] Role not found: ${data.roleName} — run role seeder first`,
        );
        continue;
      }

      const passwordHash = await bcrypt.hash(data.password, 12);
      const user = this.userRepo.create({
        username: data.username,
        email: data.email,
        password: passwordHash,
        full_name: data.full_name,
        role,
      });
      await this.userRepo.save(user);
      console.log(
        `  [UserSeeder] Created user: ${data.email} (${data.roleName})`,
      );
    }
  }
}
