export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAIL';
export interface PaymentProps {
    id: string;
    cpf: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    mercadoPagoPreferenceId?: string;
    checkoutUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PaymentEntity implements PaymentProps {
    id: string;
    cpf: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    mercadoPagoPreferenceId?: string;
    checkoutUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(props: PaymentProps);
}
