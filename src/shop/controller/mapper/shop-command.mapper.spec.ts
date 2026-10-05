import 'reflect-metadata';

import { ShopLegalForm } from '../../shop-legal-form.enum';
import { CreateShopDto } from '../dto/create-shop.dto';
import { ShopCommandMapper } from './shop-command.mapper';

describe(ShopCommandMapper.name, () => {
  const mapper = new ShopCommandMapper();

  it('creates and validates nested command objects', async () => {
    const command = await mapper.toCreateCommand(Object.assign(new CreateShopDto(), {
      name: 'Example shop',
      legalDetails: {
        legalForm: ShopLegalForm.LEGAL_ENTITY,
        legalName: 'ООО Пример',
        inn: '7700000001',
        kpp: '770001001',
        ogrn: '1027700000001',
        legalAddress: 'Москва',
        email: 'shop@example.ru',
      },
    }));

    expect(command.legalDetails).toMatchObject({ inn: '7700000001', legalName: 'ООО Пример' });
  });

  it('rejects invalid nested legal details', async () => {
    await expect(mapper.toCreateCommand(Object.assign(new CreateShopDto(), {
      name: 'Example shop',
      legalDetails: {
        legalForm: ShopLegalForm.LEGAL_ENTITY,
        legalName: 'ООО Пример',
        inn: 'not-an-inn',
        ogrn: '1027700000001',
        legalAddress: 'Москва',
        email: 'shop@example.ru',
      },
    }))).rejects.toBeDefined();
  });
});
