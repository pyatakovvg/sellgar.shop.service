import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { ShopAddressType } from '../../shop-address-type.enum';

export class ShopAddressCommand {
  @IsEnum(ShopAddressType)
  readonly type: ShopAddressType;

  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  readonly address: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly comment?: string | null;
}
