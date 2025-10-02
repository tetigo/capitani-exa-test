import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { MercadoPagoClient, CreatePreferenceInput } from './mercadopago.client';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MercadoPagoClient', () => {
  let client: MercadoPagoClient;
  let mockAxiosInstance: jest.Mocked<any>;

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      MERCADOPAGO_ACCESS_TOKEN: 'test-token',
    };

    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MercadoPagoClient],
    }).compile();

    client = module.get<MercadoPagoClient>(MercadoPagoClient);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.mercadopago.com',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
    });

    it('should handle missing access token', () => {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;

      new MercadoPagoClient();

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.mercadopago.com',
        headers: {
          Authorization: 'Bearer ',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
    });
  });

  describe('createPreference', () => {
    const input: CreatePreferenceInput = {
      description: 'Test product',
      amount: 150.75,
      external_reference: 'payment-123',
      notification_url: 'https://example.com/webhook',
    };

    it('should create preference successfully', async () => {
      const mockResponse = {
        data: {
          id: 'pref-12345',
          init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
          sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.createPreference(input);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/checkout/preferences', {
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
      });

      expect(result).toEqual({
        id: 'pref-12345',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
      });
    });

    it('should create preference without notification_url', async () => {
      const inputWithoutNotification = {
        description: 'Test product',
        amount: 150.75,
        external_reference: 'payment-123',
      };

      const mockResponse = {
        data: {
          id: 'pref-12345',
          init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.createPreference(inputWithoutNotification);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/checkout/preferences', {
        items: [
          {
            title: inputWithoutNotification.description,
            quantity: 1,
            unit_price: inputWithoutNotification.amount,
            currency_id: 'BRL',
          },
        ],
        external_reference: inputWithoutNotification.external_reference,
        notification_url: undefined,
      });

      expect(result).toEqual({
        id: 'pref-12345',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-12345',
        sandbox_init_point: undefined,
      });
    });

    it('should return mock data when API call fails with network error', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.post.mockRejectedValue(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.createPreference(input);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Mercado Pago preference:',
        'Network Error'
      );

      expect(result).toEqual({
        id: `mock_preference_${input.external_reference}`,
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
      });

      consoleSpy.mockRestore();
    });

    it('should return mock data when API call fails with response error', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Invalid access token',
            error: 'unauthorized',
            status: 401,
          },
        },
        message: 'Request failed with status code 401',
      };

      mockAxiosInstance.post.mockRejectedValue(apiError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.createPreference(input);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Mercado Pago preference:',
        apiError.response.data
      );

      expect(result).toEqual({
        id: `mock_preference_${input.external_reference}`,
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
      });

      consoleSpy.mockRestore();
    });

    it('should handle different currency amounts correctly', async () => {
      const testCases = [
        { amount: 10.99, description: 'Small amount' },
        { amount: 1000.00, description: 'Round amount' },
        { amount: 999.99, description: 'Large amount with cents' },
        { amount: 0.01, description: 'Minimum amount' },
      ];

      for (const testCase of testCases) {
        const testInput = {
          ...input,
          amount: testCase.amount,
          description: testCase.description,
        };

        const mockResponse = {
          data: {
            id: `pref-${testCase.amount}`,
            init_point: `https://checkout.url/${testCase.amount}`,
          },
        };

        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.createPreference(testInput);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/checkout/preferences', {
          items: [
            {
              title: testCase.description,
              quantity: 1,
              unit_price: testCase.amount,
              currency_id: 'BRL',
            },
          ],
          external_reference: testInput.external_reference,
          notification_url: testInput.notification_url,
        });

        expect(result.id).toBe(`pref-${testCase.amount}`);
      }
    });

    it('should handle special characters in description', async () => {
      const specialInput = {
        ...input,
        description: 'Produto com acentos: çãõ & símbolos especiais!@#$%',
      };

      const mockResponse = {
        data: {
          id: 'pref-special',
          init_point: 'https://checkout.url/special',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.createPreference(specialInput);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/checkout/preferences', {
        items: [
          {
            title: 'Produto com acentos: çãõ & símbolos especiais!@#$%',
            quantity: 1,
            unit_price: specialInput.amount,
            currency_id: 'BRL',
          },
        ],
        external_reference: specialInput.external_reference,
        notification_url: specialInput.notification_url,
      });

      expect(result.id).toBe('pref-special');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 15000ms exceeded');
      timeoutError.name = 'ECONNABORTED';
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.createPreference(input);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Mercado Pago preference:',
        'timeout of 15000ms exceeded'
      );

      expect(result).toEqual({
        id: `mock_preference_${input.external_reference}`,
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_${input.external_reference}`,
      });

      consoleSpy.mockRestore();
    });
  });
});
