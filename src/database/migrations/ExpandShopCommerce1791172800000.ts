import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandShopCommerce1791172800000 implements MigrationInterface {
  name = 'ExpandShopCommerce1791172800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.createEnums(queryRunner);

    if (await queryRunner.hasTable('shop')) await this.upgradeShop(queryRunner);
    else await this.createShop(queryRunner);

    await this.createShopIndexes(queryRunner);
    await this.createOwnedShopTables(queryRunner);
    await this.createOutbox(queryRunner);
  }

  async down(): Promise<void> {
    throw new Error('The shop commerce migration is irreversible because it introduces versioned legal records');
  }

  private async createEnums(queryRunner: QueryRunner): Promise<void> {
    const enums: Record<string, string[]> = {
      shop_legal_form_enum: ['legal_entity', 'individual_entrepreneur'],
      shop_contact_type_enum: ['email', 'phone'],
      shop_contact_purpose_enum: ['support', 'claims', 'receipts'],
      shop_address_type_enum: ['claims', 'returns', 'pickup'],
    };

    for (const [name, values] of Object.entries(enums)) {
      const quoted = values.map((value) => `'${value}'`).join(', ');
      await queryRunner.query(`DO $$ BEGIN CREATE TYPE ${name} AS ENUM (${quoted}); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    }
  }

  private async createShop(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE shop (
        uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        version integer NOT NULL DEFAULT 1,
        name varchar(512) NOT NULL UNIQUE,
        legal_form shop_legal_form_enum,
        legal_name varchar(512),
        entrepreneur_full_name varchar(512),
        inn varchar(12),
        kpp varchar(9),
        ogrn varchar(13),
        ogrnip varchar(15),
        legal_address text,
        actual_location text,
        email varchar(320),
        phone varchar(32),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT shop_legal_details_check CHECK (${this.legalDetailsCheck()})
      )
    `);
  }

  private async upgradeShop(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS legal_form shop_legal_form_enum`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS legal_name varchar(512)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS entrepreneur_full_name varchar(512)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS inn varchar(12)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS kpp varchar(9)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS ogrn varchar(13)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS ogrnip varchar(15)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS legal_address text`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS actual_location text`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS email varchar(320)`);
    await queryRunner.query(`ALTER TABLE shop ADD COLUMN IF NOT EXISTS phone varchar(32)`);
    await queryRunner.query(`ALTER TABLE shop DROP COLUMN IF EXISTS default_currency_code`);
    await queryRunner.query(`ALTER TABLE shop ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC'`);
    await queryRunner.query(`ALTER TABLE shop ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC'`);
    await queryRunner.query(`ALTER TABLE shop ADD CONSTRAINT shop_legal_details_check CHECK (${this.legalDetailsCheck()})`);
  }

  private async createShopIndexes(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS shop_inn_unique ON shop(inn) WHERE inn IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS shop_ogrn_unique ON shop(ogrn) WHERE ogrn IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS shop_ogrnip_unique ON shop(ogrnip) WHERE ogrnip IS NOT NULL`);
  }

  private async createOwnedShopTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shop_contact (
        uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_uuid uuid NOT NULL REFERENCES shop(uuid) ON DELETE CASCADE,
        type shop_contact_type_enum NOT NULL,
        purpose shop_contact_purpose_enum NOT NULL,
        value varchar(512) NOT NULL,
        is_public boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS shop_contact_shop_idx ON shop_contact(shop_uuid, purpose, sort_order)`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shop_address (
        uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_uuid uuid NOT NULL REFERENCES shop(uuid) ON DELETE CASCADE,
        type shop_address_type_enum NOT NULL,
        address text NOT NULL,
        comment text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS shop_address_shop_idx ON shop_address(shop_uuid, type)`);
  }

  private createOutbox(queryRunner: QueryRunner): Promise<void> {
    return queryRunner.query(`
      CREATE TABLE IF NOT EXISTS outbox_event (
        uuid uuid PRIMARY KEY,
        producer varchar(128) NOT NULL,
        aggregate_type varchar(128) NOT NULL,
        aggregate_id varchar(256) NOT NULL,
        aggregate_version integer NOT NULL,
        event_type varchar(256) NOT NULL,
        schema_version integer NOT NULL,
        payload jsonb NOT NULL,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz,
        next_attempt_at timestamptz DEFAULT now(),
        processing_started_at timestamptz,
        status varchar(64) NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        last_error text,
        CONSTRAINT outbox_aggregate_version_unique UNIQUE (aggregate_type, aggregate_id, aggregate_version)
      );
      CREATE INDEX IF NOT EXISTS outbox_publish_idx ON outbox_event(status, next_attempt_at, occurred_at)
    `);
  }

  private legalDetailsCheck(): string {
    return `
      (
        legal_form IS NULL
        AND legal_name IS NULL
        AND entrepreneur_full_name IS NULL
        AND inn IS NULL
        AND kpp IS NULL
        AND ogrn IS NULL
        AND ogrnip IS NULL
        AND legal_address IS NULL
        AND actual_location IS NULL
        AND email IS NULL
        AND phone IS NULL
      )
      OR
      (
        legal_form = 'legal_entity'
        AND legal_name IS NOT NULL
        AND entrepreneur_full_name IS NULL
        AND inn ~ '^\\d{10}$'
        AND (kpp IS NULL OR kpp ~ '^\\d{9}$')
        AND ogrn ~ '^\\d{13}$'
        AND ogrnip IS NULL
        AND legal_address IS NOT NULL
        AND (email IS NOT NULL OR phone IS NOT NULL)
      )
      OR
      (
        legal_form = 'individual_entrepreneur'
        AND legal_name IS NULL
        AND entrepreneur_full_name IS NOT NULL
        AND inn ~ '^\\d{12}$'
        AND kpp IS NULL
        AND ogrn IS NULL
        AND ogrnip ~ '^\\d{15}$'
        AND legal_address IS NOT NULL
        AND (email IS NOT NULL OR phone IS NOT NULL)
      )
    `;
  }
}
