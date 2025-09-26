export declare enum PaymentStatusDto {
    PENDING = "PENDING",
    PAID = "PAID",
    FAIL = "FAIL"
}
export declare class UpdatePaymentDto {
    description?: string;
    amount?: number;
    status?: PaymentStatusDto;
}
