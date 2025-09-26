import { PrismaService } from '../prisma/prisma.service';
import { PaymentEntity } from '../../domain/payment/payment.entity';
import { PaymentRepository, PaymentFilters } from '../../domain/payment/payment.repository';
export declare class PaymentPrismaRepository implements PaymentRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Omit<PaymentEntity, 'createdAt' | 'updatedAt'>): Promise<PaymentEntity>;
    update(id: string, data: Partial<Pick<PaymentEntity, 'status' | 'description' | 'amount'>>): Promise<PaymentEntity>;
    findById(id: string): Promise<PaymentEntity | null>;
    findMany(filters: PaymentFilters): Promise<PaymentEntity[]>;
    private mapToEntity;
}
