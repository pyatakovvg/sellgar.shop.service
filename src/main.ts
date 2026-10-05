import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { RpcHttpExceptionFilter } from './common/rpc-http-exception.filter';
import { amqpUrl, requiredEnvironment } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [amqpUrl(process.env)],
      persistent: true,
      queue: requiredEnvironment(process.env, 'AMQP_SHOP_SRV_COMMAND_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  app.enableShutdownHooks();
  await app.listen();
  Logger.log('Shop service started', 'Bootstrap');
}

void bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.name : 'BootstrapError', 'Shop service failed to start');
  process.exitCode = 1;
});
