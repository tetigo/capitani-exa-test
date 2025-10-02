import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentMethodDto } from './dto/create-payment.dto';
import { UpdatePaymentDto, PaymentStatusDto } from './dto/update-payment.dto';
import { PaymentEntity } from '../domain/payment/payment.entity';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  const mockPayment: PaymentEntity = {
    id: 'test-id',
    cpf: '12345678901',
    description: 'Test payment',
    amount: 100.50,
    paymentMethod: 'CREDIT_CARD',
    status: 'PENDING',
    mercadoPagoPreferenceId: 'pref-123',
    checkoutUrl: 'https://mercadopago.com/checkout/123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get(PaymentsService);
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      cpf: '12345678901',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: PaymentMethodDto.CREDIT_CARD,
    };

    it('should create a payment successfully', async () => {
      service.create.mockResolvedValue(mockPayment);

      const result = await controller.create(createPaymentDto);

      expect(service.create).toHaveBeenCalledWith(createPaymentDto);
      expect(result).toEqual(mockPayment);
    });

    it('should handle PIX payment creation', async () => {
      const pixPayment = { ...mockPayment, paymentMethod: 'PIX' as const };
      const pixDto = { ...createPaymentDto, paymentMethod: PaymentMethodDto.PIX };
      service.create.mockResolvedValue(pixPayment);

      const result = await controller.create(pixDto);

      expect(service.create).toHaveBeenCalledWith(pixDto);
      expect(result).toEqual(pixPayment);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      service.create.mockRejectedValue(error);

      await expect(controller.create(createPaymentDto)).rejects.toThrow('Service error');
    });
  });

  describe('update', () => {
    const updatePaymentDto: UpdatePaymentDto = {
      status: PaymentStatusDto.PAID,
      description: 'Updated description',
    };

    it('should update a payment successfully', async () => {
      const updatedPayment = { ...mockPayment, status: 'PAID' as const };
      service.update.mockResolvedValue(updatedPayment);

      const result = await controller.update('test-id', updatePaymentDto);

      expect(service.update).toHaveBeenCalledWith('test-id', updatePaymentDto);
      expect(result).toEqual(updatedPayment);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { status: PaymentStatusDto.FAIL };
      const updatedPayment = { ...mockPayment, status: 'FAIL' as const };
      service.update.mockResolvedValue(updatedPayment);

      const result = await controller.update('test-id', partialUpdate);

      expect(service.update).toHaveBeenCalledWith('test-id', partialUpdate);
      expect(result).toEqual(updatedPayment);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Payment not found');
      service.update.mockRejectedValue(error);

      await expect(controller.update('test-id', updatePaymentDto)).rejects.toThrow('Payment not found');
    });
  });

  describe('findById', () => {
    it('should return a payment by ID', async () => {
      service.findById.mockResolvedValue(mockPayment);

      const result = await controller.findById('test-id');

      expect(service.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockPayment);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Payment not found');
      service.findById.mockRejectedValue(error);

      await expect(controller.findById('test-id')).rejects.toThrow('Payment not found');
    });
  });

  describe('findMany', () => {
    const mockPayments = [mockPayment, { ...mockPayment, id: 'test-id-2' }];

    it('should return payments without filters', async () => {
      service.findMany.mockResolvedValue(mockPayments);

      const result = await controller.findMany();

      expect(service.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual(mockPayments);
    });

    it('should return payments with CPF filter', async () => {
      service.findMany.mockResolvedValue([mockPayment]);

      const result = await controller.findMany('12345678901');

      expect(service.findMany).toHaveBeenCalledWith({ 
        cpf: '12345678901', 
        paymentMethod: undefined 
      });
      expect(result).toEqual([mockPayment]);
    });

    it('should return payments with payment method filter', async () => {
      service.findMany.mockResolvedValue([mockPayment]);

      const result = await controller.findMany(undefined, 'CREDIT_CARD');

      expect(service.findMany).toHaveBeenCalledWith({ 
        cpf: undefined, 
        paymentMethod: 'CREDIT_CARD' 
      });
      expect(result).toEqual([mockPayment]);
    });

    it('should return payments with both filters', async () => {
      service.findMany.mockResolvedValue([mockPayment]);

      const result = await controller.findMany('12345678901', 'CREDIT_CARD');

      expect(service.findMany).toHaveBeenCalledWith({ 
        cpf: '12345678901', 
        paymentMethod: 'CREDIT_CARD' 
      });
      expect(result).toEqual([mockPayment]);
    });

    it('should handle empty results', async () => {
      service.findMany.mockResolvedValue([]);

      const result = await controller.findMany();

      expect(service.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.findMany.mockRejectedValue(error);

      await expect(controller.findMany()).rejects.toThrow('Database error');
    });
  });
});
