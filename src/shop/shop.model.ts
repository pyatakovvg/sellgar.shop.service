import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ShopLegalForm } from './shop-legal-form.enum';
import { ShopAddressModel } from './shop-address.model';
import { ShopContactModel } from './shop-contact.model';

@Entity('shop')
export class ShopModel {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 512 })
  name: string;

  @Column({ name: 'legal_form', type: 'enum', enum: ShopLegalForm, nullable: true })
  legalForm: ShopLegalForm | null;

  @Column({ name: 'legal_name', type: 'varchar', length: 512, nullable: true })
  legalName: string | null;

  @Column({ name: 'entrepreneur_full_name', type: 'varchar', length: 512, nullable: true })
  entrepreneurFullName: string | null;

  @Column({ name: 'registration_authority', type: 'varchar', length: 512, nullable: true })
  registrationAuthority: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 12, nullable: true })
  inn: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  kpp: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 13, nullable: true })
  ogrn: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 15, nullable: true })
  ogrnip: string | null;

  @Column({ name: 'legal_address', type: 'text', nullable: true })
  legalAddress: string | null;

  @Column({ name: 'actual_location', type: 'text', nullable: true })
  actualLocation: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @OneToMany(() => ShopContactModel, (contact) => contact.shop)
  contacts: ShopContactModel[];

  @OneToMany(() => ShopAddressModel, (address) => address.shop)
  addresses: ShopAddressModel[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
