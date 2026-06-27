import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShopController } from './controller/shop.controller';
import { ShopRepository } from './repository/shop.repository';
import { ShopService } from './service/shop.service';
import { ShopModel } from './shop.model';

@Module({
  imports: [TypeOrmModule.forFeature([ShopModel])],
  controllers: [ShopController],
  providers: [ShopRepository, ShopService],
})
export class ShopModule {}
