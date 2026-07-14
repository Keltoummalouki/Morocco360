import { Injectable } from '@nestjs/common';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';
import { EventSeeder } from './event.seeder';
import { SettingsSeeder } from './settings.seeder';

@Injectable()
export class SeederService {
  constructor(
    private roleSeeder: RoleSeeder,
    private userSeeder: UserSeeder,
    private eventSeeder: EventSeeder,
    private settingsSeeder: SettingsSeeder,
  ) {}

  async seed(): Promise<void> {
    console.log('\nSeeding roles...');
    await this.roleSeeder.seed();

    console.log('\nSeeding users...');
    await this.userSeeder.seed();

    console.log('\nSeeding events...');
    await this.eventSeeder.seed();

    // After events so cityEntity/categoryEntity backfill can link them.
    console.log('\nSeeding settings (countries, cities, languages, categories)...');
    await this.settingsSeeder.seed();

    console.log('\nSeeding complete.');
  }
}
