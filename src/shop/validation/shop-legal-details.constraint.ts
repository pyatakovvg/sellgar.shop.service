import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { ShopLegalForm } from '../shop-legal-form.enum';

@ValidatorConstraint({ name: 'shopLegalDetails', async: false })
export class ShopLegalDetailsConstraint implements ValidatorConstraintInterface {
  validate(form: ShopLegalForm, { object }: ValidationArguments): boolean {
    const details = object as Record<string, unknown>;
    if (!this.hasText(details.email) && !this.hasText(details.phone)) return false;

    switch (form) {
      case ShopLegalForm.LEGAL_ENTITY:
        return this.hasText(details.legalName)
          && this.hasText(details.kpp)
          && this.hasText(details.ogrn)
          && typeof details.inn === 'string' && details.inn.length === 10
          && details.entrepreneurFullName == null
          && details.ogrnip == null
          && details.registrationAuthority == null;
      case ShopLegalForm.INDIVIDUAL_ENTREPRENEUR:
        return this.hasText(details.entrepreneurFullName)
          && this.hasText(details.ogrnip)
          && this.hasText(details.registrationAuthority)
          && typeof details.inn === 'string' && details.inn.length === 12
          && details.legalName == null
          && details.kpp == null
          && details.ogrn == null;
      default:
        return false;
    }
  }

  defaultMessage({ value }: ValidationArguments): string {
    if (value === ShopLegalForm.LEGAL_ENTITY) {
      return 'Организация: укажите наименование, ИНН из 10 цифр, КПП, ОГРН и email или телефон; реквизиты ИП недопустимы';
    }
    return 'ИП: укажите ФИО, ИНН из 12 цифр, ОГРНИП, регистрирующий орган и email или телефон; наименование организации, КПП и ОГРН недопустимы';
  }

  private hasText(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
