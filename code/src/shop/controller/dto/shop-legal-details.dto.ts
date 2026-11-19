import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength, Validate } from 'class-validator';

import { trimString } from '../../../common/trim-string.transformer';
import { ShopLegalForm } from '../../shop-legal-form.enum';
import { ShopLegalDetailsConstraint } from '../../validation/shop-legal-details.constraint';

export class ShopLegalDetailsDto {
  @IsEnum(ShopLegalForm)
  @Validate(ShopLegalDetailsConstraint)
  legalForm: ShopLegalForm;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  legalName?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  entrepreneurFullName?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  registrationAuthority?: string | null;

  @IsString()
  @Matches(/^(?:\d{10}|\d{12})$/)
  inn: string;

  @IsOptional()
  @IsString()
  @Length(9, 9)
  @Matches(/^\d+$/)
  kpp?: string | null;

  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d+$/)
  ogrn?: string | null;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^\d+$/)
  ogrnip?: string | null;

  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  legalAddress: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2048)
  actualLocation?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsPhoneNumber()
  phone?: string | null;
}
