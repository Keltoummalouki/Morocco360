import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQRScanLogTable1743000001000 implements MigrationInterface {
  name = 'AddQRScanLogTable1743000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "scan_result_enum" AS ENUM ('SUCCESS','ALREADY_USED','INVALID','WRONG_EVENT','EXPIRED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "qr_scan_logs" (
        "id"                 uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id"          integer NOT NULL,
        "scanned_by_user_id" integer NOT NULL,
        "scanned_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "result"             "scan_result_enum" NOT NULL,
        "device_info"        character varying(255),
        CONSTRAINT "PK_qr_scan_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "FK_qr_scan_logs_ticket"
          FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "FK_qr_scan_logs_user"
          FOREIGN KEY ("scanned_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END; $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_qr_scan_logs_ticket_id"  ON "qr_scan_logs" ("ticket_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_qr_scan_logs_scanned_by" ON "qr_scan_logs" ("scanned_by_user_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_scan_logs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "scan_result_enum"`);
  }
}
