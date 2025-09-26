import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
export declare class PaymentsController {
    private readonly service;
    constructor(service: PaymentsService);
    create(body: CreatePaymentDto): Promise<import("../domain/payment/payment.entity").PaymentEntity>;
    update(id: string, body: UpdatePaymentDto): Promise<import("../domain/payment/payment.entity").PaymentEntity>;
    findById(id: string): Promise<import("../domain/payment/payment.entity").PaymentEntity>;
    findMany(cpf?: string, paymentMethod?: string): Promise<import("../domain/payment/payment.entity").PaymentEntity[]>;
}
