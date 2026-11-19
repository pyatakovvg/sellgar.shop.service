import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { RpcHttpExceptionFilter } from './common/rpc-http-exception.filter';
import { amqpUrl, parsePort, requiredEnvironment } from './config/environment';
import { HealthService } from './api/health/health.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new RpcHttpExceptionFilter());

  const consumer = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [amqpUrl(process.env)],
        persistent: true,
        queue: requiredEnvironment(process.env, 'AMQP_SHOP_SRV_COMMAND_QUEUE'),
        queueOptions: {
          durable: true,
        },
      },
    },
    { inheritAppConfig: true },
  );

  const health = app.get(HealthService);
  consumer.status.subscribe((status) => {
    health.setBrokerConnected(status === 'connected' || status === 'unblocked');
  });

  app.enableShutdownHooks();
  await app.init();
  await app.startAllMicroservices();
  await app.listen(parsePort(process.env.PORT ?? '8080', 'PORT'));
  Logger.log('Shop service started', 'Bootstrap');
}

void bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.name : 'BootstrapError', 'Shop service failed to start');
  process.exitCode = 1;
});
