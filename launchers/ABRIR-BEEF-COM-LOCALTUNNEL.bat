@echo off
title Beef-Sync + LocalTunnel
color 0A

echo ========================================
echo BEEF-SYNC + LOCALTUNNEL
echo ========================================
echo.

REM Verificar se LocalTunnel está instalado
where lt >nul 2>&1
if errorlevel 1 (
    echo LocalTunnel nao encontrado!
    echo Instalando automaticamente...
    echo.
    npm install -g localtunnel
    echo.
)

echo [1/2] Iniciando Beef-Sync...
echo.

REM Iniciar Beef-Sync em segundo plano
start "Beef-Sync Server" cmd /c "npm run dev"

echo Aguardando servidor iniciar (30 segundos)...
timeout /t 30 /nobreak >nul

echo.
echo [2/2] Iniciando LocalTunnel...
echo.
echo ========================================
echo COPIE A URL ABAIXO:
echo ========================================
echo.

REM Tentar com subdomínio fixo primeiro
lt --port 3020 --subdomain beefsync2026

if errorlevel 1 (
    echo.
    echo Tentando sem subdominio fixo...
    lt --port 3020
)

pause
