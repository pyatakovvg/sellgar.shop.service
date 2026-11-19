import { MigrationInterface, QueryRunner } from 'typeorm';

export class ValidateShopLegalDetails1791522000000 implements MigrationInterface {
  name = 'ValidateShopLegalDetails1791522000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN registration_authority varchar(512)`);
    await queryRunner.query(`ALTER TABLE shop DROP CONSTRAINT shop_legal_details_check`);
    await queryRunner.query(`
      ALTER TABLE shop ADD CONSTRAINT shop_legal_details_check CHECK ((
        (
          legal_form IS NULL AND legal_name IS NULL AND entrepreneur_full_name IS NULL
          AND registration_authority IS NULL AND inn IS NULL AND kpp IS NULL
          AND ogrn IS NULL AND ogrnip IS NULL AND legal_address IS NULL
          AND actual_location IS NULL AND email IS NULL AND phone IS NULL
        )
        OR
        (
          nullif(btrim(legal_address), '') IS NOT NULL
          AND (nullif(btrim(email), '') IS NOT NULL OR nullif(btrim(phone), '') IS NOT NULL)
          AND (
            (
              legal_form = 'legal_entity'
              AND nullif(btrim(legal_name), '') IS NOT NULL
              AND entrepreneur_full_name IS NULL AND registration_authority IS NULL
              AND inn ~ '^[0-9]{10}$' AND kpp ~ '^[0-9]{9}$'
              AND ogrn ~ '^[0-9]{13}$' AND ogrnip IS NULL
            )
            OR
            (
              legal_form = 'individual_entrepreneur'
              AND nullif(btrim(entrepreneur_full_name), '') IS NOT NULL
              AND nullif(btrim(registration_authority), '') IS NOT NULL
              AND legal_name IS NULL AND kpp IS NULL AND ogrn IS NULL
              AND inn ~ '^[0-9]{12}$' AND ogrnip ~ '^[0-9]{15}$'
            )
          )
        )
      ) IS TRUE)
    `);
  }

  async down(): Promise<void> {
    throw new Error('Restore the previous legal-details contract explicitly before removing its constraints and registration data');
  }
}
