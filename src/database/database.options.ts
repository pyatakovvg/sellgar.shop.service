import { join } from 'node:path';
import { OutboxEventModel } from '@sellgar/outbox';
import { DataSourceOptions } from 'typeorm';

import { parsePort, requiredEnvironment } from '../config/environment';
import { ShopAddressModel } from '../shop/shop-address.model';
import { ShopContactModel } from '../shop/shop-contact.model';
import { ShopModel } from '../shop/shop.model';

export function databaseOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: requiredEnvironment(env, 'DATABASE_HOST'),
    port: parsePort(env.DATABASE_PORT ?? '5432', 'DATABASE_PORT'),
    username: requiredEnvironment(env, 'DATABASE_USERNAME'),
    password: requiredEnvironment(env, 'DATABASE_PASSWORD'),
    database: requiredEnvironment(env, 'DATABASE_DATABASE_NAME'),
    entities: [
      ShopModel,
      ShopContactModel,
      ShopAddressModel,
      OutboxEventModel,
    ],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: false,
  };
}
