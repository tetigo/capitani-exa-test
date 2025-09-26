"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoWebhookController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../infra/prisma/prisma.service");
let MercadoPagoWebhookController = class MercadoPagoWebhookController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(signature, body) {
        const externalRef = body?.data?.id || body?.external_reference || body?.resource?.id || body?.id;
        const status = body?.status === 'approved' ? 'PAID' : 'FAIL';
        if (!externalRef)
            return { ok: true };
        try {
            await this.prisma.payment.update({ where: { id: externalRef }, data: { status } });
        }
        catch (_) {
        }
        return { ok: true };
    }
};
exports.MercadoPagoWebhookController = MercadoPagoWebhookController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Headers)('x-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MercadoPagoWebhookController.prototype, "handle", null);
exports.MercadoPagoWebhookController = MercadoPagoWebhookController = __decorate([
    (0, common_1.Controller)({ path: 'webhooks/mercadopago', version: '1' }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MercadoPagoWebhookController);
//# sourceMappingURL=mercadopago.webhook.js.map