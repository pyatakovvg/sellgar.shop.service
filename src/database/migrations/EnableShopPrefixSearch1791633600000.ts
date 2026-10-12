import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableShopPrefixSearch1791633600000 implements MigrationInterface {
  name = 'EnableShopPrefixSearch1791633600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX shop_search_vector_idx');
    await queryRunner.query(`
      CREATE INDEX shop_search_vector_idx ON shop USING GIN ((
        to_tsvector('simple',
          coalesce(name, '') || ' ' ||
          coalesce(legal_name, '') || ' ' ||
          coalesce(entrepreneur_full_name, '') || ' ' ||
          coalesce(inn, '') || ' ' ||
          coalesce(kpp, '') || ' ' ||
          coalesce(ogrn, '') || ' ' ||
          coalesce(ogrnip, '')
        ) || to_tsvector('russian',
          coalesce(name, '') || ' ' ||
          coalesce(legal_name, '') || ' ' ||
          coalesce(entrepreneur_full_name, '') || ' ' ||
          coalesce(inn, '') || ' ' ||
          coalesce(kpp, '') || ' ' ||
          coalesce(ogrn, '') || ' ' ||
          coalesce(ogrnip, '')
        )
      ))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX shop_search_vector_idx');
    await queryRunner.query(`
      CREATE INDEX shop_search_vector_idx ON shop USING GIN (
        to_tsvector('russian',
          coalesce(name, '') || ' ' ||
          coalesce(legal_name, '') || ' ' ||
          coalesce(entrepreneur_full_name, '') || ' ' ||
          coalesce(inn, '') || ' ' ||
          coalesce(kpp, '') || ' ' ||
          coalesce(ogrn, '') || ' ' ||
          coalesce(ogrnip, '')
        )
      )
    `);
  }
}
