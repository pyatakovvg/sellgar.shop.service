import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ShopContactPurpose } from './shop-contact-purpose.enum';
import { ShopContactType } from './shop-contact-type.enum';
import { ShopModel } from './shop.model';

@Entity('shop_contact')
export class ShopContactModel {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'shop_uuid', type: 'uuid' })
  shopUuid: string;

  @ManyToOne(() => ShopModel, (shop) => shop.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_uuid' })
  shop: ShopModel;

  @Column({ type: 'enum', enum: ShopContactType })
  type: ShopContactType;

  @Column({ type: 'enum', enum: ShopContactPurpose })
  purpose: ShopContactPurpose;

  @Column({ type: 'varchar', length: 512 })
  value: string;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;
}
