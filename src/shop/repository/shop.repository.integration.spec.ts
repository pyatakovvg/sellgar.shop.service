import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { DataSource, QueryRunner } from 'typeorm';

import { databaseOptions } from '../../database/database.options';
import { ShopOutboxService } from '../../integration/outbox/shop-outbox.service';
import { ShopAddressType } from '../shop-address-type.enum';
import { ShopModel } from '../shop.model';
import { ShopRepository } from './shop.repository';

const describeDatabase = process.env.SHOP_SEARCH_INTEGRATION === 'true' ? describe : describe.skip;

describeDatabase('ShopRepository full-text search in PostgreSQL', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let repository: ShopRepository;
  const prefix = `fts${randomUUID().replace(/[^a-z]/g, '')}`;
  const books = [randomUUID(), randomUUID()];
  const organization = randomUUID();
  const entrepreneur = randomUUID();
  const digits = randomUUID().replace(/\D/g, '').padEnd(15, '0').slice(0, 15);
  const organizationInn = `${(Number(digits[0]) + 1) % 10}${digits.slice(1, 10)}`;
  const entrepreneurInn = `${(Number(digits[0]) + 2) % 10}${digits.slice(1, 12)}`;

  beforeAll(async () => {
    const env = { ...parseEnv(readFileSync('.env', 'utf8')), ...process.env };
    dataSource = await new DataSource(databaseOptions(env)).initialize();
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    jest.spyOn(dataSource, 'getRepository').mockImplementation((target) => queryRunner.manager.getRepository(target));
    repository = new ShopRepository(dataSource, {} as ShopOutboxService);

    await queryRunner.query(
      `
      INSERT INTO shop (uuid, name, created_at) VALUES
        ($1, $2, '2026-01-02'), ($3, $4, '2026-01-01')
    `,
      [books[0], `${prefix} Книга красная`, books[1], `${prefix} Книги зелёные`],
    );
    await queryRunner.query(
      `
      INSERT INTO shop (uuid, name, legal_form, legal_name, inn, kpp, ogrn, legal_address, email)
      VALUES ($1, $2, 'legal_entity', 'ООО Северная электроника', $3, '770001001', $4, 'Москва', 'shop@example.ru')
    `,
      [organization, `${prefix} Телевизор`, organizationInn, digits.slice(0, 13)],
    );
    await queryRunner.query(
      `
      INSERT INTO shop (
        uuid, name, legal_form, entrepreneur_full_name, registration_authority,
        inn, ogrnip, legal_address, email
      ) VALUES ($1, $2, 'individual_entrepreneur', 'Иванов Иван Иванович', 'ИФНС', $3, $4, 'Москва', 'ip@example.ru')
    `,
      [entrepreneur, `${prefix} Шампунь`, entrepreneurInn, digits],
    );
    await queryRunner.query(
      `
      INSERT INTO shop_contact (shop_uuid, type, purpose, value) VALUES
        ($1, 'email', 'support', 'support@example.ru'), ($1, 'email', 'claims', 'claims@example.ru')
    `,
      [books[0]],
    );
    await queryRunner.query(
      `
      INSERT INTO shop_address (shop_uuid, type, address) VALUES
        ($1, 'claims', 'Москва'), ($1, 'returns', 'Санкт-Петербург')
    `,
      [books[0]],
    );
  });

  afterAll(async () => {
    try {
      if (queryRunner?.isTransactionActive) await queryRunner.rollbackTransaction();
    } finally {
      if (queryRunner && !queryRunner.isReleased) await queryRunner.release();
      jest.restoreAllMocks();
      if (dataSource?.isInitialized) await dataSource.destroy();
    }
  });

  it('matches Russian word forms and case across names', async () => {
    const result = await repository.getAll(50, 0, `  ${prefix} КНИГА  `);
    expect(result.total).toBe(2);
    expect(result.items.map((shop) => shop.uuid)).toEqual(books);
  });

  it('finds incomplete words even when the Russian dictionary treats the prefix as a stop word', async () => {
    const uuid = randomUUID();
    await queryRunner.query('INSERT INTO shop (uuid, name) VALUES ($1, $2)', [uuid, `${prefix} Проверка реквизитов`]);
    try {
      const result = await repository.getAll(50, 0, `${prefix} ПРО`);
      expect(result.total).toBe(1);
      expect(result.items.map((shop) => shop.uuid)).toEqual([uuid]);
      expect((await repository.getAll(50, 0, 'про')).items.map((shop) => shop.uuid)).toContain(uuid);
      expect((await repository.getAll(50, 0, `${prefix} рекв`)).items.map((shop) => shop.uuid)).toEqual([uuid]);
      expect((await repository.getAll(50, 0, `${prefix} проверку рекв`)).items.map((shop) => shop.uuid)).toEqual([
        uuid,
      ]);
    } finally {
      await queryRunner.query('DELETE FROM shop WHERE uuid = $1', [uuid]);
    }
  });

  it('matches short Latin prefixes and partial legal identifiers', async () => {
    const uuid = randomUUID();
    await queryRunner.query('INSERT INTO shop (uuid, name) VALUES ($1, $2)', [uuid, `${prefix} Sellgar`]);
    try {
      expect((await repository.getAll(50, 0, `${prefix} Sel`)).items.map((shop) => shop.uuid)).toEqual([uuid]);
      expect((await repository.getAll(50, 0, `${prefix} s`)).items.map((shop) => shop.uuid)).toEqual([uuid]);
      const found = await repository.getAll(50, 0, `${prefix} ${digits.slice(0, 5)}`);
      expect(new Set(found.items.map((shop) => shop.uuid))).toEqual(new Set([organization, entrepreneur]));
    } finally {
      await queryRunner.query('DELETE FROM shop WHERE uuid = $1', [uuid]);
    }
  });

  it('paginates shops without duplicating joined contacts and addresses', async () => {
    const first = await repository.getAll(1, 0, `${prefix} книга`);
    const second = await repository.getAll(1, 1, `${prefix} книга`);
    expect(first.total).toBe(2);
    expect(second.total).toBe(2);
    expect(first.items.map((shop) => shop.uuid)).toEqual([books[0]]);
    expect(second.items.map((shop) => shop.uuid)).toEqual([books[1]]);
    expect(first.items[0].contacts).toHaveLength(2);
    expect(first.items[0].addresses).toHaveLength(2);
  });

  it('keeps contact positions by sortOrder when purpose changes', async () => {
    const contacts = [randomUUID(), randomUUID(), randomUUID()];
    await queryRunner.query(
      `
      INSERT INTO shop_contact (uuid, shop_uuid, type, purpose, value, sort_order) VALUES
        ($1, $4, 'email', 'support', 'z@example.test', 0),
        ($2, $4, 'email', 'receipts', 'm@example.test', 1),
        ($3, $4, 'email', 'claims', 'a@example.test', 2)
    `,
      [...contacts, organization],
    );

    const before = await repository.read(queryRunner.manager, organization);
    expect(before.contacts.map((contact) => contact.uuid)).toEqual(contacts);

    await queryRunner.query("UPDATE shop_contact SET purpose = 'receipts' WHERE uuid = $1", [contacts[0]]);

    const after = await repository.read(queryRunner.manager, organization);
    expect(after.contacts.map((contact) => contact.uuid)).toEqual(contacts);
    expect(after.contacts.map((contact) => contact.sortOrder)).toEqual([0, 1, 2]);
  });

  it('preserves address array order after saving and changing an address type', async () => {
    const writeRepository = new ShopRepository(dataSource, {
      created: jest.fn(),
      updated: jest.fn(),
    } as unknown as ShopOutboxService);
    const addresses = [
      { type: ShopAddressType.RETURNS, address: 'Первый адрес' },
      { type: ShopAddressType.CLAIMS, address: 'Второй адрес' },
      { type: ShopAddressType.PICKUP, address: 'Третий адрес' },
    ];
    let shop: ShopModel | undefined;
    try {
      shop = await writeRepository.create({ name: `Address order ${randomUUID()}`, addresses });
      expect(shop.addresses.map((address) => address.address)).toEqual(addresses.map((address) => address.address));

      const updated = await writeRepository.update({
        uuid: shop.uuid,
        version: shop.version,
        addresses: [{ ...addresses[0], type: ShopAddressType.PICKUP }, addresses[1], addresses[2]],
      });
      const loaded = await writeRepository.getByUuid(updated.uuid);
      expect(updated.addresses.map((address) => address.address)).toEqual(addresses.map((address) => address.address));
      expect(loaded.addresses.map((address) => address.address)).toEqual(addresses.map((address) => address.address));
      expect(loaded.addresses[0].type).toBe(ShopAddressType.PICKUP);
      expect(loaded.addresses.map((address) => address.sortOrder)).toEqual([0, 1, 2]);
    } finally {
      if (shop) await dataSource.manager.delete(ShopModel, { uuid: shop.uuid });
    }
  });

  it('finds organizations and entrepreneurs by their INN independently of OGRN', async () => {
    for (const [uuid, inn] of [
      [organization, organizationInn],
      [entrepreneur, entrepreneurInn],
    ]) {
      for (const term of [inn, inn.slice(0, 5)]) {
        const result = await repository.getAll(50, 0, `${prefix} ${term}`);
        expect(result.total).toBe(1);
        expect(result.items.map((shop) => shop.uuid)).toEqual([uuid]);
      }
    }
  });

  it('searches organization names, entrepreneur names and legal identifiers', async () => {
    const legalName = await repository.getAll(50, 0, `${prefix} северная`);
    const fullName = await repository.getAll(50, 0, `${prefix} Иванов`);
    const inn = await repository.getAll(50, 0, organizationInn);
    const ogrnip = await repository.getAll(50, 0, digits);
    expect(legalName.items.map((shop) => shop.uuid)).toEqual([organization]);
    expect(fullName.items.map((shop) => shop.uuid)).toEqual([entrepreneur]);
    expect(inn.items.map((shop) => shop.uuid)).toEqual([organization]);
    expect(ogrnip.items.map((shop) => shop.uuid)).toEqual([entrepreneur]);
  });

  it('keeps empty searches unfiltered and counts missing matches as zero', async () => {
    const unfiltered = await repository.getAll(50, 0);
    expect(await repository.getAll(50, 0, '  ')).toEqual(unfiltered);
    const missing = await repository.getAll(50, 0, `${prefix} отсутствующий`);
    expect(missing.total).toBe(0);
    expect(missing.items).toEqual([]);
  });

  it('refreshes the indexed search after a shop rename', async () => {
    await queryRunner.query('UPDATE shop SET name = $1 WHERE uuid = $2', [`${prefix} Архив`, books[1]]);
    try {
      expect((await repository.getAll(50, 0, `${prefix} книга`)).total).toBe(1);
      expect((await repository.getAll(50, 0, `${prefix} архив`)).items.map((shop) => shop.uuid)).toEqual([books[1]]);
    } finally {
      await queryRunner.query('UPDATE shop SET name = $1 WHERE uuid = $2', [`${prefix} Книги зелёные`, books[1]]);
    }
  });

  it('treats punctuation and SQL syntax as search input', async () => {
    const result = await repository.getAll(50, 0, `${prefix}' ; DROP TABLE shop; --`);
    expect(result.total).toBe(0);
    expect((await repository.getAll(50, 0, "' :* ! () & | --")).total).toBe(0);
    expect((await repository.getAll(50, 0, prefix)).total).toBe(4);
  });
});
