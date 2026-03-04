import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.TRUST_PROXY === 'true') {
    const instance = app.getHttpAdapter().getInstance();
    if (instance?.set) {
      instance.set('trust proxy', 1);
    }
  }

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT || 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend listening on port ${port}`);
}

bootstrap();
