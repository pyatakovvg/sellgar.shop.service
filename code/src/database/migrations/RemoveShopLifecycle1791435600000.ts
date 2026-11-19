import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveShopLifecycle1791435600000 implements MigrationInterface {
  name = 'RemoveShopLifecycle1791435600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shop DROP COLUMN IF EXISTS status`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_status_enum_v2`);
  }

  async down(): Promise<void> {
    throw new Error('Shop lifecycle is not restored because Shop is an information record');
  }
}
