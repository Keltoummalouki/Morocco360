import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Additive enum-value changes for the admin backoffice. PostgreSQL can only
 * grow an existing enum via `ALTER TYPE ... ADD VALUE`; TypeORM's synchronize
 * cannot. `IF NOT EXISTS` makes every statement safe to re-run.
 *
 * New tables/columns (countries, cities, languages, event_categories,
 * event_reviews, event.status, payment.invoice_*, etc.) are created by
 * synchronize in dev and would be added by a schema migration in production.
 */
export class AdminBackofficeEnums1743000003000 implements MigrationInterface {
  name = 'AdminBackofficeEnums1743000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "orders_status_enum" ADD VALUE IF NOT EXISTS 'SUSPENDED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "tickets_status_enum" ADD VALUE IF NOT EXISTS 'SUSPENDED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "payments_status_enum" ADD VALUE IF NOT EXISTS 'PAID'`,
    );
    await queryRunner.query(
      `ALTER TYPE "payments_status_enum" ADD VALUE IF NOT EXISTS 'NOT_PAID'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL does not support removing enum values. Rolling back would
    // require recreating each type without the added value and migrating data.
    // Left as a no-op for safety, matching the other enum migrations.
  }
}
