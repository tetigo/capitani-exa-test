"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEntity = void 0;
class PaymentEntity {
    id;
    cpf;
    description;
    amount;
    paymentMethod;
    status;
    mercadoPagoPreferenceId;
    checkoutUrl;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.cpf = props.cpf;
        this.description = props.description;
        this.amount = props.amount;
        this.paymentMethod = props.paymentMethod;
        this.status = props.status;
        this.mercadoPagoPreferenceId = props.mercadoPagoPreferenceId;
        this.checkoutUrl = props.checkoutUrl;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
exports.PaymentEntity = PaymentEntity;
//# sourceMappingURL=payment.entity.js.map