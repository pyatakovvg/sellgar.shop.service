import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopAddressOrder1791676800000 implements MigrationInterface {
  name = 'AddShopAddressOrder1791676800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE shop_address
      ADD COLUMN sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0)
    `);
    await queryRunner.query(`
      WITH positions AS (
        SELECT uuid, (row_number() OVER (PARTITION BY shop_uuid ORDER BY type, uuid) - 1)::integer AS position
        FROM shop_address
      )
      UPDATE shop_address AS address
      SET sort_order = positions.position
      FROM positions
      WHERE address.uuid = positions.uuid
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shop_address DROP COLUMN sort_order`);
  }
}
