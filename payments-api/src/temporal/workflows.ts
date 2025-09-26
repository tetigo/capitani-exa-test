import { proxyActivities } from '@temporalio/workflow';

export interface CreditCardWorkflowInput {
  paymentId: string;
}

const { waitForConfirmation } = proxyActivities<{ waitForConfirmation(paymentId: string): Promise<'PAID' | 'FAIL'> }>({
  startToCloseTimeout: '5 minutes',
});

export async function creditCardWorkflow(input: CreditCardWorkflowInput): Promise<'PAID' | 'FAIL'> {
  return await waitForConfirmation(input.paymentId);
}


