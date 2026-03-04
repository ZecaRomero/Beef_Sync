# Script para iniciar Evolution API
Write-Host "🐳 Verificando Docker..." -ForegroundColor Cyan

# Aguardar Docker iniciar
Write-Host "⏳ Aguardando Docker Desktop iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar se Docker está rodando
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker está rodando!" -ForegroundColor Green
            break
        }
    } catch {
        # Continuar tentando
    }
    $attempt++
    Write-Host "   Tentativa $attempt/$maxAttempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Docker não está respondendo. Por favor, inicie o Docker Desktop manualmente e execute este script novamente." -ForegroundColor Red
    exit 1
}

# Verificar se o container já existe
Write-Host "`n🔍 Verificando se Evolution API já está rodando..." -ForegroundColor Cyan
$existingContainer = docker ps -a --filter "name=evolution-api" --format "{{.Names}}"

if ($existingContainer -eq "evolution-api") {
    Write-Host "📦 Container já existe. Verificando se está rodando..." -ForegroundColor Yellow
    $running = docker ps --filter "name=evolution-api" --format "{{.Names}}"
    
    if ($running -eq "evolution-api") {
        Write-Host "✅ Evolution API já está rodando!" -ForegroundColor Green
        Write-Host "`n🌐 Acesse: http://localhost:8080" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "🔄 Iniciando container existente..." -ForegroundColor Yellow
        docker start evolution-api
        Start-Sleep -Seconds 3
        Write-Host "✅ Evolution API iniciado!" -ForegroundColor Green
        Write-Host "`n🌐 Acesse: http://localhost:8080" -ForegroundColor Cyan
        exit 0
    }
}

# Criar e iniciar novo container
Write-Host "🚀 Criando e iniciando Evolution API..." -ForegroundColor Cyan
docker run --name evolution-api -d -p 8080:8080 atendai/evolution-api:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Evolution API iniciado com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Abra seu navegador em: http://localhost:8080" -ForegroundColor White
    Write-Host "   2. Crie uma instância" -ForegroundColor White
    Write-Host "   3. Escaneie o QR Code com seu WhatsApp" -ForegroundColor White
    Write-Host "   4. Copie a API Key gerada" -ForegroundColor White
    Write-Host "   5. Cole no arquivo .env como EVOLUTION_API_KEY" -ForegroundColor White
    Write-Host "`n🌐 Acesse agora: http://localhost:8080" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao iniciar Evolution API" -ForegroundColor Red
    Write-Host "   Verifique se a porta 8080 não está sendo usada por outro programa" -ForegroundColor Yellow
}
