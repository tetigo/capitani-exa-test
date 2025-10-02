import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPrismaRepository } from './payment.prisma.repository';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentEntity } from '../../domain/payment/payment.entity';

describe('PaymentPrismaRepository', () => {
  let repository: PaymentPrismaRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaPayment = {
    id: 'test-id',
    cpf: '12345678901',
    description: 'Test payment',
    amount: 100.50,
    paymentMethod: 'CREDIT_CARD',
    status: 'PENDING',
    mercadoPagoPreferenceId: 'pref-123',
    checkoutUrl: 'https://checkout.url',
    createdAt: new Date('2025-01-02T10:00:00Z'),
    updatedAt: new Date('2025-01-02T10:00:00Z'),
  };

  const mockPaymentEntity: PaymentEntity = {
    id: 'test-id',
    cpf: '12345678901',
    description: 'Test payment',
    amount: 100.50,
    paymentMethod: 'CREDIT_CARD',
    status: 'PENDING',
    mercadoPagoPreferenceId: 'pref-123',
    checkoutUrl: 'https://checkout.url',
    createdAt: new Date('2025-01-02T10:00:00Z'),
    updatedAt: new Date('2025-01-02T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentPrismaRepository,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PaymentPrismaRepository>(PaymentPrismaRepository);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    const createData: Omit<PaymentEntity, 'createdAt' | 'updatedAt'> = {
      id: 'test-id',
      cpf: '12345678901',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: 'CREDIT_CARD',
      status: 'PENDING',
      mercadoPagoPreferenceId: null,
      checkoutUrl: null,
    };

    it('should create a payment successfully', async () => {
      prismaService.payment.create.mockResolvedValue(mockPrismaPayment as any);

      const result = await repository.create(createData);

      expect(prismaService.payment.create).toHaveBeenCalledWith({
        data: {
          id: createData.id,
          cpf: createData.cpf,
          description: createData.description,
          amount: createData.amount,
          paymentMethod: createData.paymentMethod,
          status: createData.status,
        },
      });

      expect(result).toEqual(mockPaymentEntity);
    });

    it('should handle create errors', async () => {
      const error = new Error('Database error');
      prismaService.payment.create.mockRejectedValue(error);

      await expect(repository.create(createData)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updateData = {
      status: 'PAID' as const,
      description: 'Updated description',
    };

    it('should update a payment successfully', async () => {
      const updatedPrismaPayment = { ...mockPrismaPayment, ...updateData };
      const expectedEntity = { ...mockPaymentEntity, ...updateData };

      prismaService.payment.update.mockResolvedValue(updatedPrismaPayment as any);

      const result = await repository.update('test-id', updateData);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateData,
      });

      expect(result).toEqual(expectedEntity);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { status: 'FAIL' as const };
      const updatedPrismaPayment = { ...mockPrismaPayment, status: 'FAIL' };
      const expectedEntity = { ...mockPaymentEntity, status: 'FAIL' as const };

      prismaService.payment.update.mockResolvedValue(updatedPrismaPayment as any);

      const result = await repository.update('test-id', partialUpdate);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: partialUpdate,
      });

      expect(result).toEqual(expectedEntity);
    });

    it('should handle update errors', async () => {
      const error = new Error('Payment not found');
      prismaService.payment.update.mockRejectedValue(error);

      await expect(repository.update('test-id', updateData)).rejects.toThrow('Payment not found');
    });
  });

  describe('findById', () => {
    it('should return a payment when found', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPrismaPayment as any);

      const result = await repository.findById('test-id');

      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });

      expect(result).toEqual(mockPaymentEntity);
    });

    it('should return null when payment not found', async () => {
      prismaService.payment.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });

    it('should handle findById errors', async () => {
      const error = new Error('Database error');
      prismaService.payment.findUnique.mockRejectedValue(error);

      await expect(repository.findById('test-id')).rejects.toThrow('Database error');
    });
  });

  describe('findMany', () => {
    const mockPayments = [mockPrismaPayment, { ...mockPrismaPayment, id: 'test-id-2' }];
    const expectedEntities = [mockPaymentEntity, { ...mockPaymentEntity, id: 'test-id-2' }];

    it('should return payments without filters', async () => {
      prismaService.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await repository.findMany({});

      expect(prismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          cpf: undefined,
          paymentMethod: undefined,
          status: undefined,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(expectedEntities);
    });

    it('should return payments with CPF filter', async () => {
      prismaService.payment.findMany.mockResolvedValue([mockPrismaPayment] as any);

      const result = await repository.findMany({ cpf: '12345678901' });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          cpf: '12345678901',
          paymentMethod: undefined,
          status: undefined,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([mockPaymentEntity]);
    });

    it('should return payments with payment method filter', async () => {
      prismaService.payment.findMany.mockResolvedValue([mockPrismaPayment] as any);

      const result = await repository.findMany({ paymentMethod: 'CREDIT_CARD' });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          cpf: undefined,
          paymentMethod: 'CREDIT_CARD',
          status: undefined,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([mockPaymentEntity]);
    });

    it('should return payments with status filter', async () => {
      prismaService.payment.findMany.mockResolvedValue([mockPrismaPayment] as any);

      const result = await repository.findMany({ status: 'PENDING' });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          cpf: undefined,
          paymentMethod: undefined,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([mockPaymentEntity]);
    });

    it('should return payments with multiple filters', async () => {
      prismaService.payment.findMany.mockResolvedValue([mockPrismaPayment] as any);

      const result = await repository.findMany({
        cpf: '12345678901',
        paymentMethod: 'CREDIT_CARD',
        status: 'PENDING',
      });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          cpf: '12345678901',
          paymentMethod: 'CREDIT_CARD',
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([mockPaymentEntity]);
    });

    it('should return empty array when no payments found', async () => {
      prismaService.payment.findMany.mockResolvedValue([]);

      const result = await repository.findMany({});

      expect(result).toEqual([]);
    });

    it('should handle findMany errors', async () => {
      const error = new Error('Database error');
      prismaService.payment.findMany.mockRejectedValue(error);

      await expect(repository.findMany({})).rejects.toThrow('Database error');
    });
  });

  describe('mapToEntity', () => {
    it('should correctly map Prisma data to entity', async () => {
      const prismaData = {
        ...mockPrismaPayment,
        amount: '100.50', // Prisma returns Decimal as string
      };

      prismaService.payment.findUnique.mockResolvedValue(prismaData as any);

      const result = await repository.findById('test-id');

      expect(result).toEqual({
        ...mockPaymentEntity,
        amount: 100.50, // Should be converted to number
      });
    });

    it('should handle null values in optional fields', async () => {
      const prismaDataWithNulls = {
        ...mockPrismaPayment,
        mercadoPagoPreferenceId: null,
        checkoutUrl: null,
      };

      prismaService.payment.findUnique.mockResolvedValue(prismaDataWithNulls as any);

      const result = await repository.findById('test-id');

      expect(result).toEqual({
        ...mockPaymentEntity,
        mercadoPagoPreferenceId: null,
        checkoutUrl: null,
      });
    });
  });
});
