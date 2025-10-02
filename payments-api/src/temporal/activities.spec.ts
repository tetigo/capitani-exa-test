import { PrismaClient } from '../../generated/prisma';
import axios from 'axios';
import {
  createMercadoPagoPreference,
  getMercadoPagoPaymentStatus,
  updatePaymentStatus,
  getPaymentById,
  updatePaymentMercadoPagoData,
  logPaymentActivity,
  sendPaymentConfirmation,
  sendPaymentFailure,
  waitForConfirmation,
} from './activities';

// Mock dependencies
jest.mock('../../generated/prisma');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('Temporal Activities', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new MockedPrismaClient() as jest.Mocked<PrismaClient>;
    (mockPrisma.payment as any) = {
      update: jest.fn(),
      findUnique: jest.fn(),
    };
  });

  describe('createMercadoPagoPreference', () => {
    const input = {
      description: 'Test payment',
      amount: 100.50,
      external_reference: 'payment-123',
      notification_url: 'http://localhost:3000/webhook',
    };

    it('should create preference successfully', async () => {
      const mockResponse = {
        data: {
          id: 'pref-123',
          init_point: 'https://mercadopago.com/checkout/123',
          sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/123',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await createMercadoPagoPreference(input);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mercadopago.com/checkout/preferences',
        {
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
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
          timeout: 15000,
        })
      );

      expect(result).toEqual({
        id: 'pref-123',
        init_point: 'https://mercadopago.com/checkout/123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/123',
      });
    });

    it('should return mock data when API call fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const result = await createMercadoPagoPreference(input);

      expect(result).toEqual({
        id: `mock_preference_${input.external_reference}`,
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
      });
    });
  });

  describe('getMercadoPagoPaymentStatus', () => {
    const preferenceId = 'pref-123';

    it('should return PAID for approved status', async () => {
      const mockResponse = {
        data: { status: 'approved' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getMercadoPagoPaymentStatus(preferenceId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://api.mercadopago.com/checkout/preferences/${preferenceId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
          timeout: 10000,
        })
      );

      expect(result).toBe('PAID');
    });

    it('should return FAIL for rejected status', async () => {
      const mockResponse = {
        data: { status: 'rejected' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getMercadoPagoPaymentStatus(preferenceId);

      expect(result).toBe('FAIL');
    });

    it('should return FAIL for cancelled status', async () => {
      const mockResponse = {
        data: { status: 'cancelled' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getMercadoPagoPaymentStatus(preferenceId);

      expect(result).toBe('FAIL');
    });

    it('should return PENDING for other statuses', async () => {
      const mockResponse = {
        data: { status: 'pending' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getMercadoPagoPaymentStatus(preferenceId);

      expect(result).toBe('PENDING');
    });

    it('should return FAIL when API call fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await getMercadoPagoPaymentStatus(preferenceId);

      expect(result).toBe('FAIL');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      mockPrisma.payment.update.mockResolvedValue({} as any);

      await updatePaymentStatus('payment-123', 'PAID');

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when update fails', async () => {
      const error = new Error('Database error');
      mockPrisma.payment.update.mockRejectedValue(error);

      await expect(updatePaymentStatus('payment-123', 'PAID')).rejects.toThrow('Database error');
    });
  });

  describe('getPaymentById', () => {
    it('should return payment when found', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: 'PENDING',
        amount: 100.50,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment as any);

      const result = await getPaymentById('payment-123');

      expect(mockPrisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.payment.findUnique.mockRejectedValue(error);

      await expect(getPaymentById('payment-123')).rejects.toThrow('Database error');
    });
  });

  describe('updatePaymentMercadoPagoData', () => {
    it('should update MercadoPago data successfully', async () => {
      mockPrisma.payment.update.mockResolvedValue({} as any);

      await updatePaymentMercadoPagoData('payment-123', 'pref-123', 'https://checkout.url');

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          mercadoPagoPreferenceId: 'pref-123',
          checkoutUrl: 'https://checkout.url',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when update fails', async () => {
      const error = new Error('Database error');
      mockPrisma.payment.update.mockRejectedValue(error);

      await expect(
        updatePaymentMercadoPagoData('payment-123', 'pref-123', 'https://checkout.url')
      ).rejects.toThrow('Database error');
    });
  });

  describe('logPaymentActivity', () => {
    it('should log activity without details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await logPaymentActivity('payment-123', 'PAYMENT_CREATED');

      expect(consoleSpy).toHaveBeenCalledWith('[PAYMENT-payment-123] PAYMENT_CREATED', '');

      consoleSpy.mockRestore();
    });

    it('should log activity with details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const details = { amount: 100.50, method: 'CREDIT_CARD' };

      await logPaymentActivity('payment-123', 'PAYMENT_CREATED', details);

      expect(consoleSpy).toHaveBeenCalledWith('[PAYMENT-payment-123] PAYMENT_CREATED', details);

      consoleSpy.mockRestore();
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should log payment confirmation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendPaymentConfirmation('payment-123', '12345678901');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending payment confirmation for payment payment-123 to CPF 12345678901'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('sendPaymentFailure', () => {
    it('should log payment failure without reason', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendPaymentFailure('payment-123', '12345678901');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending payment failure notification for payment payment-123 to CPF 12345678901. Reason: Unknown'
      );

      consoleSpy.mockRestore();
    });

    it('should log payment failure with reason', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendPaymentFailure('payment-123', '12345678901', 'Insufficient funds');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending payment failure notification for payment payment-123 to CPF 12345678901. Reason: Insufficient funds'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('waitForConfirmation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return PAID when payment is confirmed', async () => {
      const mockPayment = { id: 'payment-123', status: 'PAID' };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment as any);

      const promise = waitForConfirmation('payment-123');

      // Fast-forward time to trigger the first check
      jest.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBe('PAID');
      expect(mockPrisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
      });
    });

    it('should return FAIL when payment fails', async () => {
      const mockPayment = { id: 'payment-123', status: 'FAIL' };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment as any);

      const promise = waitForConfirmation('payment-123');

      // Fast-forward time to trigger the first check
      jest.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBe('FAIL');
    });

    it('should return FAIL when payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      const promise = waitForConfirmation('payment-123');

      // Fast-forward time to trigger the first check
      jest.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBe('FAIL');
    });

    it('should return FAIL when timeout is reached', async () => {
      const mockPayment = { id: 'payment-123', status: 'PENDING' };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment as any);

      const promise = waitForConfirmation('payment-123');

      // Fast-forward time beyond the timeout (10 minutes)
      jest.advanceTimersByTime(11 * 60 * 1000);

      const result = await promise;

      expect(result).toBe('FAIL');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.payment.findUnique
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ id: 'payment-123', status: 'PAID' } as any);

      const promise = waitForConfirmation('payment-123');

      // Fast-forward time to trigger multiple checks
      jest.advanceTimersByTime(10000);

      const result = await promise;

      expect(result).toBe('PAID');
      expect(mockPrisma.payment.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
