import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds STAFF to the roles_name_enum PostgreSQL type.
 * Must run BEFORE TypeORM synchronize attempts to use the new enum value.
 * Uses `IF NOT EXISTS` so it is safe to re-run.
 */
export class AddStaffRoleEnum1742999999000 implements MigrationInterface {
  name = 'AddStaffRoleEnum1742999999000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires ALTER TYPE ... ADD VALUE to extend an existing enum.
    // TypeORM's synchronize cannot do this natively — it needs a migration.
    await queryRunner.query(
      `ALTER TYPE "roles_name_enum" ADD VALUE IF NOT EXISTS 'STAFF'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL does not support removing values from an enum.
    // To rollback: recreate the type without STAFF and migrate data.
    // This is intentionally left as a no-op for safety.
  }
}
