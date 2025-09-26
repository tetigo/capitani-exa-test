export interface CreditCardWorkflowInput {
    paymentId: string;
}
export declare function creditCardWorkflow(input: CreditCardWorkflowInput): Promise<'PAID' | 'FAIL'>;
