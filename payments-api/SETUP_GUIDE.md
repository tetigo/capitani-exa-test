# 🚀 Guia Completo de Setup - Payments API

## ✅ Pré-requisitos

1. **Node.js** (versão 18+)
2. **Docker** e **Docker Compose**
3. **Conta no MercadoPago** com API Key

## 📋 Passo a Passo

### 1. **Configurar Variáveis de Ambiente**

Crie o arquivo `.env` na raiz do projeto:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payments?schema=public"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="YOUR_MERCADOPAGO_ACCESS_TOKEN_HERE"
MERCADOPAGO_WEBHOOK_URL="http://localhost:3000/v1/webhooks/mercadopago"
MERCADOPAGO_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET_HERE"

# Temporal
TEMPORAL_ADDRESS="localhost:7233"
TEMPORAL_NAMESPACE="default"
TEMPORAL_TASK_QUEUE="payments-task-queue"

# App
PORT=3000
NODE_ENV=development
```

### 2. **Instalar Dependências**

```bash
npm install
```

### 3. **Subir Serviços (PostgreSQL + Temporal)**

```bash
docker compose up -d
```

### 4. **Aplicar Migrações do Banco**

```bash
npx prisma migrate deploy
# ou para desenvolvimento:
npx prisma migrate dev
```

### 5. **Gerar Cliente Prisma**

```bash
npx prisma generate
```

### 6. **Compilar o Projeto**

```bash
npm run build
```

### 7. **Iniciar Worker do Temporal**

Em um terminal separado:
```bash
npm run worker
```

### 8. **Iniciar API**

Em outro terminal:
```bash
npm run start:dev
```

## 🔗 URLs Importantes

- **API**: http://localhost:3000
- **Webhook MercadoPago**: http://localhost:3000/v1/webhooks/mercadopago
- **Temporal UI**: http://localhost:8081
- **Adminer (DB)**: http://localhost:8080

## 🧪 Testando a Integração

### 1. **Criar um Pagamento**

```bash
curl -X POST http://localhost:3000/v1/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste de pagamento",
    "amount": 100.50,
    "paymentMethod": "CREDIT_CARD"
  }'
```

### 2. **Simular Webhook do MercadoPago**

```bash
curl -X POST http://localhost:3000/v1/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -d '{
    "external_reference": "SEU_PAYMENT_ID_AQUI",
    "status": "approved"
  }'
```

## 🔧 Comandos Úteis

```bash
# Resetar banco de dados
npx prisma migrate reset

# Ver logs do Temporal
docker logs payments_temporal

# Ver logs do PostgreSQL
docker logs payments_db

# Parar todos os serviços
docker compose down
```

## ⚠️ Problemas Comuns

1. **Erro de conexão com banco**: Verifique se o Docker está rodando
2. **Temporal não conecta**: Aguarde alguns segundos após `docker compose up`
3. **Webhook não funciona**: Verifique se a URL está correta no MercadoPago
4. **Worker não processa**: Verifique se o worker está rodando

## 🎯 Fluxo Completo

1. **Cliente cria pagamento** → API cria registro no banco
2. **Temporal workflow inicia** → Cria preference no MercadoPago
3. **Preference criada** → Dados salvos no banco (preferenceId, checkoutUrl)
4. **Cliente paga** → MercadoPago chama webhook
5. **Webhook recebido** → Atualiza banco + envia signal para Temporal
6. **Workflow finaliza** → Envia notificações + logs de auditoria

## 📊 Monitoramento

- **Temporal UI**: Acompanhe workflows em tempo real
- **Logs da aplicação**: Todos os eventos são logados
- **Banco de dados**: Via Adminer ou cliente PostgreSQL
