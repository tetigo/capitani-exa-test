import { PaymentPrismaRepository } from '../infra/payment/payment.prisma.repository';
import { PaymentEntity } from '../domain/payment/payment.entity';
import { CreatePaymentDto, PaymentMethodDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MercadoPagoClient } from '../infra/mercadopago/mercadopago.client';
import { TemporalClientService } from '../temporal/temporalClient.service';
export declare class PaymentsService {
    private readonly repo;
    private readonly mp;
    private readonly temporal;
    constructor(repo: PaymentPrismaRepository, mp: MercadoPagoClient, temporal: TemporalClientService);
    create(input: CreatePaymentDto): Promise<PaymentEntity>;
    update(id: string, input: UpdatePaymentDto): Promise<PaymentEntity>;
    findById(id: string): Promise<PaymentEntity>;
    findMany(query: {
        cpf?: string;
        paymentMethod?: PaymentMethodDto;
    }): Promise<PaymentEntity[]>;
}
