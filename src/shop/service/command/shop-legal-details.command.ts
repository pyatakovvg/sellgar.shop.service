import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength, Validate } from 'class-validator';

import { ShopLegalForm } from '../../shop-legal-form.enum';
import { ShopLegalDetailsConstraint } from '../../validation/shop-legal-details.constraint';

export class ShopLegalDetailsCommand {
  @IsEnum(ShopLegalForm)
  @Validate(ShopLegalDetailsConstraint)
  readonly legalForm: ShopLegalForm;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly legalName?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly entrepreneurFullName?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  readonly registrationAuthority?: string | null;

  @IsString()
  @Matches(/^(?:\d{10}|\d{12})$/)
  readonly inn: string;

  @IsOptional()
  @IsString()
  @Length(9, 9)
  @Matches(/^\d+$/)
  readonly kpp?: string | null;

  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d+$/)
  readonly ogrn?: string | null;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^\d+$/)
  readonly ogrnip?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  readonly legalAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  readonly actualLocation?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  readonly email?: string | null;

  @IsOptional()
  @IsPhoneNumber()
  readonly phone?: string | null;
}
