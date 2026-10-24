import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { APP_CONFIG, AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const config = app.get<AppConfig>(APP_CONFIG);
  configureApp(app, config);
  app.enableShutdownHooks();
  await app.listen(config.apiPort);
}

void bootstrap();
