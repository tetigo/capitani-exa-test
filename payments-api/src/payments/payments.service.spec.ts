import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentPrismaRepository } from '../infra/payment/payment.prisma.repository';
import { MercadoPagoClient } from '../infra/mercadopago/mercadopago.client';
import { TemporalClientService } from '../temporal/temporalClient.service';
import { CreatePaymentDto, PaymentMethodDto } from './dto/create-payment.dto';
import { UpdatePaymentDto, PaymentStatusDto } from './dto/update-payment.dto';
import { PaymentEntity } from '../domain/payment/payment.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: jest.Mocked<PaymentPrismaRepository>;
  let mercadoPagoClient: jest.Mocked<MercadoPagoClient>;
  let temporalClient: jest.Mocked<TemporalClientService>;

  const mockPayment: PaymentEntity = {
    id: 'test-id',
    cpf: '12345678901',
    description: 'Test payment',
    amount: 100.50,
    paymentMethod: 'CREDIT_CARD',
    status: 'PENDING',
    mercadoPagoPreferenceId: undefined,
    checkoutUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemporalWorkflowClient = {
    start: jest.fn(),
  };

  const mockTemporalClient = {
    workflow: mockTemporalWorkflowClient,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentPrismaRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
          },
        },
        {
          provide: MercadoPagoClient,
          useValue: {
            createPreference: jest.fn(),
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

    service = module.get<PaymentsService>(PaymentsService);
    repository = module.get(PaymentPrismaRepository);
    mercadoPagoClient = module.get(MercadoPagoClient);
    temporalClient = module.get(TemporalClientService);
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      cpf: '12345678901',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: PaymentMethodDto.CREDIT_CARD,
    };

    it('should create a PIX payment successfully', async () => {
      const pixDto = { ...createPaymentDto, paymentMethod: PaymentMethodDto.PIX };
      repository.create.mockResolvedValue(mockPayment);

      const result = await service.create(pixDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: pixDto.cpf,
          description: pixDto.description,
          amount: pixDto.amount,
          paymentMethod: pixDto.paymentMethod,
          status: 'PENDING',
        })
      );
      expect(result).toEqual(mockPayment);
      expect(temporalClient.getClient).not.toHaveBeenCalled();
    });

    it('should create a credit card payment and start temporal workflow', async () => {
      repository.create.mockResolvedValue(mockPayment);
      temporalClient.getClient.mockResolvedValue(mockTemporalClient as any);
      mockTemporalWorkflowClient.start.mockResolvedValue(undefined);

      const result = await service.create(createPaymentDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: createPaymentDto.cpf,
          description: createPaymentDto.description,
          amount: createPaymentDto.amount,
          paymentMethod: createPaymentDto.paymentMethod,
          status: 'PENDING',
        })
      );
      expect(temporalClient.getClient).toHaveBeenCalled();
      expect(mockTemporalWorkflowClient.start).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          taskQueue: 'payments-task-queue',
          workflowId: `cc-${mockPayment.id}`,
          args: [{
            paymentId: mockPayment.id,
            description: createPaymentDto.description,
            amount: createPaymentDto.amount,
            cpf: createPaymentDto.cpf,
          }],
        })
      );
      expect(result).toEqual(mockPayment);
    });

    it('should handle temporal workflow start error gracefully', async () => {
      repository.create.mockResolvedValue(mockPayment);
      temporalClient.getClient.mockRejectedValue(new Error('Temporal connection failed'));

      await expect(service.create(createPaymentDto)).rejects.toThrow('Temporal connection failed');
    });
  });

  describe('update', () => {
    const updateDto: UpdatePaymentDto = {
      status: PaymentStatusDto.PAID,
    };

    it('should update payment successfully', async () => {
      const updatedPayment = { ...mockPayment, status: 'PAID' as const };
      repository.findById.mockResolvedValue(mockPayment);
      repository.update.mockResolvedValue(updatedPayment);

      const result = await service.update('test-id', updateDto);

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(repository.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(result).toEqual(updatedPayment);
    });

    it('should throw NotFoundException when payment not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return payment when found', async () => {
      repository.findById.mockResolvedValue(mockPayment);

      const result = await service.findById('test-id');

      expect(repository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException when payment not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return payments with filters', async () => {
      const payments = [mockPayment];
      repository.findMany.mockResolvedValue(payments);

      const result = await service.findMany({ 
        cpf: '12345678901', 
        paymentMethod: PaymentMethodDto.CREDIT_CARD 
      });

      expect(repository.findMany).toHaveBeenCalledWith({
        cpf: '12345678901',
        paymentMethod: 'CREDIT_CARD',
      });
      expect(result).toEqual(payments);
    });

    it('should return all payments when no filters provided', async () => {
      const payments = [mockPayment];
      repository.findMany.mockResolvedValue(payments);

      const result = await service.findMany({});

      expect(repository.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual(payments);
    });
  });
});
