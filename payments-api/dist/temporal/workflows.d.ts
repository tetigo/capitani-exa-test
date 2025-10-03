export interface CreditCardWorkflowInput {
    paymentId: string;
    description: string;
    amount: number;
    cpf: string;
}
export interface PaymentStatusSignal {
    status: 'PAID' | 'FAIL';
    paymentId: string;
}
export declare const paymentStatusSignal: import("@temporalio/workflow").SignalDefinition<[PaymentStatusSignal], string>;
export declare function creditCardWorkflow(input: CreditCardWorkflowInput): Promise<'PAID' | 'FAIL'>;
