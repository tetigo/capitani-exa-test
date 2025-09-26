# Script para testar Temporal e Mercado Pago
Write-Host "Testando Servicos..." -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Teste 1: Temporal UI
Write-Host ""
Write-Host "1. Testando Temporal UI..." -ForegroundColor Yellow
try {
    $temporalResponse = Invoke-WebRequest -Uri "http://localhost:8081" -Method GET -TimeoutSec 5
    Write-Host "OK Temporal UI esta rodando!" -ForegroundColor Green
    Write-Host "   Acesse: http://localhost:8081" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO Temporal UI nao esta acessivel" -ForegroundColor Red
    Write-Host "   Verifique se o Docker esta rodando: docker compose ps" -ForegroundColor Yellow
}

# Teste 2: API Principal
Write-Host ""
Write-Host "2. Testando API Principal..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/" -Method GET
    Write-Host "OK API esta rodando: $apiResponse" -ForegroundColor Green
} catch {
    Write-Host "ERRO API nao esta rodando" -ForegroundColor Red
    Write-Host "   Execute: npm run start:dev" -ForegroundColor Yellow
}

# Teste 3: Pagamento PIX
Write-Host ""
Write-Host "3. Testando Pagamento PIX..." -ForegroundColor Yellow
try {
    $pixBody = @{
        cpf = "12345678901"
        description = "Teste PIX"
        amount = 50.00
        paymentMethod = "PIX"
    } | ConvertTo-Json

    $pixResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/payment" -Method POST -Body $pixBody -ContentType "application/json"
    Write-Host "OK Pagamento PIX criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($pixResponse.id)" -ForegroundColor Cyan
    Write-Host "   Status: $($pixResponse.status)" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO ao criar pagamento PIX:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Teste 4: Pagamento Cartao (Mercado Pago)
Write-Host ""
Write-Host "4. Testando Pagamento Cartao (Mercado Pago)..." -ForegroundColor Yellow
try {
    $cardBody = @{
        cpf = "12345678901"
        description = "Teste Cartao"
        amount = 100.00
        paymentMethod = "CREDIT_CARD"
    } | ConvertTo-Json

    $cardResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/payment" -Method POST -Body $cardBody -ContentType "application/json"
    Write-Host "OK Pagamento Cartao criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($cardResponse.id)" -ForegroundColor Cyan
    Write-Host "   Status: $($cardResponse.status)" -ForegroundColor Cyan
    Write-Host "   Mercado Pago: Funcionando (com dados mock)" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO ao criar pagamento Cartao:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Teste 5: Listar Pagamentos
Write-Host ""
Write-Host "5. Testando Listagem de Pagamentos..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/payment" -Method GET
    Write-Host "OK Listagem funcionando!" -ForegroundColor Green
    Write-Host "   Total de pagamentos: $($listResponse.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO ao listar pagamentos:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Teste 6: Worker Temporal
Write-Host ""
Write-Host "6. Verificando Worker Temporal..." -ForegroundColor Yellow
$workerProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*worker*" }
if ($workerProcess) {
    Write-Host "OK Worker Temporal esta rodando!" -ForegroundColor Green
    Write-Host "   PID: $($workerProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "ERRO Worker Temporal nao esta rodando" -ForegroundColor Red
    Write-Host "   Execute: npm run worker" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================" -ForegroundColor Green
Write-Host "OK Testes concluidos!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs uteis:" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:3000" -ForegroundColor White
Write-Host "   - Temporal UI: http://localhost:8081" -ForegroundColor White
Write-Host "   - Adminer: http://localhost:8080" -ForegroundColor White