import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { ShopAddressType } from '../shop-address-type.enum';
import { ShopAddressModel } from '../shop-address.model';

export class ShopAddressEntity {
  @Expose()
  @IsUUID()
  uuid: string;

  @Expose()
  @IsEnum(ShopAddressType)
  type: ShopAddressType;

  @Expose()
  @IsString()
  address: string;

  @Expose()
  @IsOptional()
  @IsString()
  comment: string | null;

  static fromModel(model: ShopAddressModel): ShopAddressEntity {
    return Object.assign(new ShopAddressEntity(), {
      uuid: model.uuid,
      type: model.type,
      address: model.address,
      comment: model.comment,
    });
  }
}
