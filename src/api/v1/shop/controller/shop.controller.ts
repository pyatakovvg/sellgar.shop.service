import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CreateDto } from '../repository/dto/create.dto';
import { UpdateDto } from '../repository/dto/update.dto';
import { ShopService } from '../service/shop.service';

@Controller()
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @MessagePattern({ cmd: 'shop.getAll' })
  findAll() {
    return this.shopService.findAll();
  }

  @MessagePattern({ cmd: 'shop.getByUuid' })
  findByUuid(@Payload('uuid') uuid: string) {
    return this.shopService.findByUuid(uuid);
  }

  @MessagePattern({ cmd: 'shop.create' })
  create(@Payload() dto: CreateDto) {
    return this.shopService.create(dto);
  }

  @MessagePattern({ cmd: 'shop.update' })
  update(@Payload() dto: UpdateDto) {
    return this.shopService.update(dto);
  }
}
