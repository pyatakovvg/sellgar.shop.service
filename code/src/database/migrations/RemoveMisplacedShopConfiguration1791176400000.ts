import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMisplacedShopConfiguration1791176400000 implements MigrationInterface {
  name = 'RemoveMisplacedShopConfiguration1791176400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS shop_domain`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_domain_type_enum`);
    await queryRunner.query(`DROP TABLE IF EXISTS shop_delivery_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_delivery_method_type_enum`);
    await queryRunner.query(`DROP TABLE IF EXISTS shop_legal_document`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_legal_document_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS shop_legal_document_type_enum`);
  }

  async down(): Promise<void> {
    throw new Error('Removed storefront, checkout, and document configuration is not restored by Shop service');
  }
}
