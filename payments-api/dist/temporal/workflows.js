"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentStatusSignal = void 0;
exports.creditCardWorkflow = creditCardWorkflow;
const workflow_1 = require("@temporalio/workflow");
exports.paymentStatusSignal = (0, workflow_1.defineSignal)('paymentStatusChanged');
const { createMercadoPagoPreference, updatePaymentMercadoPagoData, waitForConfirmation, logPaymentActivity, sendPaymentConfirmation, sendPaymentFailure, } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '10 minutes',
    heartbeatTimeout: '30 seconds',
});
async function creditCardWorkflow(input) {
    let paymentStatus = null;
    (0, workflow_1.setHandler)(exports.paymentStatusSignal, (signal) => {
        if (signal.paymentId === input.paymentId) {
            paymentStatus = signal.status;
        }
    });
    try {
        await logPaymentActivity(input.paymentId, 'WORKFLOW_STARTED', {
            amount: input.amount,
            description: input.description
        });
        const preference = await createMercadoPagoPreference({
            description: input.description,
            amount: input.amount,
            external_reference: input.paymentId,
            notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
        });
        await updatePaymentMercadoPagoData(input.paymentId, preference.id, preference.init_point || preference.sandbox_init_point || '');
        await logPaymentActivity(input.paymentId, 'PREFERENCE_CREATED', {
            preferenceId: preference.id,
            checkoutUrl: preference.init_point || preference.sandbox_init_point
        });
        const result = await Promise.race([
            (0, workflow_1.condition)(() => paymentStatus !== null, '8 minutes').then(() => paymentStatus),
            waitForConfirmation(input.paymentId),
        ]);
        if (result === 'PAID') {
            await logPaymentActivity(input.paymentId, 'PAYMENT_SUCCESS');
            await sendPaymentConfirmation(input.paymentId, input.cpf);
        }
        else {
            await logPaymentActivity(input.paymentId, 'PAYMENT_FAILURE');
            await sendPaymentFailure(input.paymentId, input.cpf, 'Payment not confirmed within timeout');
        }
        return result;
    }
    catch (error) {
        await logPaymentActivity(input.paymentId, 'WORKFLOW_ERROR', { error: String(error) });
        await sendPaymentFailure(input.paymentId, input.cpf, `Workflow error: ${String(error)}`);
        return 'FAIL';
    }
}
//# sourceMappingURL=workflows.js.map