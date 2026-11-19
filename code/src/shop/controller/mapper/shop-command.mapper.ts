import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { CreateShopCommand } from '../../service/command/create-shop.command';
import { UpdateShopCommand } from '../../service/command/update-shop.command';
import { CreateShopDto } from '../dto/create-shop.dto';
import { UpdateShopDto } from '../dto/update-shop.dto';

@Injectable()
export class ShopCommandMapper {
  toCreateCommand(dto: CreateShopDto): Promise<CreateShopCommand> {
    return this.transform(CreateShopCommand, dto);
  }

  toUpdateCommand(dto: UpdateShopDto): Promise<UpdateShopCommand> {
    return this.transform(UpdateShopCommand, dto);
  }

  private async transform<T extends object>(type: new () => T, source: object): Promise<T> {
    const command = plainToInstance(type, source);
    await validateOrReject(command, { whitelist: true, forbidNonWhitelisted: true });
    return command;
  }
}
