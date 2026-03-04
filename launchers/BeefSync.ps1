# BEEF SYNC - Launcher Script
# Sistema de Gestão Bovina

param(
    [switch]$Silent
)

$projectPath = "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _1"
$url = "http://localhost:3000"

if (-not $Silent) {
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "    BEEF SYNC - Sistema de Gestão Bovina" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
}

# Verificar se o diretório existe
if (-not (Test-Path $projectPath)) {
    Write-Host "ERRO: Diretório do projeto não encontrado!" -ForegroundColor Red
    Write-Host "Caminho: $projectPath" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Navegar para o diretório
Set-Location $projectPath

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    if (-not $Silent) {
        Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js primeiro." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o servidor já está rodando
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
    $serverRunning = $true
    if (-not $Silent) {
        Write-Host "✓ Servidor já está rodando!" -ForegroundColor Green
    }
} catch {
    if (-not $Silent) {
        Write-Host "⚠ Servidor não está rodando. Iniciando..." -ForegroundColor Yellow
    }
}

if (-not $serverRunning) {
    # Verificar se as dependências estão instaladas
    if (-not (Test-Path "node_modules")) {
        if (-not $Silent) {
            Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
        }
        npm install
    }

    # Iniciar o servidor
    if (-not $Silent) {
        Write-Host "🚀 Iniciando servidor..." -ForegroundColor Yellow
    }
    
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Minimized
    
    # Aguardar o servidor inicializar
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 1
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
            $serverRunning = $true
            break
        } catch {
            if (-not $Silent) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        }
    } while ($attempt -lt $maxAttempts)
    
    if (-not $Silent) {
        Write-Host ""
    }
}

if ($serverRunning) {
    if (-not $Silent) {
        Write-Host "✓ Servidor rodando com sucesso!" -ForegroundColor Green
        Write-Host "🌐 Abrindo navegador..." -ForegroundColor Green
    }
    
    # Abrir o navegador
    Start-Process $url
    
    if (-not $Silent) {
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "✅ BEEF SYNC está rodando!" -ForegroundColor Green
        Write-Host "🔗 URL: $url" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IMPORTANTE: O servidor está rodando em segundo plano." -ForegroundColor Yellow
        Write-Host "Para parar o sistema, feche todas as janelas do navegador" -ForegroundColor Yellow
        Write-Host "e termine o processo Node.js no Gerenciador de Tarefas." -ForegroundColor Yellow
        Write-Host "===============================================" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Falha ao iniciar o servidor!" -ForegroundColor Red
    Write-Host "Verifique se não há erros no projeto." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}