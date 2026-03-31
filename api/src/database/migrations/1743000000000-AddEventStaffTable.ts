import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventStaffTable1743000000000 implements MigrationInterface {
  name = 'AddEventStaffTable1743000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotent: skip if enum already exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "event_staff_role_enum" AS ENUM ('ORGANIZER', 'STAFF');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_staff" (
        "id"                  uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "event_id"            integer NOT NULL,
        "user_id"             integer NOT NULL,
        "staff_role"          "event_staff_role_enum" NOT NULL,
        "assigned_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "assigned_by_user_id" integer,
        CONSTRAINT "UQ_event_staff_event_user" UNIQUE ("event_id", "user_id"),
        CONSTRAINT "PK_event_staff" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "event_staff" ADD CONSTRAINT "FK_event_staff_event"
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "event_staff" ADD CONSTRAINT "FK_event_staff_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "event_staff" ADD CONSTRAINT "FK_event_staff_assigned_by"
          FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_event_staff_event_id" ON "event_staff" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_event_staff_user_id"  ON "event_staff" ("user_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "event_staff"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_staff_role_enum"`);
  }
}
