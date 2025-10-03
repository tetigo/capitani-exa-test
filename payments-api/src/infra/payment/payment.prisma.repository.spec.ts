// Mock do PrismaService
const mockPrismaService = {
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

import { PaymentPrismaRepository } from './payment.prisma.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentPrismaRepository', () => {
  let repository: PaymentPrismaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PaymentPrismaRepository(mockPrismaService as any);
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const paymentData = {
        id: 'payment-123',
        cpf: '12345678901',
        description: 'Test payment',
        amount: 100.50,
        paymentMethod: 'CREDIT_CARD' as any,
        status: 'PENDING' as any,
      };

      const mockPrismaResult = { 
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.payment.create.mockResolvedValue(mockPrismaResult);

      const result = await repository.create(paymentData);

      // Verificar que foi chamado com os dados corretos (sem createdAt/updatedAt)
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: paymentData.id,
          cpf: paymentData.cpf,
          description: paymentData.description,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          status: paymentData.status,
        }),
      });
      expect(result).toEqual(expect.objectContaining({
        id: paymentData.id,
        cpf: paymentData.cpf,
        description: paymentData.description,
      }));
    });
  });

  describe('findById', () => {
    it('should find a payment by id', async () => {
      const paymentId = 'payment-123';
      const mockPrismaResult = {
        id: paymentId,
        cpf: '12345678901',
        description: 'Test payment',
        amount: 100.50,
        paymentMethod: 'CREDIT_CARD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPrismaResult);

      const result = await repository.findById(paymentId);

      expect(mockPrismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
      expect(result).toEqual(expect.objectContaining({
        id: paymentId,
      }));
    });

    it('should return null when payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const paymentId = 'payment-123';
      const updateData = { status: 'PAID' as any };
      const mockPrismaResult = {
        id: paymentId,
        cpf: '12345678901',
        description: 'Test payment',
        amount: 100.50,
        paymentMethod: 'CREDIT_CARD',
        status: 'PAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.payment.update.mockResolvedValue(mockPrismaResult);

      const result = await repository.update(paymentId, updateData);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: updateData,
      });
      expect(result).toEqual(expect.objectContaining({
        id: paymentId,
        status: 'PAID',
      }));
    });
  });
});