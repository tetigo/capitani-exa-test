import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { TemporalModule } from './temporal/temporal.module';
import { MercadoPagoWebhookController } from './webhooks/mercadopago.webhook';
import { PrismaService } from './infra/prisma/prisma.service';
import { TemporalClientService } from './temporal/temporalClient.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentsModule,
    TemporalModule,
  ],
  controllers: [AppController, MercadoPagoWebhookController],
  providers: [AppService, PrismaService, TemporalClientService],
})
export class AppModule {}
