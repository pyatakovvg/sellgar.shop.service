import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { trimString } from '../../../common/trim-string.transformer';
import { ShopContactPurpose } from '../../shop-contact-purpose.enum';
import { ShopContactType } from '../../shop-contact-type.enum';

export class ShopContactDto {
  @IsEnum(ShopContactType)
  type: ShopContactType;

  @IsEnum(ShopContactPurpose)
  purpose: ShopContactPurpose;

  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  value: string;

  @IsBoolean()
  isPublic: boolean;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder: number;
}
