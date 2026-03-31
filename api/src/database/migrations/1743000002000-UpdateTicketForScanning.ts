import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTicketForScanning1743000002000 implements MigrationInterface {
  name = 'UpdateTicketForScanning1743000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Only transform the enum if the old 'USED' value still exists.
    // If synchronize already ran and updated the enum, this block is skipped.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'tickets_status_enum' AND e.enumlabel = 'USED'
        ) THEN
          ALTER TYPE "tickets_status_enum" RENAME TO "tickets_status_enum_old";
          CREATE TYPE "tickets_status_enum" AS ENUM ('PENDING','VALID','CHECKED','CANCELLED','REFUNDED');
          ALTER TABLE "tickets"
            ALTER COLUMN "status" DROP DEFAULT,
            ALTER COLUMN "status" TYPE "tickets_status_enum"
              USING CASE WHEN status::text = 'USED' THEN 'CHECKED' ELSE status::text END::"tickets_status_enum",
            ALTER COLUMN "status" SET DEFAULT 'VALID';
          DROP TYPE "tickets_status_enum_old";
        END IF;
      END; $$
    `);

    // Make qr_code nullable — safe to run even if already nullable
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "qr_code" DROP NOT NULL`,
    );

    // Add new columns — IF NOT EXISTS is idempotent
    await queryRunner.query(`
      ALTER TABLE "tickets"
        ADD COLUMN IF NOT EXISTS "seat_number"        character varying(50),
        ADD COLUMN IF NOT EXISTS "checked_at"         TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "checked_by_user_id" integer,
        ADD COLUMN IF NOT EXISTS "event_id"           integer
    `);

    // Add FK constraints — skip if they already exist
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_checked_by"
          FOREIGN KEY ("checked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_event"
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tickets_event_id" ON "tickets" ("event_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_event_id"`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_checked_by";
      EXCEPTION WHEN undefined_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_event";
      EXCEPTION WHEN undefined_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
        DROP COLUMN IF EXISTS "seat_number",
        DROP COLUMN IF EXISTS "checked_at",
        DROP COLUMN IF EXISTS "checked_by_user_id",
        DROP COLUMN IF EXISTS "event_id"
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'tickets_status_enum' AND e.enumlabel = 'USED'
        ) THEN
          ALTER TYPE "tickets_status_enum" RENAME TO "tickets_status_enum_old";
          CREATE TYPE "tickets_status_enum" AS ENUM ('VALID','USED','CANCELLED');
          ALTER TABLE "tickets"
            ALTER COLUMN "status" DROP DEFAULT,
            ALTER COLUMN "status" TYPE "tickets_status_enum"
              USING CASE WHEN status::text = 'CHECKED' THEN 'USED'
                         WHEN status::text IN ('PENDING','REFUNDED') THEN 'CANCELLED'
                         ELSE status::text END::"tickets_status_enum",
            ALTER COLUMN "status" SET DEFAULT 'VALID';
          DROP TYPE "tickets_status_enum_old";
        END IF;
      END; $$
    `);
  }
}
