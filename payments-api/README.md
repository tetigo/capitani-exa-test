# Payments API

API REST para gestão de pagamentos com integração Mercado Pago e orquestração Temporal.io.

## Arquitetura

### Clean Architecture + Temporal.io
```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Controllers    │    │   Domain Layer   │    │  Infrastructure  │
│                  │    │                  │    │                  │
│PaymentsController│    │ PaymentEntity    │    │ PrismaService    │
│WebhookController │    │ PaymentRepo      │    │ MercadoPagoClient│
└──────────────────┘    └──────────────────┘    └──────────────────┘
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
2. **Temporal Workflow inicia** → Cria preferência no Mercado Pago
3. **Preference criada** → Salva `preferenceId` e `checkoutUrl` no banco
4. **Cliente paga** → Mercado Pago envia webhook
5. **Webhook recebido** → Atualiza status + envia signal para Temporal
6. **Workflow finaliza** → Envia notificações + logs de auditoria

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
MERCADOPAGO_WEBHOOK_SECRET="seu_webhook_secret_aqui"

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

- **Workflow**: Orquestra pagamentos com cartão + integração MercadoPago
- **Activities**: Criação de preferences, polling, notificações, auditoria
- **Signals**: Notificação imediata via webhook (+ fallback polling)
- **Worker**: Processa workflows de forma durável
- **Durabilidade**: Workflows sobrevivem a falhas e reinicializações

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

## 🧪 Testes

### Testes da API (Recomendado)
Execute os testes abaixo para verificar todos os endpoints:

### Testes Manuais com cURL

**1. Verificar se API está rodando:**
```bash
curl http://localhost:3000/v1/
```

**2. Criar pagamento PIX:**
```bash
curl -X POST http://localhost:3000/v1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste PIX",
    "amount": 50.00,
    "paymentMethod": "PIX"
  }'
```

**3. Criar pagamento Cartão de Crédito:**
```bash
curl -X POST http://localhost:3000/v1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste Cartão",
    "amount": 100.00,
    "paymentMethod": "CREDIT_CARD"
  }'
# Retorna: payment com checkoutUrl para redirecionar o cliente
```

**4. Listar pagamentos:**
```bash
curl http://localhost:3000/v1/payment
```

**5. Buscar pagamento por ID:**
```bash
curl http://localhost:3000/v1/payment/{ID_DO_PAGAMENTO}
```

**6. Atualizar pagamento:**
```bash
curl -X PUT http://localhost:3000/v1/payment/{ID_DO_PAGAMENTO} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID"
  }'
```

### Testes Unitários
```bash
npm run test
```

### Testes E2E
```bash
npm run test:e2e
```

## 🔄 Fluxo Completo de Pagamento com Cartão

### 1. **Criação do Pagamento**
```bash
POST /v1/payment
{
  "cpf": "12345678901",
  "description": "Produto X",
  "amount": 150.00,
  "paymentMethod": "CREDIT_CARD"
}
```

### 2. **Resposta da API**
```json
{
  "id": "uuid-do-pagamento",
  "cpf": "12345678901",
  "description": "Produto X",
  "amount": 150.00,
  "paymentMethod": "CREDIT_CARD",
  "status": "PENDING",
  "checkoutUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "mercadoPagoPreferenceId": "preference-id",
  "createdAt": "2025-01-02T...",
  "updatedAt": "2025-01-02T..."
}
```

### 3. **Redirecionamento**
- Cliente é redirecionado para `checkoutUrl`
- Realiza pagamento no MercadoPago
- MercadoPago processa o pagamento

### 4. **Webhook Automático**
```bash
POST /v1/webhooks/mercadopago
{
  "external_reference": "uuid-do-pagamento",
  "status": "approved"
}
```

### 5. **Processamento Interno**
- ✅ Status atualizado no banco: `PENDING` → `PAID`
- ✅ Signal enviado para Temporal Workflow
- ✅ Workflow finaliza imediatamente
- ✅ Notificação enviada ao cliente
- ✅ Logs de auditoria registrados

### 6. **Verificação Final**
```bash
GET /v1/payment/uuid-do-pagamento
# Retorna payment com status "PAID"
```

## 📊 Monitoramento em Tempo Real

- **Temporal UI**: http://localhost:8081 - Acompanhe workflows
- **Logs da API**: Terminal com `npm run start:dev`
- **Logs do Worker**: Terminal com `npm run worker`
- **Banco de Dados**: http://localhost:8080 (Adminer)