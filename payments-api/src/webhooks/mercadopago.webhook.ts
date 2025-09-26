import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

@Controller({ path: 'webhooks/mercadopago', version: '1' })
export class MercadoPagoWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handle(@Headers('x-signature') signature: string, @Body() body: any) {
    // Simplificado: em produção, validar assinatura (MERCADOPAGO_WEBHOOK_SECRET)
    const externalRef = body?.data?.id || body?.external_reference || body?.resource?.id || body?.id;
    const status: 'PAID' | 'FAIL' = body?.status === 'approved' ? 'PAID' : 'FAIL';
    if (!externalRef) return { ok: true };
    try {
      await this.prisma.payment.update({ where: { id: externalRef }, data: { status } });
    } catch (_) {
      // ignore if not found
    }
    return { ok: true };
  }
}


