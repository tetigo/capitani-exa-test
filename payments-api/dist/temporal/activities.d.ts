import { PaymentStatus } from '../../generated/prisma';
export interface CreateMercadoPagoPreferenceInput {
    description: string;
    amount: number;
    external_reference: string;
    notification_url?: string;
}
export interface MercadoPagoPreferenceResult {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
}
export declare function createMercadoPagoPreference(input: CreateMercadoPagoPreferenceInput): Promise<MercadoPagoPreferenceResult>;
export declare function getMercadoPagoPaymentStatus(preferenceId: string): Promise<'PAID' | 'FAIL' | 'PENDING'>;
export declare function updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void>;
export declare function getPaymentById(paymentId: string): Promise<{
    createdAt: Date;
    updatedAt: Date;
    id: string;
    cpf: string;
    description: string;
    amount: import("generated/prisma/runtime/library").Decimal;
    paymentMethod: import("../../generated/prisma").$Enums.PaymentMethod;
    status: import("../../generated/prisma").$Enums.PaymentStatus;
    mercadoPagoPreferenceId: string | null;
    checkoutUrl: string | null;
} | null>;
export declare function updatePaymentMercadoPagoData(paymentId: string, preferenceId: string, checkoutUrl: string): Promise<void>;
export declare function logPaymentActivity(paymentId: string, activity: string, details?: any): Promise<void>;
export declare function sendPaymentConfirmation(paymentId: string, cpf: string): Promise<void>;
export declare function sendPaymentFailure(paymentId: string, cpf: string, reason?: string): Promise<void>;
export declare function waitForConfirmation(paymentId: string): Promise<'PAID' | 'FAIL'>;
