@echo off
title Abrindo Beef-Sync nos Navegadores
color 0A

echo ========================================
echo ABRINDO BEEF-SYNC NOS NAVEGADORES
echo ========================================
echo.

REM Abrir localhost:3020 no navegador padrão
echo Abrindo localhost:3020...
start http://localhost:3020

REM Aguardar 2 segundos
timeout /t 2 /nobreak >nul

REM Abrir o domínio ngrok (substitua pela sua URL)
echo Abrindo domínio ngrok...
start https://beefsync-ngrok.app

echo.
echo ========================================
echo Navegadores abertos com sucesso!
echo ========================================
echo.
echo Se o ngrok não abrir, verifique:
echo 1. Se o ngrok está rodando
echo 2. Se a URL está correta no arquivo .bat
echo.

pause
