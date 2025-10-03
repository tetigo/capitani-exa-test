import { PrismaService } from '../infra/prisma/prisma.service';
import { TemporalClientService } from '../temporal/temporalClient.service';
export declare class MercadoPagoWebhookController {
    private readonly prisma;
    private readonly temporal;
    constructor(prisma: PrismaService, temporal: TemporalClientService);
    handle(signature: string, body: any): Promise<{
        ok: boolean;
    }>;
}
