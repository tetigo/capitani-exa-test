import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentEntity } from '../../domain/payment/payment.entity';
import { PaymentRepository, PaymentFilters } from '../../domain/payment/payment.repository';

@Injectable()
export class PaymentPrismaRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<PaymentEntity, 'createdAt' | 'updatedAt'>): Promise<PaymentEntity> {
    const created = await this.prisma.payment.create({
      data: {
        id: data.id,
        cpf: data.cpf,
        description: data.description,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status,
      },
    });
    return this.mapToEntity(created);
  }

  async update(id: string, data: Partial<Pick<PaymentEntity, 'status' | 'description' | 'amount'>>): Promise<PaymentEntity> {
    const updated = await this.prisma.payment.update({
      where: { id },
      data,
    });
    return this.mapToEntity(updated);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const found = await this.prisma.payment.findUnique({ where: { id } });
    return found ? this.mapToEntity(found) : null;
  }

  async findMany(filters: PaymentFilters): Promise<PaymentEntity[]> {
    const list = await this.prisma.payment.findMany({
      where: {
        cpf: filters.cpf,
        paymentMethod: filters.paymentMethod,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(this.mapToEntity);
  }

  private mapToEntity = (row: any): PaymentEntity => ({
    id: row.id,
    cpf: row.cpf,
    description: row.description,
    amount: Number(row.amount),
    paymentMethod: row.paymentMethod,
    status: row.status,
    mercadoPagoPreferenceId: row.mercadoPagoPreferenceId,
    checkoutUrl: row.checkoutUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}


