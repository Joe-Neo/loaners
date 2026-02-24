import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`staff\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`role\` enum('staff','admin') NOT NULL DEFAULT 'staff',
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_staff_username\` (\`username\`),
        UNIQUE INDEX \`IDX_staff_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`students\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`student_id\` varchar(255) NOT NULL,
        \`full_name\` varchar(255) NOT NULL,
        \`email\` varchar(255) NULL,
        \`tutor_group\` varchar(255) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_students_student_id\` (\`student_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`devices\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`asset_number\` varchar(255) NOT NULL,
        \`barcode\` varchar(255) NOT NULL,
        \`qr_code\` varchar(255) NULL,
        \`status\` enum('available','reserved','checked_out','maintenance','retired') NOT NULL DEFAULT 'available',
        \`make\` varchar(255) NULL,
        \`model\` varchar(255) NULL,
        \`serial_number\` varchar(255) NULL,
        \`notes\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_devices_asset_number\` (\`asset_number\`),
        UNIQUE INDEX \`IDX_devices_barcode\` (\`barcode\`),
        UNIQUE INDEX \`IDX_devices_qr_code\` (\`qr_code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`loans\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`student_id\` int NOT NULL,
        \`device_id\` int NULL,
        \`loan_type\` enum('day_loan','extended','repair') NOT NULL DEFAULT 'day_loan',
        \`status\` enum('reserved','checked_out','returned','cancelled') NOT NULL DEFAULT 'reserved',
        \`reason\` varchar(255) NULL,
        \`reserved_at\` timestamp NOT NULL,
        \`checked_out_at\` timestamp NULL,
        \`returned_at\` timestamp NULL,
        \`due_at\` timestamp NOT NULL,
        \`checked_out_by\` int NULL,
        \`returned_to\` int NULL,
        \`notes\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_loans_student_id\` (\`student_id\`),
        INDEX \`IDX_loans_device_id\` (\`device_id\`),
        INDEX \`IDX_loans_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`loans\`
        ADD CONSTRAINT \`FK_loans_student_id\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`),
        ADD CONSTRAINT \`FK_loans_device_id\` FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON DELETE SET NULL,
        ADD CONSTRAINT \`FK_loans_checked_out_by\` FOREIGN KEY (\`checked_out_by\`) REFERENCES \`staff\`(\`id\`) ON DELETE SET NULL,
        ADD CONSTRAINT \`FK_loans_returned_to\` FOREIGN KEY (\`returned_to\`) REFERENCES \`staff\`(\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`loans\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`devices\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`students\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`staff\``);
  }
}
