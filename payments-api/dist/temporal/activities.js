"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForConfirmation = waitForConfirmation;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function waitForConfirmation(paymentId) {
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (payment?.status === 'PAID')
            return 'PAID';
        if (payment?.status === 'FAIL')
            return 'FAIL';
        await new Promise((r) => setTimeout(r, 3000));
    }
    return 'FAIL';
}
//# sourceMappingURL=activities.js.map