@echo off
title LocalTunnel - Beef-Sync
color 0A

echo ========================================
echo LOCALTUNNEL - BEEF-SYNC
echo ========================================
echo.
echo Iniciando tunel para porta 3020...
echo.
echo IMPORTANTE:
echo - Certifique-se que o Beef-Sync esta rodando
echo - A URL sera gerada abaixo
echo - Copie a URL completa
echo - Use no celular
echo.
echo ========================================
echo.

REM Iniciar LocalTunnel com subdomínio fixo
lt --port 3020 --subdomain beefsync2026

if errorlevel 1 (
    echo.
    echo Subdominio ja em uso, tentando sem subdominio fixo...
    echo.
    lt --port 3020
)

pause
