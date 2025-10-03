// Mock do Prisma antes de importar as activities
jest.mock('../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    payment: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  })),
}));

// Mock do axios
jest.mock('axios');

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

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Temporal Activities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar console.log/error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createMercadoPagoPreference', () => {
    it('should create preference successfully', async () => {
      const mockResponse = {
        data: {
          id: 'pref-123',
          init_point: 'https://checkout.mercadopago.com/123',
          sandbox_init_point: 'https://sandbox.checkout.mercadopago.com/123',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const input = {
        description: 'Test payment',
        amount: 100.50,
        external_reference: 'payment-123',
        notification_url: 'https://api.example.com/webhook',
      };

      const result = await createMercadoPagoPreference(input);

      expect(result).toEqual({
        id: 'pref-123',
        init_point: 'https://checkout.mercadopago.com/123',
        sandbox_init_point: 'https://sandbox.checkout.mercadopago.com/123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mercadopago.com/checkout/preferences',
        expect.objectContaining({
          items: [
            {
              title: 'Test payment',
              quantity: 1,
              unit_price: 100.50,
              currency_id: 'BRL',
            },
          ],
          external_reference: 'payment-123',
          notification_url: 'https://api.example.com/webhook',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
          timeout: 15000,
        })
      );
    });

    it('should return mock data when API fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const input = {
        description: 'Test payment',
        amount: 100.50,
        external_reference: 'payment-123',
      };

      const result = await createMercadoPagoPreference(input);

      expect(result).toEqual({
        id: 'mock_preference_payment-123',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_payment-123',
      });
    });
  });

  describe('getMercadoPagoPaymentStatus', () => {
    it('should return PAID for approved status', async () => {
      const mockResponse = {
        data: { status: 'approved' },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await getMercadoPagoPaymentStatus('pref-123');

      expect(result).toBe('PAID');
    });

    it('should return FAIL when API fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await getMercadoPagoPaymentStatus('pref-123');

      expect(result).toBe('FAIL');
    });
  });

  describe('logPaymentActivity', () => {
    it('should log activity', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await logPaymentActivity('payment-123', 'TEST_ACTIVITY', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PAYMENT-payment-123] TEST_ACTIVITY',
        { test: 'data' }
      );
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should log confirmation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendPaymentConfirmation('payment-123', '12345678901');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending payment confirmation for payment payment-123 to CPF 12345678901'
      );
    });
  });

  describe('sendPaymentFailure', () => {
    it('should log failure', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendPaymentFailure('payment-123', '12345678901', 'Test reason');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Sending payment failure notification for payment payment-123 to CPF 12345678901. Reason: Test reason'
      );
    });
  });

  // Testes simplificados para funções que usam Prisma
  describe('Database functions', () => {
    it('should be defined', () => {
      expect(updatePaymentStatus).toBeDefined();
      expect(getPaymentById).toBeDefined();
      expect(updatePaymentMercadoPagoData).toBeDefined();
      expect(waitForConfirmation).toBeDefined();
    });
  });
});