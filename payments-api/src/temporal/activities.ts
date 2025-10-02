import { PrismaClient, PaymentStatus } from '../../generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();

// ============= ATIVIDADES DE MERCADOPAGO =============

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

export async function createMercadoPagoPreference(
  input: CreateMercadoPagoPreferenceInput
): Promise<MercadoPagoPreferenceResult> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
  
  try {
    const body = {
      items: [
        {
          title: input.description,
          quantity: 1,
          unit_price: input.amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: input.external_reference,
      notification_url: input.notification_url,
    };

    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return {
      id: response.data.id,
      init_point: response.data.init_point,
      sandbox_init_point: response.data.sandbox_init_point,
    };
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    // Return mock data for testing
    return {
      id: `mock_preference_${input.external_reference}`,
      init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
    };
  }
}

export async function getMercadoPagoPaymentStatus(preferenceId: string): Promise<'PAID' | 'FAIL' | 'PENDING'> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
  
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/checkout/preferences/${preferenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      }
    );

    // Esta é uma simplificação - na prática você consultaria os payments associados
    const status = response.data.status;
    if (status === 'approved') return 'PAID';
    if (status === 'rejected' || status === 'cancelled') return 'FAIL';
    return 'PENDING';
  } catch (error) {
    console.error('Error getting MercadoPago payment status:', error);
    return 'FAIL';
  }
}

// ============= ATIVIDADES DE PAGAMENTO =============

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status,
        updatedAt: new Date(),
      },
    });
    console.log(`Payment ${paymentId} status updated to ${status}`);
  } catch (error) {
    console.error(`Error updating payment ${paymentId} status:`, error);
    throw error;
  }
}

export async function getPaymentById(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    return payment;
  } catch (error) {
    console.error(`Error getting payment ${paymentId}:`, error);
    throw error;
  }
}

export async function updatePaymentMercadoPagoData(
  paymentId: string,
  preferenceId: string,
  checkoutUrl: string
): Promise<void> {
  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        mercadoPagoPreferenceId: preferenceId,
        checkoutUrl: checkoutUrl,
        updatedAt: new Date(),
      },
    });
    console.log(`Payment ${paymentId} MercadoPago data updated with preference ${preferenceId} and URL ${checkoutUrl}`);
  } catch (error) {
    console.error(`Error updating payment ${paymentId} MercadoPago data:`, error);
    throw error;
  }
}

// ============= ATIVIDADES DE AUDITORIA =============

export async function logPaymentActivity(
  paymentId: string,
  activity: string,
  details?: any
): Promise<void> {
  console.log(`[PAYMENT-${paymentId}] ${activity}`, details || '');
  // Aqui você poderia salvar em uma tabela de auditoria se necessário
}

// ============= ATIVIDADES DE NOTIFICAÇÃO =============

export async function sendPaymentConfirmation(paymentId: string, cpf: string): Promise<void> {
  // Implementar envio de email/SMS de confirmação
  console.log(`Sending payment confirmation for payment ${paymentId} to CPF ${cpf}`);
  // Aqui você integraria com serviços de email/SMS
}

export async function sendPaymentFailure(paymentId: string, cpf: string, reason?: string): Promise<void> {
  // Implementar envio de notificação de falha
  console.log(`Sending payment failure notification for payment ${paymentId} to CPF ${cpf}. Reason: ${reason || 'Unknown'}`);
  // Aqui você integraria com serviços de email/SMS
}

// ============= ATIVIDADE PRINCIPAL DE CONFIRMAÇÃO =============

export async function waitForConfirmation(paymentId: string): Promise<'PAID' | 'FAIL'> {
  // Melhorada: menos polling, mais eficiente
  const deadline = Date.now() + 10 * 60 * 1000; // 10 minutos
  let attempts = 0;
  const maxAttempts = 120; // 120 tentativas = 10 minutos com intervalo de 5s
  
  while (Date.now() < deadline && attempts < maxAttempts) {
    try {
      const payment = await getPaymentById(paymentId);
      
      if (!payment) {
        await logPaymentActivity(paymentId, 'PAYMENT_NOT_FOUND');
        return 'FAIL';
      }

      if (payment.status === 'PAID') {
        await logPaymentActivity(paymentId, 'PAYMENT_CONFIRMED');
        return 'PAID';
      }
      
      if (payment.status === 'FAIL') {
        await logPaymentActivity(paymentId, 'PAYMENT_FAILED');
        return 'FAIL';
      }

      // Aguarda 5 segundos antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
      
    } catch (error) {
      console.error(`Error checking payment ${paymentId} status:`, error);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Timeout - considerar como falha
  await logPaymentActivity(paymentId, 'PAYMENT_TIMEOUT');
  return 'FAIL';
}


