import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { TemporalClientService } from '../temporal/temporalClient.service';
import { paymentStatusSignal } from '../temporal/workflows';

@Controller({ path: 'webhooks/mercadopago', version: '1' })
export class MercadoPagoWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly temporal: TemporalClientService,
  ) {}

  @Post()
  async handle(@Headers('x-signature') signature: string, @Body() body: any) {
    // Simplificado: em produção, validar assinatura (MERCADOPAGO_WEBHOOK_SECRET)
    console.log('MercadoPago webhook received:', JSON.stringify(body, null, 2));
    
    const externalRef = body?.data?.id || body?.external_reference || body?.resource?.id || body?.id;
    const status: 'PAID' | 'FAIL' = body?.status === 'approved' ? 'PAID' : 'FAIL';
    
    if (!externalRef) {
      console.log('No external reference found in webhook');
      return { ok: true };
    }

    try {
      // 1. Atualizar status no banco de dados
      await this.prisma.payment.update({ 
        where: { id: externalRef }, 
        data: { 
          status,
          updatedAt: new Date(),
        } 
      });

      console.log(`Payment ${externalRef} status updated to ${status}`);

      // 2. Enviar signal para o workflow do Temporal
      try {
        const client = await this.temporal.getClient();
        const workflowId = `cc-${externalRef}`;
        
        const handle = client.workflow.getHandle(workflowId);
        await handle.signal('paymentStatusChanged', { 
          status, 
          paymentId: externalRef 
        });

        console.log(`Signal sent to workflow ${workflowId} with status ${status}`);
      } catch (temporalError) {
        console.error(`Error sending signal to Temporal workflow ${externalRef}:`, temporalError);
        // Não falhar o webhook se o Temporal estiver indisponível
        // O workflow tem fallback para polling
      }

    } catch (dbError) {
      console.error(`Error updating payment ${externalRef}:`, dbError);
      // Ignore if payment not found - pode ser um webhook duplicado ou inválido
    }

    return { ok: true };
  }
}


