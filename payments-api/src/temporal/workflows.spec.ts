// Mock do Temporal para testes unitários simples
jest.mock('@temporalio/workflow', () => ({
  proxyActivities: jest.fn(() => ({
    createMercadoPagoPreference: jest.fn(),
    updatePaymentMercadoPagoData: jest.fn(),
    waitForConfirmation: jest.fn(),
    logPaymentActivity: jest.fn(),
    sendPaymentConfirmation: jest.fn(),
    sendPaymentFailure: jest.fn(),
  })),
  defineSignal: jest.fn(() => 'paymentStatusChanged'),
  setHandler: jest.fn(),
  condition: jest.fn(),
}));

import { CreditCardWorkflowInput } from './workflows';

describe('Temporal Workflows', () => {
  describe('creditCardWorkflow', () => {
    it('should be defined and importable', () => {
      // Teste simples para verificar se o workflow pode ser importado
      const { creditCardWorkflow } = require('./workflows');
      expect(creditCardWorkflow).toBeDefined();
      expect(typeof creditCardWorkflow).toBe('function');
    });

    it('should have correct input interface', () => {
      const workflowInput: CreditCardWorkflowInput = {
        paymentId: 'payment-123',
        description: 'Test payment',
        amount: 150.75,
        cpf: '12345678901',
      };

      expect(workflowInput.paymentId).toBe('payment-123');
      expect(workflowInput.description).toBe('Test payment');
      expect(workflowInput.amount).toBe(150.75);
      expect(workflowInput.cpf).toBe('12345678901');
    });

    it('should have paymentStatusSignal defined', () => {
      const { paymentStatusSignal } = require('./workflows');
      expect(paymentStatusSignal).toBeDefined();
    });
  });
});