import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ShopAddressCommand } from './shop-address.command';
import { ShopContactCommand } from './shop-contact.command';
import { ShopLegalDetailsCommand } from './shop-legal-details.command';

export class CreateShopCommand {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopLegalDetailsCommand)
  readonly legalDetails?: ShopLegalDetailsCommand | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopContactCommand)
  readonly contacts?: ShopContactCommand[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopAddressCommand)
  readonly addresses?: ShopAddressCommand[];

}
