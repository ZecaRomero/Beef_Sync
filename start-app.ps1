# Script para iniciar o Beef Sync na porta 8081
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Iniciando Beef Sync na porta 8081" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se a porta 8081 está em uso
$portInUse = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "AVISO: Porta 8081 já está em uso!" -ForegroundColor Yellow
    Write-Host "Processo: $($portInUse.OwningProcess)" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Deseja matar o processo e continuar? (S/N)"
    if ($response -eq 'S' -or $response -eq 's') {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Write-Host "Processo finalizado." -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Iniciando Next.js..." -ForegroundColor Green
Write-Host ""
Write-Host "Acesse: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Ou:     http://187.77.238.142:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione CTRL+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar o Next.js
npm run start:network
