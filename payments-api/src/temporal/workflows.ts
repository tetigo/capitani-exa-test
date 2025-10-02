import { proxyActivities, defineSignal, setHandler, condition } from '@temporalio/workflow';

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

// Definir signals
export const paymentStatusSignal = defineSignal<[PaymentStatusSignal]>('paymentStatusChanged');

// Proxy das atividades
const {
  createMercadoPagoPreference,
  updatePaymentMercadoPagoData,
  waitForConfirmation,
  logPaymentActivity,
  sendPaymentConfirmation,
  sendPaymentFailure,
} = proxyActivities<{
  createMercadoPagoPreference(input: any): Promise<any>;
  updatePaymentMercadoPagoData(paymentId: string, preferenceId: string, checkoutUrl: string): Promise<void>;
  waitForConfirmation(paymentId: string): Promise<'PAID' | 'FAIL'>;
  logPaymentActivity(paymentId: string, activity: string, details?: any): Promise<void>;
  sendPaymentConfirmation(paymentId: string, cpf: string): Promise<void>;
  sendPaymentFailure(paymentId: string, cpf: string, reason?: string): Promise<void>;
}>({
  startToCloseTimeout: '10 minutes',
  heartbeatTimeout: '30 seconds',
});

export async function creditCardWorkflow(input: CreditCardWorkflowInput): Promise<'PAID' | 'FAIL'> {
  let paymentStatus: 'PAID' | 'FAIL' | null = null;

  // Configurar handler para o signal
  setHandler(paymentStatusSignal, (signal: PaymentStatusSignal) => {
    if (signal.paymentId === input.paymentId) {
      paymentStatus = signal.status;
    }
  });

  try {
    // Log início do workflow
    await logPaymentActivity(input.paymentId, 'WORKFLOW_STARTED', { 
      amount: input.amount, 
      description: input.description 
    });

    // 1. Criar preference no MercadoPago
    const preference = await createMercadoPagoPreference({
      description: input.description,
      amount: input.amount,
      external_reference: input.paymentId,
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
    });

    // 2. Atualizar payment com dados da preference
    await updatePaymentMercadoPagoData(
      input.paymentId,
      preference.id,
      preference.init_point || preference.sandbox_init_point || ''
    );

    await logPaymentActivity(input.paymentId, 'PREFERENCE_CREATED', { 
      preferenceId: preference.id,
      checkoutUrl: preference.init_point || preference.sandbox_init_point 
    });

    // 3. Aguardar confirmação via signal OU polling como fallback
    const result = await Promise.race([
      // Opção 1: Aguardar signal (mais eficiente)
      condition(() => paymentStatus !== null, '8 minutes').then(() => paymentStatus!),
      
      // Opção 2: Fallback para polling (caso webhook falhe)
      waitForConfirmation(input.paymentId),
    ]);

    // 4. Processar resultado e enviar notificações
    if (result === 'PAID') {
      await logPaymentActivity(input.paymentId, 'PAYMENT_SUCCESS');
      await sendPaymentConfirmation(input.paymentId, input.cpf);
    } else {
      await logPaymentActivity(input.paymentId, 'PAYMENT_FAILURE');
      await sendPaymentFailure(input.paymentId, input.cpf, 'Payment not confirmed within timeout');
    }

    return result;

  } catch (error) {
    await logPaymentActivity(input.paymentId, 'WORKFLOW_ERROR', { error: String(error) });
    await sendPaymentFailure(input.paymentId, input.cpf, `Workflow error: ${String(error)}`);
    return 'FAIL';
  }
}


