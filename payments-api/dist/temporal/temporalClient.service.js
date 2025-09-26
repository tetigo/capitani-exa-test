"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalClientService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@temporalio/client");
let TemporalClientService = class TemporalClientService {
    clientPromise = null;
    async getClient() {
        if (!this.clientPromise) {
            this.clientPromise = (async () => {
                const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
                const namespace = process.env.TEMPORAL_NAMESPACE ?? 'default';
                const connection = await client_1.Connection.connect({ address });
                return new client_1.Client({ connection, namespace });
            })();
        }
        return this.clientPromise;
    }
};
exports.TemporalClientService = TemporalClientService;
exports.TemporalClientService = TemporalClientService = __decorate([
    (0, common_1.Injectable)()
], TemporalClientService);
//# sourceMappingURL=temporalClient.service.js.map