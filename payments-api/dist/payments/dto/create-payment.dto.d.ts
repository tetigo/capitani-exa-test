export declare enum PaymentMethodDto {
    PIX = "PIX",
    CREDIT_CARD = "CREDIT_CARD"
}
export declare class CreatePaymentDto {
    cpf: string;
    description: string;
    amount: number;
    paymentMethod: PaymentMethodDto;
}
