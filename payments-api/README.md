# Payments API

API REST para gestão de pagamentos com integração Mercado Pago e orquestração Temporal.io.

## Arquitetura

### Clean Architecture + Temporal.io
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controllers   │    │   Domain Layer   │    │  Infrastructure │
│                 │    │                  │    │                 │
│PaymentsController│   │ PaymentEntity    │    │ PrismaService   │
│WebhookController│    │ PaymentRepo      │    │ MercadoPagoClient│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Temporal.io     │
                    │                  │
                    │ Workflow         │
                    │ Activities       │
                    │ Worker           │
                    └──────────────────┘
```

### Fluxo de Pagamento

#### PIX
1. `POST /v1/payment` → Cria pagamento com status `PENDING`
2. Retorna dados do pagamento

#### Cartão de Crédito
1. `POST /v1/payment` → Cria pagamento `PENDING`
2. Cria preferência no Mercado Pago
3. Inicia workflow Temporal para aguardar confirmação
4. Webhook Mercado Pago → Atualiza status para `PAID`/`FAIL`
5. Workflow detecta mudança e finaliza

## Tecnologias

- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **Temporal.io** - Orquestração de workflows
- **Mercado Pago** - Gateway de pagamento
- **Docker** - Containerização

## 🚀 Execução Rápida

```bash
# 1. Clone e instale dependências
git clone <repo>
cd payments-api
npm install

# 2. Configure o .env (veja seção Configuração)

# 3. Setup completo
npm run dev:setup

# 4. Em 3 terminais separados:
# Terminal 1: API
npm run start:dev

# Terminal 2: Worker
npm run build
npm run worker

# Terminal 3: Logs (opcional)
docker compose logs -f
```

## Configuração

### 1. Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```bash
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payments?schema=public"

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="seu_token_aqui"
MERCADOPAGO_WEBHOOK_URL="http://localhost:3000/v1/webhooks/mercadopago"

# Temporal
TEMPORAL_ADDRESS="localhost:7233"
TEMPORAL_NAMESPACE="default"
TEMPORAL_TASK_QUEUE="payments-task-queue"
```

### 2. Banco de Dados

```bash
# Subir PostgreSQL + Adminer
docker compose up -d

# Aplicar migrações
npx prisma migrate dev
```

### 3. Temporal Server

O servidor Temporal já está incluído no `docker-compose.yml`. Não é necessário instalar separadamente.

## Execução

### 1. Infraestrutura (Terminal 1)
```bash
# Subir PostgreSQL + Temporal + Adminer
docker compose up -d

# Aplicar migrações do banco
npx prisma migrate dev
```

### 2. API (Terminal 2)
```bash
npm run start:dev
```

### 3. Worker Temporal (Terminal 3)
```bash
npm run build
npm run worker
```

## Interfaces e URLs

### 🌐 Aplicação
- **API REST**: http://localhost:3000
- **Health Check**: http://localhost:3000/v1/

### 🗄️ Banco de Dados
- **Adminer**: http://localhost:8080
  - Servidor: `payments_db`
  - Usuário: `postgres`
  - Senha: `postgres`
  - Base: `payments`

### ⚡ Temporal.io
- **Temporal UI**: http://localhost:8081
  - Namespace: `default`
  - Task Queue: `payments-task-queue`

### 📊 Monitoramento
- **Logs da API**: Terminal onde roda `npm run start:dev`
- **Logs do Worker**: Terminal onde roda `npm run worker`
- **Logs Docker**: `docker compose logs -f`

## Endpoints

### Pagamentos

#### Criar Pagamento
```bash
curl -X POST http://localhost:3000/v1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Pagamento teste",
    "amount": 100.50,
    "paymentMethod": "PIX"
  }'
```

#### Atualizar Pagamento
```bash
curl -X PUT http://localhost:3000/v1/payment/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID"}'
```

#### Buscar por ID
```bash
curl http://localhost:3000/v1/payment/{id}
```

#### Listar com Filtros
```bash
curl "http://localhost:3000/v1/payment?cpf=12345678901&paymentMethod=PIX"
```

### Webhook Mercado Pago

```bash
curl -X POST http://localhost:3000/v1/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"id": "payment_id"},
    "status": "approved"
  }'
```

## Estrutura do Projeto

```
src/
├── domain/                 # Camada de Domínio
│   └── payment/
│       ├── payment.entity.ts
│       └── payment.repository.ts
├── infra/                  # Camada de Infraestrutura
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── payment/
│   │   └── payment.prisma.repository.ts
│   └── mercadopago/
│       └── mercadopago.client.ts
├── payments/               # Módulo de Pagamentos
│   ├── dto/
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── payments.module.ts
├── temporal/               # Temporal.io
│   ├── workflows.ts
│   ├── activities.ts
│   ├── worker.ts
│   ├── temporalClient.service.ts
│   └── temporal.module.ts
├── webhooks/               # Webhooks
│   └── mercadopago.webhook.ts
└── app.module.ts
```

## Validações

- **CPF**: 11 dígitos
- **Amount**: Número positivo
- **PaymentMethod**: `PIX` ou `CREDIT_CARD`
- **Status**: `PENDING`, `PAID`, `FAIL`

## Versionamento

API versionada via URL: `/v1/payment`

## Clean Architecture

- **Domain**: Entidades e interfaces de repositório
- **Infrastructure**: Implementações concretas (Prisma, Mercado Pago)
- **Application**: Casos de uso (Services)
- **Presentation**: Controllers e DTOs

## Temporal.io

- **Workflow**: Orquestra pagamentos com cartão
- **Activities**: Polling do banco para confirmação
- **Worker**: Processa workflows
- **Durabilidade**: Workflows sobrevivem a falhas

## Testes

```bash
# Unitários
npm run test

# E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## Scripts Disponíveis

- `npm run start:dev` - Desenvolvimento
- `npm run build` - Build produção
- `npm run start:prod` - Produção
- `npm run worker` - Worker Temporal
- `npm run dev:setup` - Setup completo (Docker + Migrações)
- `npm run dev:full` - Build + Worker
- `npm run lint` - Linting
- `npm run test` - Testes

## Docker

```bash
# Subir infraestrutura (PostgreSQL + Temporal + Adminer)
docker compose up -d

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

## Interfaces Web

### Adminer (PostgreSQL)
- **URL**: http://localhost:8080
- **Servidor**: `payments_db`
- **Usuário**: `postgres`
- **Senha**: `postgres`
- **Base**: `payments`

### Temporal UI
- **URL**: http://localhost:8081
- **Namespace**: `default`

## 🔧 Troubleshooting

### Verificar se tudo está funcionando

```bash
# 1. Verificar containers
docker compose ps

# 2. Verificar API
curl http://localhost:3000/v1/

# 3. Verificar banco
curl http://localhost:8080

# 4. Verificar Temporal
curl http://localhost:8081

# 5. Testar pagamento PIX
curl -X POST http://localhost:3000/v1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste PIX",
    "amount": 50.00,
    "paymentMethod": "PIX"
  }'
```

### Problemas Comuns

**❌ Erro de conexão com banco:**
```bash
docker compose restart db
npx prisma migrate dev
```

**❌ Erro de conexão com Temporal:**
```bash
docker compose restart temporal
```

**❌ Worker não conecta:**
```bash
npm run build
npm run worker
```

**❌ API não inicia:**
```bash
npm install
npm run start:dev
```