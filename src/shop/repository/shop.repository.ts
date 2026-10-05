import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmail, isPhoneNumber } from 'class-validator';
import { DataSource, EntityManager, FindOptionsRelations, QueryFailedError } from 'typeorm';

import { ShopOutboxService } from '../../integration/outbox/shop-outbox.service';
import { ShopAddressModel } from '../shop-address.model';
import { ShopContactType } from '../shop-contact-type.enum';
import { ShopContactModel } from '../shop-contact.model';
import { ShopModel } from '../shop.model';
import { CreateShopCommand } from '../service/command/create-shop.command';
import { ShopAddressCommand } from '../service/command/shop-address.command';
import { ShopContactCommand } from '../service/command/shop-contact.command';
import { ShopLegalDetailsCommand } from '../service/command/shop-legal-details.command';
import { UpdateShopCommand } from '../service/command/update-shop.command';

const shopRelations: FindOptionsRelations<ShopModel> = {
  contacts: true,
  addresses: true,
};

@Injectable()
export class ShopRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly outbox: ShopOutboxService,
  ) {}

  async getAll(limit: number, offset: number) {
    const [items, total] = await this.dataSource.getRepository(ShopModel).findAndCount({
      relations: shopRelations,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total, limit, offset };
  }

  getByUuid(uuid: string): Promise<ShopModel> {
    return this.read(this.dataSource.manager, uuid);
  }

  async create(command: CreateShopCommand): Promise<ShopModel> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const shop = manager.create(ShopModel, {
          name: command.name,
          version: 1,
        });
        this.applyLegalDetails(shop, command.legalDetails ?? null);
        const saved = await manager.save(ShopModel, shop);
        await this.replaceOwnedRecords(manager, saved.uuid, command);
        const created = await this.read(manager, saved.uuid);
        await this.outbox.created(manager, created);
        return created;
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(command: UpdateShopCommand): Promise<ShopModel> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const shop = await this.lock(manager, command.uuid, command.version);
        shop.name = command.name ?? shop.name;
        if (command.legalDetails !== undefined) this.applyLegalDetails(shop, command.legalDetails);
        shop.version += 1;
        await manager.save(ShopModel, shop);
        await this.replaceOwnedRecords(manager, shop.uuid, command);

        const updated = await this.read(manager, shop.uuid);
        await this.outbox.updated(manager, updated);
        return updated;
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async read(manager: EntityManager, uuid: string): Promise<ShopModel> {
    const shop = await manager.findOne(ShopModel, {
      where: { uuid },
      relations: shopRelations,
      order: {
        contacts: { purpose: 'ASC', sortOrder: 'ASC', value: 'ASC' },
        addresses: { type: 'ASC' },
      },
    });
    if (!shop) throw new NotFoundException(`Shop ${uuid} not found`);
    return shop;
  }

  private applyLegalDetails(shop: ShopModel, details: ShopLegalDetailsCommand | null): void {
    shop.legalForm = details?.legalForm ?? null;
    shop.legalName = details?.legalName ?? null;
    shop.entrepreneurFullName = details?.entrepreneurFullName ?? null;
    shop.registrationAuthority = details?.registrationAuthority ?? null;
    shop.inn = details?.inn ?? null;
    shop.kpp = details?.kpp ?? null;
    shop.ogrn = details?.ogrn ?? null;
    shop.ogrnip = details?.ogrnip ?? null;
    shop.legalAddress = details?.legalAddress ?? null;
    shop.actualLocation = details?.actualLocation ?? null;
    shop.email = details?.email ?? null;
    shop.phone = details?.phone ?? null;
  }

  private async replaceOwnedRecords(
    manager: EntityManager,
    shopUuid: string,
    command: CreateShopCommand | UpdateShopCommand,
  ): Promise<void> {
    if (command.contacts !== undefined) await this.replaceContacts(manager, shopUuid, command.contacts);
    if (command.addresses !== undefined) await this.replaceAddresses(manager, shopUuid, command.addresses);
  }

  private async replaceContacts(manager: EntityManager, shopUuid: string, contacts: ShopContactCommand[]): Promise<void> {
    for (const contact of contacts) {
      const valid = contact.type === ShopContactType.EMAIL ? isEmail(contact.value) : isPhoneNumber(contact.value);
      if (!valid) throw new BadRequestException(`Invalid ${contact.type} contact value`);
    }
    await manager.delete(ShopContactModel, { shopUuid });
    if (contacts.length > 0) await manager.insert(ShopContactModel, contacts.map((contact) => ({ shopUuid, ...contact })));
  }

  private async replaceAddresses(manager: EntityManager, shopUuid: string, addresses: ShopAddressCommand[]): Promise<void> {
    await manager.delete(ShopAddressModel, { shopUuid });
    if (addresses.length > 0) {
      await manager.insert(ShopAddressModel, addresses.map((address) => ({
        shopUuid,
        type: address.type,
        address: address.address,
        comment: address.comment ?? null,
      })));
    }
  }

  private async lock(manager: EntityManager, uuid: string, version: number): Promise<ShopModel> {
    const shop = await manager.findOne(ShopModel, { where: { uuid }, lock: { mode: 'pessimistic_write' } });
    if (!shop) throw new NotFoundException(`Shop ${uuid} not found`);
    if (shop.version !== version) throw new ConflictException(`Shop ${uuid} was changed by another request`);
    return shop;
  }

  private mapWriteError(error: unknown): Error {
    if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
      return new ConflictException('Shop name or legal identifiers are already in use');
    }
    return error instanceof Error ? error : new Error('Unknown shop persistence error');
  }
}
