import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { ShopModel } from '../shop.model';
import { ShopAddressEntity } from './shop-address.entity';
import { ShopContactEntity } from './shop-contact.entity';
import { ShopLegalDetailsEntity } from './shop-legal-details.entity';

export class ShopEntity {
  @Expose()
  @IsUUID()
  uuid: string;

  @Expose()
  @IsInt()
  @Min(1)
  version: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ShopLegalDetailsEntity)
  legalDetails: ShopLegalDetailsEntity | null;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopContactEntity)
  contacts: ShopContactEntity[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopAddressEntity)
  addresses: ShopAddressEntity[];

  @Expose()
  @IsDate()
  createdAt: Date;

  @Expose()
  @IsDate()
  updatedAt: Date;

  static fromModel(model: ShopModel): ShopEntity {
    return Object.assign(new ShopEntity(), {
      uuid: model.uuid,
      version: model.version,
      name: model.name,
      legalDetails: ShopLegalDetailsEntity.fromModel(model),
      contacts: (model.contacts ?? []).map(ShopContactEntity.fromModel),
      addresses: (model.addresses ?? []).map(ShopAddressEntity.fromModel),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
