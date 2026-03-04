@echo off
title Ver URL do Cloudflare Tunnel
color 0B

echo ========================================
echo URL DO CLOUDFLARE TUNNEL
echo ========================================
echo.
echo Verificando tunel ativo...
echo.

REM Tentar pegar a URL da API local do cloudflared
curl -s http://localhost:60000/metrics 2>nul | findstr "userHostname" 

if errorlevel 1 (
    echo.
    echo NENHUM TUNEL ATIVO ENCONTRADO!
    echo.
    echo Execute primeiro: ABRIR-CLOUDFLARE-TUNNEL.bat
    echo.
) else (
    echo.
    echo ========================================
    echo Use a URL acima no seu celular
    echo ========================================
    echo.
)

pause
