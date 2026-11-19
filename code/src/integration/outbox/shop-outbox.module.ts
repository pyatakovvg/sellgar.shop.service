import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OutboxModule } from '@sellgar/outbox';

import { amqpUrl, requiredEnvironment } from '../../config/environment';
import { ShopOutboxService } from './shop-outbox.service';

export const SHOP_EVENT_CLIENT = 'SHOP_EVENT_CLIENT';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [{
        name: SHOP_EVENT_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [amqpUrl(process.env)],
            queue: '',
            queueOptions: { durable: false, autoDelete: true },
            persistent: true,
            exchange: requiredEnvironment(process.env, 'AMQP_EVENTS_EXCHANGE'),
            exchangeType: 'topic',
            wildcards: true,
          },
        }),
      }],
    }),
    OutboxModule.forRoot({
      producer: 'shop_srv',
      eventClientToken: SHOP_EVENT_CLIENT,
      publishIntervalMs: Number(process.env.OUTBOX_PUBLISH_INTERVAL_MS ?? '250'),
    }),
  ],
  providers: [ShopOutboxService],
  exports: [ShopOutboxService],
})
export class ShopOutboxModule {}
