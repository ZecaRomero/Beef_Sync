# Script para enviar o Beef Sync ao VPS em /opt/beefsync
# Uso: .\scripts\deploy-to-vps.ps1
# Ou: .\scripts\deploy-to-vps.ps1 -Ip "187.77.238.142"

param(
    [string]$Ip = "187.77.238.142",
    [string]$DestPath = "/opt/beefsync"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$ProjectRoot\package.json")) {
    $ProjectRoot = Get-Location
}

Set-Location $ProjectRoot

Write-Host "Projeto: $ProjectRoot" -ForegroundColor Cyan
Write-Host "Destino: root@${Ip}:${DestPath}" -ForegroundColor Cyan
Write-Host ""

# Usar tar (Windows 10+) para criar arquivo excluindo node_modules e .next
$Archive = Join-Path $env:TEMP "beef-sync-deploy.tar"
if (Test-Path $Archive) { Remove-Item $Archive -Force }

Write-Host "Criando arquivo compactado (excluindo node_modules e .next)..." -ForegroundColor Yellow
tar --exclude=node_modules --exclude=.next --exclude=.git -cf $Archive .

Write-Host "Enviando para o VPS..." -ForegroundColor Yellow
scp $Archive "root@${Ip}:/tmp/beef-sync-deploy.tar"

Write-Host "Extraindo no VPS..." -ForegroundColor Yellow
ssh "root@${Ip}" "mkdir -p $DestPath && cd $DestPath && tar -xf /tmp/beef-sync-deploy.tar && rm /tmp/beef-sync-deploy.tar"

Remove-Item $Archive -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deploy concluido! package.json e demais arquivos estao em $DestPath" -ForegroundColor Green
Write-Host ""
Write-Host "No VPS, execute:" -ForegroundColor Cyan
Write-Host "  cd $DestPath && npm install && npm run build && npm run start" -ForegroundColor White
Write-Host ""
