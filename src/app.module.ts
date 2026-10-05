import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseOptions } from './database/database.options';
import { ShopOutboxModule } from './integration/outbox/shop-outbox.module';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: () => databaseOptions(process.env) }),
    ShopOutboxModule,
    ShopModule,
  ],
})
export class AppModule {}
