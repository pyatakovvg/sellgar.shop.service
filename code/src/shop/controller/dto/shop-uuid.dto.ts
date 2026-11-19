import { IsUUID } from 'class-validator';

export class ShopUuidDto {
  @IsUUID()
  uuid: string;
}
