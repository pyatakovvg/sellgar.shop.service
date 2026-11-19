import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveShopTimezone1791262800000 implements MigrationInterface {
  name = 'RemoveShopTimezone1791262800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shop DROP COLUMN IF EXISTS timezone`);
  }

  async down(): Promise<void> {
    throw new Error('Timezone is not restored because it does not belong to the Shop model');
  }
}
