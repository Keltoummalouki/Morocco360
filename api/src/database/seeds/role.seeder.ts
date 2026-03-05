import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from '../../users/entities/role.entity';

@Injectable()
export class RoleSeeder {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    for (const name of Object.values(RoleName)) {
      const exists = await this.roleRepo.findOne({ where: { name } });
      if (!exists) {
        await this.roleRepo.save(this.roleRepo.create({ name }));
        console.log(`  [RoleSeeder] Created role: ${name}`);
      } else {
        console.log(`  [RoleSeeder] Role already exists: ${name}`);
      }
    }
  }
}
