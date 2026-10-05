import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveShopFiscalBinding1791349200000 implements MigrationInterface {
  name = 'RemoveShopFiscalBinding1791349200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS shop_fiscal_binding`);
  }

  async down(): Promise<void> {
    throw new Error('Fiscal bindings are not restored because they do not belong to the Shop model');
  }
}
