import { PrismaService } from '../infra/prisma/prisma.service';
export declare class MercadoPagoWebhookController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(signature: string, body: any): Promise<{
        ok: boolean;
    }>;
}
