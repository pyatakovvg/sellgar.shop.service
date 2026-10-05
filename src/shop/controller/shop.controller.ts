import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ShopService } from '../service/shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { GetAllShopsDto } from './dto/get-all-shops.dto';
import { ShopUuidDto } from './dto/shop-uuid.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopCommandMapper } from './mapper/shop-command.mapper';

@Controller()
export class ShopController {
  constructor(
    private readonly service: ShopService,
    private readonly commandMapper: ShopCommandMapper,
  ) {}

  @MessagePattern({ cmd: 'shop.getAll' })
  getAll(@Payload() dto: GetAllShopsDto) {
    return this.service.getAll(dto.limit, dto.offset);
  }

  @MessagePattern({ cmd: 'shop.getByUuid' })
  getByUuid(@Payload() dto: ShopUuidDto) {
    return this.service.getByUuid(dto.uuid);
  }

  @MessagePattern({ cmd: 'shop.create' })
  async create(@Payload() dto: CreateShopDto) {
    return this.service.create(await this.commandMapper.toCreateCommand(dto));
  }

  @MessagePattern({ cmd: 'shop.update' })
  async update(@Payload() dto: UpdateShopDto) {
    return this.service.update(await this.commandMapper.toUpdateCommand(dto));
  }
}
