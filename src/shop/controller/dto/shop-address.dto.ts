import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { trimString } from '../../../common/trim-string.transformer';
import { ShopAddressType } from '../../shop-address-type.enum';

export class ShopAddressDto {
  @IsEnum(ShopAddressType)
  type: ShopAddressType;

  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  address: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2048)
  comment?: string | null;
}
