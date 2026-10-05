import { IsBoolean, IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { ShopContactPurpose } from '../../shop-contact-purpose.enum';
import { ShopContactType } from '../../shop-contact-type.enum';

export class ShopContactCommand {
  @IsEnum(ShopContactType)
  readonly type: ShopContactType;

  @IsEnum(ShopContactPurpose)
  readonly purpose: ShopContactPurpose;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly value: string;

  @IsBoolean()
  readonly isPublic: boolean;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  readonly sortOrder: number;
}
