import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ShopLegalDetailsDto } from '../controller/dto/shop-legal-details.dto';
import { ShopLegalDetailsCommand } from '../service/command/shop-legal-details.command';
import { ShopLegalForm } from '../shop-legal-form.enum';

const organization = {
  legalForm: ShopLegalForm.LEGAL_ENTITY,
  legalName: 'ООО Пример',
  inn: '7700000001',
  kpp: '770001001',
  ogrn: '1027700000001',
  legalAddress: 'Москва',
  email: 'shop@example.ru',
};

const entrepreneur = {
  legalForm: ShopLegalForm.INDIVIDUAL_ENTREPRENEUR,
  entrepreneurFullName: 'Иванов Иван Иванович',
  inn: '770000000001',
  ogrnip: '304770000000001',
  registrationAuthority: 'Межрайонная ИФНС России № 46 по г. Москве',
  legalAddress: 'Москва',
  phone: '+79991234567',
};

describe.each([ShopLegalDetailsDto, ShopLegalDetailsCommand])('%s legal details', (Type) => {
  const errors = (details: object) => validate(plainToInstance(Type, details));

  it.each([organization, entrepreneur])('accepts complete details for $legalForm', async (details) => {
    expect(await errors(details)).toEqual([]);
  });

  it.each(['legalName', 'inn', 'kpp', 'ogrn', 'legalAddress', 'email'])('rejects an organization without %s', async (field) => {
    expect(await errors({ ...organization, [field]: null })).not.toEqual([]);
  });

  it.each(['entrepreneurFullName', 'inn', 'ogrnip', 'registrationAuthority', 'legalAddress', 'phone'])('rejects an entrepreneur without %s', async (field) => {
    expect(await errors({ ...entrepreneur, [field]: null })).not.toEqual([]);
  });

  it.each(['legalName', 'kpp', 'ogrn'] as const)('rejects the organization field %s for an entrepreneur', async (field) => {
    expect(await errors({ ...entrepreneur, [field]: organization[field] })).not.toEqual([]);
  });

  it.each(['entrepreneurFullName', 'ogrnip', 'registrationAuthority'] as const)('rejects the entrepreneur field %s for an organization', async (field) => {
    expect(await errors({ ...organization, [field]: entrepreneur[field] })).not.toEqual([]);
  });

  it.each(['12345678901', '123456789012', 'abcdefghij'])('rejects incorrect organization INN %s', async (inn) => {
    expect(await errors({ ...organization, inn })).not.toEqual([]);
  });

  it('rejects a ten-digit INN for an entrepreneur', async () => {
    expect(await errors({ ...entrepreneur, inn: organization.inn })).not.toEqual([]);
  });
});
