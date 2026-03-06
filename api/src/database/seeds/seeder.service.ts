import { Injectable } from '@nestjs/common';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';

@Injectable()
export class SeederService {
  constructor(
    private roleSeeder: RoleSeeder,
    private userSeeder: UserSeeder,
  ) {}

  async seed(): Promise<void> {
    console.log('\nSeeding roles...');
    await this.roleSeeder.seed();

    console.log('\nSeeding users...');
    await this.userSeeder.seed();

    console.log('\nSeeding complete.');
  }
}
