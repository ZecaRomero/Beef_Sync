# Envia arquivos atualizados para o VPS (execute no PowerShell do WINDOWS)
# Uso: .\ENVIAR-PARA-VPS.ps1

$Ip = "187.77.238.142"
$DestPath = "/opt/beefsync"
$LocalPath = $PSScriptRoot

Write-Host "Enviando Dockerfile, compose e lib para $Ip..." -ForegroundColor Cyan

# Arquivos essenciais para o build
scp "$LocalPath\Dockerfile" "root@${Ip}:${DestPath}/"
scp "$LocalPath\docker-compose.beefsync-build.yml" "root@${Ip}:${DestPath}/"
scp "$LocalPath\docker-compose.beefsync-completo.yml" "root@${Ip}:${DestPath}/"
scp "$LocalPath\lib\database.js" "root@${Ip}:${DestPath}/lib/"

Write-Host ""
Write-Host "Arquivos enviados! No VPS execute:" -ForegroundColor Green
Write-Host "  cd /opt/beefsync" -ForegroundColor White
Write-Host "  docker compose -f /opt/beefsync/docker-compose.beefsync-build.yml build --no-cache" -ForegroundColor White
Write-Host "  docker compose -f /opt/beefsync/docker-compose.beefsync-build.yml up -d" -ForegroundColor White
