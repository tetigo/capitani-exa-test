import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentPrismaRepository } from '../infra/payment/payment.prisma.repository';
import { PaymentEntity } from '../domain/payment/payment.entity';
import { CreatePaymentDto, PaymentMethodDto } from './dto/create-payment.dto';
import { UpdatePaymentDto, PaymentStatusDto } from './dto/update-payment.dto';
import { randomUUID } from 'crypto';
import { MercadoPagoClient } from '../infra/mercadopago/mercadopago.client';
import { TemporalClientService } from '../temporal/temporalClient.service';
import { creditCardWorkflow } from '../temporal/workflows';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentPrismaRepository,
    private readonly mp: MercadoPagoClient,
    private readonly temporal: TemporalClientService,
  ) {}

  async create(input: CreatePaymentDto): Promise<PaymentEntity> {
    const entity: Omit<PaymentEntity, 'createdAt' | 'updatedAt'> = {
      id: randomUUID(),
      cpf: input.cpf,
      description: input.description,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      status: 'PENDING',
    } as any;
    const created = await this.repo.create(entity);

    if (input.paymentMethod === PaymentMethodDto.CREDIT_CARD) {
      await this.mp.createPreference({
        description: input.description,
        amount: input.amount,
        external_reference: created.id,
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
      });
      // Start Temporal workflow to await durable confirmation
      const client = await this.temporal.getClient();
      const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'payments-task-queue';
      await client.workflow.start(creditCardWorkflow, {
        taskQueue,
        workflowId: `cc-${created.id}`,
        args: [{ paymentId: created.id }],
      });
    }

    return created;
  }

  async update(id: string, input: UpdatePaymentDto): Promise<PaymentEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Payment not found');
    return this.repo.update(id, input as any);
  }

  async findById(id: string): Promise<PaymentEntity> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findMany(query: { cpf?: string; paymentMethod?: PaymentMethodDto }): Promise<PaymentEntity[]> {
    return this.repo.findMany({
      cpf: query.cpf,
      paymentMethod: query.paymentMethod as any,
    });
  }
}


