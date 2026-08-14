import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Social sign-in (Google / Facebook) support on the users table.
 *
 * - `password` becomes nullable: accounts created through a provider never
 *   have one.
 * - `google_id` / `facebook_id` hold the provider's stable subject id. One
 *   column per provider so a single account can be linked to both. They are
 *   unique, and PostgreSQL allows many NULLs inside a unique index.
 * - `avatar_url` stores the picture the provider hands back.
 *
 * Every statement is guarded so the migration is safe to re-run, and it is
 * skipped entirely on a brand-new database where synchronize creates the
 * table with these columns already present.
 */
export class AddSocialAuthColumns1743000004000 implements MigrationInterface {
  name = 'AddSocialAuthColumns1743000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('users'))) return;

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "facebook_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_google_id" ON "users" ("google_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_facebook_id" ON "users" ("facebook_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('users'))) return;

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_facebook_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_google_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "facebook_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id"`,
    );
    // `password` is left nullable: rows created via a provider have no value
    // to backfill, so restoring NOT NULL would fail.
  }
}
