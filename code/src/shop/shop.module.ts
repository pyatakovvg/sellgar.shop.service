import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShopController } from './controller/shop.controller';
import { ShopCommandMapper } from './controller/mapper/shop-command.mapper';
import { ShopRepository } from './repository/shop.repository';
import { ShopService } from './service/shop.service';
import { ShopAddressModel } from './shop-address.model';
import { ShopContactModel } from './shop-contact.model';
import { ShopModel } from './shop.model';

@Module({
  imports: [TypeOrmModule.forFeature([
    ShopModel,
    ShopContactModel,
    ShopAddressModel,
  ])],
  controllers: [ShopController],
  providers: [
    ShopCommandMapper,
    ShopRepository,
    ShopService,
  ],
})
export class ShopModule {}
