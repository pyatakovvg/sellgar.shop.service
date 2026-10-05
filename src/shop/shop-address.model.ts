import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ShopAddressType } from './shop-address-type.enum';
import { ShopModel } from './shop.model';

@Entity('shop_address')
export class ShopAddressModel {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'shop_uuid', type: 'uuid' })
  shopUuid: string;

  @ManyToOne(() => ShopModel, (shop) => shop.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_uuid' })
  shop: ShopModel;

  @Column({ type: 'enum', enum: ShopAddressType })
  type: ShopAddressType;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
