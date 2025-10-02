import { Test, TestingModule } from '@nestjs/testing';
import { MercadoPagoWebhookController } from './mercadopago.webhook';
import { PrismaService } from '../infra/prisma/prisma.service';
import { TemporalClientService } from '../temporal/temporalClient.service';

describe('MercadoPagoWebhookController', () => {
  let controller: MercadoPagoWebhookController;
  let prismaService: jest.Mocked<PrismaService>;
  let temporalService: jest.Mocked<TemporalClientService>;

  const mockWorkflowHandle = {
    signal: jest.fn(),
  };

  const mockTemporalClient = {
    workflow: {
      getHandle: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MercadoPagoWebhookController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            payment: {
              update: jest.fn().mockResolvedValue({}),
            },
          },
        },
        {
          provide: TemporalClientService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MercadoPagoWebhookController>(MercadoPagoWebhookController);
    prismaService = module.get(PrismaService);
    temporalService = module.get(TemporalClientService);
  });

  describe('handle', () => {
    const mockSignature = 'test-signature';

    it('should handle approved payment webhook successfully', async () => {
      const webhookBody = {
        external_reference: 'payment-123',
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });

      expect(temporalService.getClient).toHaveBeenCalled();
      expect(mockTemporalClient.workflow.getHandle).toHaveBeenCalledWith('cc-payment-123');
      expect(mockWorkflowHandle.signal).toHaveBeenCalledWith('paymentStatusChanged', {
        status: 'PAID',
        paymentId: 'payment-123',
      });

      expect(result).toEqual({ ok: true });
    });

    it('should handle rejected payment webhook successfully', async () => {
      const webhookBody = {
        external_reference: 'payment-123',
        status: 'rejected',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          status: 'FAIL',
          updatedAt: expect.any(Date),
        },
      });

      expect(mockWorkflowHandle.signal).toHaveBeenCalledWith('paymentStatusChanged', {
        status: 'FAIL',
        paymentId: 'payment-123',
      });

      expect(result).toEqual({ ok: true });
    });

    it('should handle webhook with data.id structure', async () => {
      const webhookBody = {
        data: { id: 'payment-456' },
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-456' },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual({ ok: true });
    });

    it('should handle webhook with resource.id structure', async () => {
      const webhookBody = {
        resource: { id: 'payment-789' },
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-789' },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual({ ok: true });
    });

    it('should return ok when no external reference found', async () => {
      const webhookBody = {
        status: 'approved',
      };

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).not.toHaveBeenCalled();
      expect(temporalService.getClient).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should handle database update error gracefully', async () => {
      const webhookBody = {
        external_reference: 'payment-123',
        status: 'approved',
      };

      prismaService.payment.update = jest.fn().mockRejectedValue(new Error('Payment not found'));
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalled();
      // Should still try to send temporal signal even if DB update fails
      expect(temporalService.getClient).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should handle temporal signal error gracefully', async () => {
      const webhookBody = {
        external_reference: 'payment-123',
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockRejectedValue(new Error('Temporal connection failed'));

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalled();
      expect(temporalService.getClient).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should handle workflow signal error gracefully', async () => {
      const webhookBody = {
        external_reference: 'payment-123',
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockRejectedValue(new Error('Workflow not found'));

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalled();
      expect(mockWorkflowHandle.signal).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('should handle complex webhook payload structure', async () => {
      const webhookBody = {
        id: 'webhook-id',
        live_mode: true,
        type: 'payment',
        date_created: '2025-01-02T10:00:00Z',
        application_id: 'app-123',
        user_id: 'user-456',
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'payment-complex-123',
        },
        status: 'approved',
      };

      // Mock already configured in beforeEach
      temporalService.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalClient.workflow.getHandle.mockReturnValue(mockWorkflowHandle);
      mockWorkflowHandle.signal.mockResolvedValue(undefined);

      const result = await controller.handle(mockSignature, webhookBody);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-complex-123' },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual({ ok: true });
    });
  });
});
