import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';

import { ShopLegalForm } from '../shop-legal-form.enum';
import { ShopModel } from '../shop.model';

export class ShopLegalDetailsEntity {
  @Expose()
  @IsEnum(ShopLegalForm)
  legalForm: ShopLegalForm;

  @Expose()
  @IsOptional()
  @IsString()
  legalName: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  entrepreneurFullName: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  registrationAuthority: string | null;

  @Expose()
  @IsString()
  @Matches(/^(?:\d{10}|\d{12})$/)
  inn: string;

  @Expose()
  @IsOptional()
  @IsString()
  kpp: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  ogrn: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  ogrnip: string | null;

  @Expose()
  @IsString()
  legalAddress: string;

  @Expose()
  @IsOptional()
  @IsString()
  actualLocation: string | null;

  @Expose()
  @IsOptional()
  @IsEmail()
  email: string | null;

  @Expose()
  @IsOptional()
  @IsPhoneNumber()
  phone: string | null;

  static fromModel(model: ShopModel): ShopLegalDetailsEntity | null {
    if (!model.legalForm || !model.inn || !model.legalAddress) return null;
    return Object.assign(new ShopLegalDetailsEntity(), {
      legalForm: model.legalForm,
      legalName: model.legalName,
      entrepreneurFullName: model.entrepreneurFullName,
      registrationAuthority: model.registrationAuthority,
      inn: model.inn,
      kpp: model.kpp,
      ogrn: model.ogrn,
      ogrnip: model.ogrnip,
      legalAddress: model.legalAddress,
      actualLocation: model.actualLocation,
      email: model.email,
      phone: model.phone,
    });
  }
}
