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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const payment_prisma_repository_1 = require("../infra/payment/payment.prisma.repository");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const crypto_1 = require("crypto");
const mercadopago_client_1 = require("../infra/mercadopago/mercadopago.client");
const temporalClient_service_1 = require("../temporal/temporalClient.service");
const workflows_1 = require("../temporal/workflows");
let PaymentsService = class PaymentsService {
    repo;
    mp;
    temporal;
    constructor(repo, mp, temporal) {
        this.repo = repo;
        this.mp = mp;
        this.temporal = temporal;
    }
    async create(input) {
        const entity = {
            id: (0, crypto_1.randomUUID)(),
            cpf: input.cpf,
            description: input.description,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            status: 'PENDING',
        };
        const created = await this.repo.create(entity);
        if (input.paymentMethod === create_payment_dto_1.PaymentMethodDto.CREDIT_CARD) {
            await this.mp.createPreference({
                description: input.description,
                amount: input.amount,
                external_reference: created.id,
                notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
            });
            const client = await this.temporal.getClient();
            const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'payments-task-queue';
            await client.workflow.start(workflows_1.creditCardWorkflow, {
                taskQueue,
                workflowId: `cc-${created.id}`,
                args: [{ paymentId: created.id }],
            });
        }
        return created;
    }
    async update(id, input) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException('Payment not found');
        return this.repo.update(id, input);
    }
    async findById(id) {
        const payment = await this.repo.findById(id);
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async findMany(query) {
        return this.repo.findMany({
            cpf: query.cpf,
            paymentMethod: query.paymentMethod,
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_prisma_repository_1.PaymentPrismaRepository,
        mercadopago_client_1.MercadoPagoClient,
        temporalClient_service_1.TemporalClientService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map