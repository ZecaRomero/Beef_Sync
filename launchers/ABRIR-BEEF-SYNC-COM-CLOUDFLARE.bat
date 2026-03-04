@echo off
title Beef-Sync + Cloudflare Tunnel
color 0A

echo ========================================
echo BEEF-SYNC + CLOUDFLARE TUNNEL
echo ========================================
echo.
echo Este script vai:
echo 1. Iniciar o Beef-Sync (npm run dev)
echo 2. Aguardar o servidor iniciar
echo 3. Abrir o Cloudflare Tunnel
echo 4. Mostrar a URL para acessar no celular
echo.
echo ========================================
echo.

REM Verificar se cloudflared existe
if not exist cloudflared.exe (
    echo ERRO: cloudflared.exe nao encontrado!
    echo.
    echo Execute primeiro: INSTALAR-CLOUDFLARE-TUNNEL.bat
    echo OU: SETUP-CLOUDFLARE-COMPLETO.bat
    echo.
    pause
    exit
)

echo [1/3] Iniciando Beef-Sync...
echo.

REM Iniciar Beef-Sync em segundo plano
start "Beef-Sync Server" cmd /c "npm run dev"

echo Aguardando servidor iniciar (30 segundos)...
echo.
timeout /t 30 /nobreak

echo [2/3] Verificando se servidor esta rodando...
echo.

REM Tentar acessar localhost:3020
curl -s http://localhost:3020 >nul 2>&1

if errorlevel 1 (
    echo AVISO: Servidor pode nao estar pronto ainda
    echo Aguardando mais 15 segundos...
    timeout /t 15 /nobreak
)

echo [3/3] Iniciando Cloudflare Tunnel...
echo.
echo ========================================
echo IMPORTANTE:
echo - Copie a URL que sera gerada abaixo
echo - Use essa URL no celular
echo - Mantenha esta janela aberta
echo ========================================
echo.

REM Iniciar túnel
cloudflared.exe tunnel --url http://localhost:3020

pause
