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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let MercadoPagoClient = class MercadoPagoClient {
    http;
    constructor() {
        const baseURL = 'https://api.mercadopago.com';
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
        this.http = axios_1.default.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
    }
    async createPreference(input) {
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
        const { data } = await this.http.post('/checkout/preferences', body);
        return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point };
    }
};
exports.MercadoPagoClient = MercadoPagoClient;
exports.MercadoPagoClient = MercadoPagoClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MercadoPagoClient);
//# sourceMappingURL=mercadopago.client.js.map