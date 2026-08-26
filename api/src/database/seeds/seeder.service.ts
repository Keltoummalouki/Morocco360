import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';
import { EventSeeder } from './event.seeder';
import { SettingsSeeder } from './settings.seeder';
import { CommerceSeeder } from './commerce.seeder';
import { ReviewSeeder } from './review.seeder';

/** Child-first order so `TRUNCATE ... CASCADE` never trips a FK. */
const SEEDED_TABLES = [
  'qr_scan_logs',
  'tickets',
  'payments',
  'orders',
  'event_reviews',
  'event_staff',
  'user_saved_events',
  'ticket_categories',
  'events',
  'cities',
  'country_languages',
  'countries',
  'languages',
  'event_categories',
  'users',
  'roles',
];

const COUNTED_TABLES = [
  'roles',
  'users',
  'countries',
  'cities',
  'languages',
  'event_categories',
  'events',
  'ticket_categories',
  'event_staff',
  'orders',
  'payments',
  'tickets',
  'qr_scan_logs',
  'event_reviews',
  'user_saved_events',
];

@Injectable()
export class SeederService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly roleSeeder: RoleSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly eventSeeder: EventSeeder,
    private readonly settingsSeeder: SettingsSeeder,
    private readonly commerceSeeder: CommerceSeeder,
    private readonly reviewSeeder: ReviewSeeder,
  ) {}

  async seed(fresh = false): Promise<void> {
    if (fresh) {
      console.log('\nResetting seeded tables...');
      await this.reset();
    }

    console.log('\nSeeding roles...');
    await this.roleSeeder.seed();

    console.log('\nSeeding users...');
    await this.userSeeder.seed();

    console.log('\nSeeding events, ticket categories and staff...');
    await this.eventSeeder.seed();

    // After events so cityEntity/categoryEntity backfill can link them.
    console.log(
      '\nSeeding settings (countries, cities, languages, categories)...',
    );
    await this.settingsSeeder.seed();

    console.log('\nSeeding orders, payments, tickets and scans...');
    await this.commerceSeeder.seed();

    console.log('\nSeeding reviews...');
    await this.reviewSeeder.seed();

    await this.printSummary();
  }

  /** Wipes only the tables this seeder owns, restarting their identities. */
  private async reset(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to run --fresh against a production database');
    }
    const tables = SEEDED_TABLES.map((t) => `"${t}"`).join(', ');
    await this.dataSource.query(
      `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
    );
  }

  private async printSummary(): Promise<void> {
    console.log('\nSeeding complete.\n');
    for (const table of COUNTED_TABLES) {
      const rows: { count: number }[] = await this.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM "${table}"`,
      );
      console.log(`  ${table.padEnd(20)} ${rows[0].count}`);
    }
    console.log('\nLogins (all seeded accounts):');
    console.log('  admin@eventhub.com      Admin1234');
    console.log('  organizer@eventhub.com  Organizer1234');
    console.log('  organizer2@eventhub.com Organizer1234');
    console.log('  staff@eventhub.com      Staff1234');
    console.log('  staff2@eventhub.com     Staff1234');
    console.log('  user@eventhub.com       User1234');
    console.log(
      '  <firstname>@example.ma   User1234  (amine, sara, youssef, imane, karim, nadia)',
    );
    console.log('  suspended@eventhub.com  User1234  (blocked account)');
  }
}
