@echo off
echo ========================================
echo INSTALADOR CLOUDFLARE TUNNEL
echo ========================================
echo.
echo Baixando cloudflared...
echo.

REM Baixar cloudflared para Windows
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"

if exist cloudflared.exe (
    echo.
    echo ========================================
    echo INSTALACAO CONCLUIDA!
    echo ========================================
    echo.
    echo Agora execute: ABRIR-CLOUDFLARE-TUNNEL.bat
    echo.
    pause
) else (
    echo.
    echo ERRO: Nao foi possivel baixar o cloudflared
    echo Tente baixar manualmente de: https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
)
