import { PaymentEntity, PaymentStatus, PaymentMethod } from './payment.entity';

export interface PaymentFilters {
  cpf?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
}

export interface PaymentRepository {
  create(data: Omit<PaymentEntity, 'createdAt' | 'updatedAt'>): Promise<PaymentEntity>;
  update(id: string, data: Partial<Pick<PaymentEntity, 'status' | 'description' | 'amount'>>): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findMany(filters: PaymentFilters): Promise<PaymentEntity[]>;
}


