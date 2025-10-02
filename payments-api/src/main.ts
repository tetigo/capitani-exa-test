import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for webhooks and frontend integration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] // Replace with your production domain
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature'],
    credentials: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📋 Swagger docs: http://localhost:${port}/api`);
  console.log(`🔗 MercadoPago webhook: http://localhost:${port}/v1/webhooks/mercadopago`);
}
bootstrap();
