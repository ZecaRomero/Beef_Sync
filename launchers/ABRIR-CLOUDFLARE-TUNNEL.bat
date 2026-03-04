@echo off
title Cloudflare Tunnel - Beef-Sync
color 0A

echo ========================================
echo CLOUDFLARE TUNNEL - BEEF-SYNC
echo ========================================
echo.
echo Iniciando tunel para porta 3020...
echo.
echo IMPORTANTE:
echo - A URL gerada sera exibida abaixo
echo - Copie a URL que comeca com https://
echo - Use essa URL no celular
echo - Sem limite de banda!
echo - Gratuito para sempre!
echo.
echo ========================================
echo.

REM Verificar se cloudflared existe
if not exist cloudflared.exe (
    echo ERRO: cloudflared.exe nao encontrado!
    echo Execute primeiro: INSTALAR-CLOUDFLARE-TUNNEL.bat
    echo.
    pause
    exit
)

REM Iniciar o túnel
cloudflared.exe tunnel --url http://localhost:3020

pause
