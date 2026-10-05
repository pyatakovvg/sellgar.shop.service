import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { trimString } from '../../../common/trim-string.transformer';
import { ShopAddressDto } from './shop-address.dto';
import { ShopContactDto } from './shop-contact.dto';
import { ShopLegalDetailsDto } from './shop-legal-details.dto';

export class CreateShopDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopLegalDetailsDto)
  legalDetails?: ShopLegalDetailsDto | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopContactDto)
  contacts?: ShopContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopAddressDto)
  addresses?: ShopAddressDto[];

}
