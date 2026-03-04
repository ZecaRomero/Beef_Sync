@echo off
title Setup Cloudflare Tunnel - Beef-Sync
color 0E

echo ========================================
echo SETUP CLOUDFLARE TUNNEL - BEEF-SYNC
echo ========================================
echo.
echo Este script vai:
echo 1. Baixar o Cloudflare Tunnel (cloudflared)
echo 2. Configurar o tunel para porta 3020
echo 3. Iniciar o tunel automaticamente
echo.
echo VANTAGENS sobre ngrok:
echo - Gratuito para sempre
echo - SEM limite de banda
echo - SEM limite de conexoes
echo - Mais rapido e estavel
echo.
echo ========================================
echo.
pause

REM Verificar se já existe
if exist cloudflared.exe (
    echo cloudflared.exe ja existe!
    echo.
    goto :start_tunnel
)

echo Baixando cloudflared...
echo Aguarde, pode levar alguns minutos...
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'}"

if not exist cloudflared.exe (
    echo.
    echo ERRO: Falha ao baixar cloudflared
    echo.
    echo Tente baixar manualmente:
    echo https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
    exit
)

echo.
echo Download concluido!
echo.

:start_tunnel
echo ========================================
echo INICIANDO TUNEL...
echo ========================================
echo.
echo IMPORTANTE:
echo - Uma URL sera gerada (exemplo: https://abc-123.trycloudflare.com)
echo - Copie essa URL e use no celular
echo - Mantenha esta janela aberta
echo.
echo Iniciando em 3 segundos...
timeout /t 3 /nobreak >nul

echo.
cloudflared.exe tunnel --url http://localhost:3020

pause
