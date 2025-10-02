import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { PaymentMethodDto } from '../src/payments/dto/create-payment.dto';
import { PaymentStatusDto } from '../src/payments/dto/update-payment.dto';

describe('Payments API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.payment.deleteMany();
  });

  describe('/v1/payment (POST)', () => {
    const validPaymentData = {
      cpf: '12345678901',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: PaymentMethodDto.PIX,
    };

    it('should create a PIX payment successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment')
        .send(validPaymentData)
        .expect(201);

      expect(response.body).toMatchObject({
        cpf: validPaymentData.cpf,
        description: validPaymentData.description,
        amount: validPaymentData.amount,
        paymentMethod: validPaymentData.paymentMethod,
        status: 'PENDING',
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should create a credit card payment successfully', async () => {
      const creditCardData = {
        ...validPaymentData,
        paymentMethod: PaymentMethodDto.CREDIT_CARD,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/payment')
        .send(creditCardData)
        .expect(201);

      expect(response.body).toMatchObject({
        cpf: creditCardData.cpf,
        description: creditCardData.description,
        amount: creditCardData.amount,
        paymentMethod: creditCardData.paymentMethod,
        status: 'PENDING',
      });

      // For credit card payments, these fields should be populated by the workflow
      // In a real test environment, you might need to wait or mock the temporal workflow
      expect(response.body.id).toBeDefined();
    });

    it('should validate CPF length', async () => {
      const invalidCpfData = {
        ...validPaymentData,
        cpf: '123456789', // Too short
      };

      await request(app.getHttpServer())
        .post('/v1/payment')
        .send(invalidCpfData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/v1/payment')
        .send({})
        .expect(400);
    });

    it('should validate amount is positive', async () => {
      const negativeAmountData = {
        ...validPaymentData,
        amount: -10.50,
      };

      await request(app.getHttpServer())
        .post('/v1/payment')
        .send(negativeAmountData)
        .expect(400);
    });

    it('should validate payment method enum', async () => {
      const invalidMethodData = {
        ...validPaymentData,
        paymentMethod: 'INVALID_METHOD',
      };

      await request(app.getHttpServer())
        .post('/v1/payment')
        .send(invalidMethodData)
        .expect(400);
    });

    it('should reject extra fields', async () => {
      const dataWithExtraFields = {
        ...validPaymentData,
        extraField: 'should be rejected',
      };

      await request(app.getHttpServer())
        .post('/v1/payment')
        .send(dataWithExtraFields)
        .expect(400);
    });
  });

  describe('/v1/payment/:id (GET)', () => {
    let createdPaymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          cpf: '12345678901',
          description: 'Test payment for GET',
          amount: 75.25,
          paymentMethod: 'PIX',
          status: 'PENDING',
        },
      });
      createdPaymentId = payment.id;
    });

    it('should return payment by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/payment/${createdPaymentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdPaymentId,
        cpf: '12345678901',
        description: 'Test payment for GET',
        amount: 75.25,
        paymentMethod: 'PIX',
        status: 'PENDING',
      });
    });

    it('should return 404 for non-existent payment', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/v1/payment/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('/v1/payment/:id (PUT)', () => {
    let createdPaymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          cpf: '12345678901',
          description: 'Test payment for PUT',
          amount: 50.00,
          paymentMethod: 'CREDIT_CARD',
          status: 'PENDING',
        },
      });
      createdPaymentId = payment.id;
    });

    it('should update payment status', async () => {
      const updateData = {
        status: PaymentStatusDto.PAID,
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/payment/${createdPaymentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('PAID');
      expect(response.body.id).toBe(createdPaymentId);
    });

    it('should update payment description', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/payment/${createdPaymentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('should update payment amount', async () => {
      const updateData = {
        amount: 199.99,
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/payment/${createdPaymentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.amount).toBe(199.99);
    });

    it('should return 404 for non-existent payment', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = { status: PaymentStatusDto.PAID };

      await request(app.getHttpServer())
        .put(`/v1/payment/${nonExistentId}`)
        .send(updateData)
        .expect(404);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        amount: -50.00, // Negative amount
      };

      await request(app.getHttpServer())
        .put(`/v1/payment/${createdPaymentId}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('/v1/payment (GET)', () => {
    beforeEach(async () => {
      // Create test payments
      await prisma.payment.createMany({
        data: [
          {
            cpf: '11111111111',
            description: 'PIX payment 1',
            amount: 100.00,
            paymentMethod: 'PIX',
            status: 'PAID',
          },
          {
            cpf: '11111111111',
            description: 'Credit card payment 1',
            amount: 200.00,
            paymentMethod: 'CREDIT_CARD',
            status: 'PENDING',
          },
          {
            cpf: '22222222222',
            description: 'PIX payment 2',
            amount: 150.00,
            paymentMethod: 'PIX',
            status: 'FAIL',
          },
        ],
      });
    });

    it('should return all payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('cpf');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('paymentMethod');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should filter payments by CPF', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment?cpf=11111111111')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((payment: any) => payment.cpf === '11111111111')).toBe(true);
    });

    it('should filter payments by payment method', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment?paymentMethod=PIX')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((payment: any) => payment.paymentMethod === 'PIX')).toBe(true);
    });

    it('should filter payments by both CPF and payment method', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment?cpf=11111111111&paymentMethod=CREDIT_CARD')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].cpf).toBe('11111111111');
      expect(response.body[0].paymentMethod).toBe('CREDIT_CARD');
    });

    it('should return empty array when no payments match filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment?cpf=99999999999')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('/v1/webhooks/mercadopago (POST)', () => {
    let createdPaymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          cpf: '12345678901',
          description: 'Test payment for webhook',
          amount: 100.00,
          paymentMethod: 'CREDIT_CARD',
          status: 'PENDING',
        },
      });
      createdPaymentId = payment.id;
    });

    it('should handle approved payment webhook', async () => {
      const webhookData = {
        external_reference: createdPaymentId,
        status: 'approved',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/webhooks/mercadopago')
        .send(webhookData)
        .expect(201);

      expect(response.body).toEqual({ ok: true });

      // Verify payment was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: createdPaymentId },
      });

      expect(updatedPayment?.status).toBe('PAID');
    });

    it('should handle rejected payment webhook', async () => {
      const webhookData = {
        external_reference: createdPaymentId,
        status: 'rejected',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/webhooks/mercadopago')
        .send(webhookData)
        .expect(201);

      expect(response.body).toEqual({ ok: true });

      // Verify payment was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: createdPaymentId },
      });

      expect(updatedPayment?.status).toBe('FAIL');
    });

    it('should handle webhook with data.id structure', async () => {
      const webhookData = {
        data: { id: createdPaymentId },
        status: 'approved',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/webhooks/mercadopago')
        .send(webhookData)
        .expect(201);

      expect(response.body).toEqual({ ok: true });
    });

    it('should handle webhook without external reference', async () => {
      const webhookData = {
        status: 'approved',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/webhooks/mercadopago')
        .send(webhookData)
        .expect(201);

      expect(response.body).toEqual({ ok: true });
    });

    it('should handle webhook for non-existent payment gracefully', async () => {
      const webhookData = {
        external_reference: '00000000-0000-0000-0000-000000000000',
        status: 'approved',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/webhooks/mercadopago')
        .send(webhookData)
        .expect(201);

      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('Health Check', () => {
    it('should return health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
