import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../infra/prisma/prisma.service';
import { PaymentPrismaRepository } from '../infra/payment/payment.prisma.repository';
import { MercadoPagoClient } from '../infra/mercadopago/mercadopago.client';
import { TemporalModule } from '../temporal/temporal.module';

@Module({
  imports: [TemporalModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, PaymentPrismaRepository, MercadoPagoClient],
})
export class PaymentsModule {}


