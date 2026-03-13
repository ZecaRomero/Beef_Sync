# Script para migrar banco de dados local para o VPS
# Uso: .\scripts\migrar-banco-vps.ps1

$ErrorActionPreference = "Stop"

# Configurações Locais (ajuste se necessário)
$PgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
$LocalDbName = "beef_sync"
$LocalUser = "postgres"
$LocalHost = "localhost"
$LocalPort = "5432"
# Senha local (lida do .env ou defina aqui)
$env:PGPASSWORD = "jcromero85" 

# Configurações do VPS
$VpsIp = "187.77.238.142"
$VpsUser = "root"
$VpsContainer = "evolution-postgres" # Nome do container Postgres no VPS
$VpsDbUser = "evolution"
$VpsDbName = "beef_sync"

# 1. Verificar se pg_dump existe
if (-not (Test-Path $PgDumpPath)) {
    Write-Host "Erro: pg_dump.exe nao encontrado em $PgDumpPath" -ForegroundColor Red
    Write-Host "Por favor, instale o PostgreSQL ou ajuste o caminho no script."
    exit 1
}

# 2. Gerar Dump Local
Write-Host "1/4 Gerando backup do banco local ($LocalDbName)..." -ForegroundColor Cyan
$DumpFile = "$env:TEMP\backup_migracao.sql"

& $PgDumpPath -h $LocalHost -p $LocalPort -U $LocalUser -d $LocalDbName --no-owner --no-acl --clean --if-exists -F p -f $DumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao gerar backup local." -ForegroundColor Red
    exit 1
}

# 3. Enviar para VPS
Write-Host "2/4 Enviando backup para o VPS ($VpsIp)..." -ForegroundColor Cyan
scp $DumpFile "${VpsUser}@${VpsIp}:/tmp/backup_migracao.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao enviar arquivo." -ForegroundColor Red
    exit 1
}

# 4. Criar Banco no VPS (se não existir)
Write-Host "3/4 Verificando banco de dados no VPS..." -ForegroundColor Cyan
$CreateDbCmd = "docker exec $VpsContainer psql -U $VpsDbUser -d postgres -c ""SELECT 1 FROM pg_database WHERE datname = '$VpsDbName'"" | grep -q 1 || docker exec $VpsContainer psql -U $VpsDbUser -d postgres -c ""CREATE DATABASE $VpsDbName;"""

ssh "${VpsUser}@${VpsIp}" $CreateDbCmd

# 5. Restaurar no VPS
Write-Host "4/4 Restaurando dados no VPS..." -ForegroundColor Cyan
$RestoreCmd = "cat /tmp/backup_migracao.sql | docker exec -i $VpsContainer psql -U $VpsDbUser -d $VpsDbName"

ssh "${VpsUser}@${VpsIp}" $RestoreCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migracao concluida com sucesso!" -ForegroundColor Green
    Write-Host "O banco de dados '$VpsDbName' foi atualizado no VPS."
} else {
    Write-Host "❌ Erro na restauracao." -ForegroundColor Red
}

# Limpeza
Remove-Item $DumpFile -ErrorAction SilentlyContinue
