"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMercadoPagoPreference = createMercadoPagoPreference;
exports.getMercadoPagoPaymentStatus = getMercadoPagoPaymentStatus;
exports.updatePaymentStatus = updatePaymentStatus;
exports.getPaymentById = getPaymentById;
exports.updatePaymentMercadoPagoData = updatePaymentMercadoPagoData;
exports.logPaymentActivity = logPaymentActivity;
exports.sendPaymentConfirmation = sendPaymentConfirmation;
exports.sendPaymentFailure = sendPaymentFailure;
exports.waitForConfirmation = waitForConfirmation;
const prisma_1 = require("../../generated/prisma");
const axios_1 = __importDefault(require("axios"));
const prisma = new prisma_1.PrismaClient();
async function createMercadoPagoPreference(input) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
    try {
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
        const response = await axios_1.default.post('https://api.mercadopago.com/checkout/preferences', body, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        return {
            id: response.data.id,
            init_point: response.data.init_point,
            sandbox_init_point: response.data.sandbox_init_point,
        };
    }
    catch (error) {
        console.error('Error creating MercadoPago preference:', error);
        return {
            id: `mock_preference_${input.external_reference}`,
            init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
        };
    }
}
async function getMercadoPagoPaymentStatus(preferenceId) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
    try {
        const response = await axios_1.default.get(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            timeout: 10000,
        });
        const status = response.data.status;
        if (status === 'approved')
            return 'PAID';
        if (status === 'rejected' || status === 'cancelled')
            return 'FAIL';
        return 'PENDING';
    }
    catch (error) {
        console.error('Error getting MercadoPago payment status:', error);
        return 'FAIL';
    }
}
async function updatePaymentStatus(paymentId, status) {
    try {
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status,
                updatedAt: new Date(),
            },
        });
        console.log(`Payment ${paymentId} status updated to ${status}`);
    }
    catch (error) {
        console.error(`Error updating payment ${paymentId} status:`, error);
        throw error;
    }
}
async function getPaymentById(paymentId) {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });
        return payment;
    }
    catch (error) {
        console.error(`Error getting payment ${paymentId}:`, error);
        throw error;
    }
}
async function updatePaymentMercadoPagoData(paymentId, preferenceId, checkoutUrl) {
    try {
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                mercadoPagoPreferenceId: preferenceId,
                checkoutUrl: checkoutUrl,
                updatedAt: new Date(),
            },
        });
        console.log(`Payment ${paymentId} MercadoPago data updated with preference ${preferenceId} and URL ${checkoutUrl}`);
    }
    catch (error) {
        console.error(`Error updating payment ${paymentId} MercadoPago data:`, error);
        throw error;
    }
}
async function logPaymentActivity(paymentId, activity, details) {
    console.log(`[PAYMENT-${paymentId}] ${activity}`, details || '');
}
async function sendPaymentConfirmation(paymentId, cpf) {
    console.log(`Sending payment confirmation for payment ${paymentId} to CPF ${cpf}`);
}
async function sendPaymentFailure(paymentId, cpf, reason) {
    console.log(`Sending payment failure notification for payment ${paymentId} to CPF ${cpf}. Reason: ${reason || 'Unknown'}`);
}
async function waitForConfirmation(paymentId) {
    const deadline = Date.now() + 10 * 60 * 1000;
    let attempts = 0;
    const maxAttempts = 120;
    while (Date.now() < deadline && attempts < maxAttempts) {
        try {
            const payment = await getPaymentById(paymentId);
            if (!payment) {
                await logPaymentActivity(paymentId, 'PAYMENT_NOT_FOUND');
                return 'FAIL';
            }
            if (payment.status === 'PAID') {
                await logPaymentActivity(paymentId, 'PAYMENT_CONFIRMED');
                return 'PAID';
            }
            if (payment.status === 'FAIL') {
                await logPaymentActivity(paymentId, 'PAYMENT_FAILED');
                return 'FAIL';
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
        }
        catch (error) {
            console.error(`Error checking payment ${paymentId} status:`, error);
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
    await logPaymentActivity(paymentId, 'PAYMENT_TIMEOUT');
    return 'FAIL';
}
//# sourceMappingURL=activities.js.map