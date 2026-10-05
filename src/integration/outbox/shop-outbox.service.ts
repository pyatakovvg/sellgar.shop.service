import { Injectable } from '@nestjs/common';
import { OutboxWriter } from '@sellgar/outbox';
import { instanceToPlain } from 'class-transformer';
import { EntityManager } from 'typeorm';

import { ShopEntity } from '../../shop/entity/shop.entity';
import { ShopModel } from '../../shop/shop.model';

@Injectable()
export class ShopOutboxService {
  constructor(private readonly writer: OutboxWriter) {}

  created(manager: EntityManager, shop: ShopModel): Promise<void> {
    return this.write(manager, 'shop.created', shop);
  }

  updated(manager: EntityManager, shop: ShopModel): Promise<void> {
    return this.write(manager, 'shop.updated', shop);
  }

  private write(manager: EntityManager, eventType: 'shop.created' | 'shop.updated', shop: ShopModel): Promise<void> {
    return this.writer.add(manager, {
      eventType,
      aggregateType: 'shop',
      aggregateId: shop.uuid,
      aggregateVersion: shop.version,
      schemaVersion: 3,
      payload: instanceToPlain(ShopEntity.fromModel(shop)) as Record<string, unknown>,
    });
  }
}
