import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { creditCardWorkflow, CreditCardWorkflowInput, paymentStatusSignal } from './workflows';
import * as activities from './activities';

describe('Temporal Workflows', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  describe('creditCardWorkflow', () => {
    const workflowInput: CreditCardWorkflowInput = {
      paymentId: 'payment-123',
      description: 'Test payment',
      amount: 150.75,
      cpf: '12345678901',
    };

    const mockPreference = {
      id: 'pref-123',
      init_point: 'https://checkout.mercadopago.com/123',
      sandbox_init_point: 'https://sandbox.checkout.mercadopago.com/123',
    };

    let mockActivities: jest.Mocked<typeof activities>;

    beforeEach(() => {
      mockActivities = {
        createMercadoPagoPreference: jest.fn(),
        updatePaymentMercadoPagoData: jest.fn(),
        waitForConfirmation: jest.fn(),
        logPaymentActivity: jest.fn(),
        sendPaymentConfirmation: jest.fn(),
        sendPaymentFailure: jest.fn(),
        getMercadoPagoPaymentStatus: jest.fn(),
        updatePaymentStatus: jest.fn(),
        getPaymentById: jest.fn(),
      } as any;
    });

    it('should complete successfully when payment is confirmed via signal', async () => {
      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreference);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentConfirmation.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-success',
        });

        // Simulate webhook signal
        await handle.signal(paymentStatusSignal, {
          status: 'PAID',
          paymentId: workflowInput.paymentId,
        });

        const result = await handle.result();
        expect(result).toBe('PAID');
      });

      expect(mockActivities.createMercadoPagoPreference).toHaveBeenCalledWith({
        description: workflowInput.description,
        amount: workflowInput.amount,
        external_reference: workflowInput.paymentId,
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
      });

      expect(mockActivities.updatePaymentMercadoPagoData).toHaveBeenCalledWith(
        workflowInput.paymentId,
        mockPreference.id,
        mockPreference.init_point
      );

      expect(mockActivities.logPaymentActivity).toHaveBeenCalledWith(
        workflowInput.paymentId,
        'WORKFLOW_STARTED',
        {
          amount: workflowInput.amount,
          description: workflowInput.description,
        }
      );

      expect(mockActivities.logPaymentActivity).toHaveBeenCalledWith(
        workflowInput.paymentId,
        'PREFERENCE_CREATED',
        {
          preferenceId: mockPreference.id,
          checkoutUrl: mockPreference.init_point,
        }
      );

      expect(mockActivities.logPaymentActivity).toHaveBeenCalledWith(
        workflowInput.paymentId,
        'PAYMENT_SUCCESS'
      );

      expect(mockActivities.sendPaymentConfirmation).toHaveBeenCalledWith(
        workflowInput.paymentId,
        workflowInput.cpf
      );
    });

    it('should handle payment failure via signal', async () => {
      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreference);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentFailure.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-failure',
        });

        // Simulate webhook signal with failure
        await handle.signal(paymentStatusSignal, {
          status: 'FAIL',
          paymentId: workflowInput.paymentId,
        });

        const result = await handle.result();
        expect(result).toBe('FAIL');
      });

      expect(mockActivities.logPaymentActivity).toHaveBeenCalledWith(
        workflowInput.paymentId,
        'PAYMENT_FAILURE'
      );

      expect(mockActivities.sendPaymentFailure).toHaveBeenCalledWith(
        workflowInput.paymentId,
        workflowInput.cpf,
        'Payment not confirmed within timeout'
      );
    });

    it('should fallback to polling when no signal is received', async () => {
      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreference);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.waitForConfirmation.mockResolvedValue('PAID');
      mockActivities.sendPaymentConfirmation.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-polling',
        });

        // Don't send any signal, let it timeout and use polling
        const result = await handle.result();
        expect(result).toBe('PAID');
      });

      expect(mockActivities.waitForConfirmation).toHaveBeenCalledWith(workflowInput.paymentId);
      expect(mockActivities.sendPaymentConfirmation).toHaveBeenCalledWith(
        workflowInput.paymentId,
        workflowInput.cpf
      );
    });

    it('should handle MercadoPago preference creation error', async () => {
      const preferenceError = new Error('MercadoPago API error');
      mockActivities.createMercadoPagoPreference.mockRejectedValue(preferenceError);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentFailure.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-error',
        });

        const result = await handle.result();
        expect(result).toBe('FAIL');
      });

      expect(mockActivities.logPaymentActivity).toHaveBeenCalledWith(
        workflowInput.paymentId,
        'WORKFLOW_ERROR',
        { error: 'MercadoPago API error' }
      );

      expect(mockActivities.sendPaymentFailure).toHaveBeenCalledWith(
        workflowInput.paymentId,
        workflowInput.cpf,
        'Workflow error: MercadoPago API error'
      );
    });

    it('should handle payment update error gracefully', async () => {
      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreference);
      mockActivities.updatePaymentMercadoPagoData.mockRejectedValue(new Error('Database error'));
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentFailure.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-db-error',
        });

        const result = await handle.result();
        expect(result).toBe('FAIL');
      });

      expect(mockActivities.createMercadoPagoPreference).toHaveBeenCalled();
      expect(mockActivities.updatePaymentMercadoPagoData).toHaveBeenCalled();
    });

    it('should use sandbox_init_point when init_point is not available', async () => {
      const mockPreferenceWithSandbox = {
        id: 'pref-123',
        init_point: undefined,
        sandbox_init_point: 'https://sandbox.checkout.mercadopago.com/123',
      };

      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreferenceWithSandbox);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentConfirmation.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-sandbox',
        });

        await handle.signal(paymentStatusSignal, {
          status: 'PAID',
          paymentId: workflowInput.paymentId,
        });

        const result = await handle.result();
        expect(result).toBe('PAID');
      });

      expect(mockActivities.updatePaymentMercadoPagoData).toHaveBeenCalledWith(
        workflowInput.paymentId,
        mockPreferenceWithSandbox.id,
        mockPreferenceWithSandbox.sandbox_init_point
      );
    });

    it('should handle empty checkout URL gracefully', async () => {
      const mockPreferenceEmpty = {
        id: 'pref-123',
        init_point: undefined,
        sandbox_init_point: undefined,
      };

      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreferenceEmpty);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.sendPaymentConfirmation.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-empty-url',
        });

        await handle.signal(paymentStatusSignal, {
          status: 'PAID',
          paymentId: workflowInput.paymentId,
        });

        const result = await handle.result();
        expect(result).toBe('PAID');
      });

      expect(mockActivities.updatePaymentMercadoPagoData).toHaveBeenCalledWith(
        workflowInput.paymentId,
        mockPreferenceEmpty.id,
        ''
      );
    });

    it('should ignore signals for different payment IDs', async () => {
      mockActivities.createMercadoPagoPreference.mockResolvedValue(mockPreference);
      mockActivities.updatePaymentMercadoPagoData.mockResolvedValue(undefined);
      mockActivities.logPaymentActivity.mockResolvedValue(undefined);
      mockActivities.waitForConfirmation.mockResolvedValue('PAID');
      mockActivities.sendPaymentConfirmation.mockResolvedValue(undefined);

      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test-task-queue';

      const worker = await Worker.create({
        connection: nativeConnection,
        taskQueue,
        workflowsPath: require.resolve('./workflows'),
        activities: mockActivities,
      });

      await worker.runUntil(async () => {
        const handle = await client.workflow.start(creditCardWorkflow, {
          args: [workflowInput],
          taskQueue,
          workflowId: 'test-workflow-wrong-signal',
        });

        // Send signal for different payment ID
        await handle.signal(paymentStatusSignal, {
          status: 'PAID',
          paymentId: 'different-payment-id',
        });

        const result = await handle.result();
        expect(result).toBe('PAID');
      });

      // Should use polling since signal was for different payment
      expect(mockActivities.waitForConfirmation).toHaveBeenCalledWith(workflowInput.paymentId);
    });
  });
});
