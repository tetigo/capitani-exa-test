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
exports.PaymentPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentPrismaRepository = class PaymentPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const created = await this.prisma.payment.create({
            data: {
                id: data.id,
                cpf: data.cpf,
                description: data.description,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                status: data.status,
            },
        });
        return this.mapToEntity(created);
    }
    async update(id, data) {
        const updated = await this.prisma.payment.update({
            where: { id },
            data,
        });
        return this.mapToEntity(updated);
    }
    async findById(id) {
        const found = await this.prisma.payment.findUnique({ where: { id } });
        return found ? this.mapToEntity(found) : null;
    }
    async findMany(filters) {
        const list = await this.prisma.payment.findMany({
            where: {
                cpf: filters.cpf,
                paymentMethod: filters.paymentMethod,
                status: filters.status,
            },
            orderBy: { createdAt: 'desc' },
        });
        return list.map(this.mapToEntity);
    }
    mapToEntity = (row) => ({
        id: row.id,
        cpf: row.cpf,
        description: row.description,
        amount: Number(row.amount),
        paymentMethod: row.paymentMethod,
        status: row.status,
        mercadoPagoPreferenceId: row.mercadoPagoPreferenceId,
        checkoutUrl: row.checkoutUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    });
};
exports.PaymentPrismaRepository = PaymentPrismaRepository;
exports.PaymentPrismaRepository = PaymentPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentPrismaRepository);
//# sourceMappingURL=payment.prisma.repository.js.map