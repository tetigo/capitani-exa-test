"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditCardWorkflow = creditCardWorkflow;
const workflow_1 = require("@temporalio/workflow");
const { waitForConfirmation } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '5 minutes',
});
async function creditCardWorkflow(input) {
    return await waitForConfirmation(input.paymentId);
}
//# sourceMappingURL=workflows.js.map