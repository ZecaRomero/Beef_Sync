@echo off
title Beef-Sync + ngrok - Inicializacao Completa
color 0A

echo ========================================
echo BEEF-SYNC + NGROK - COMPLETO
echo ========================================
echo.
echo Este script vai:
echo 1. Iniciar o servidor Beef-Sync
echo 2. Iniciar o ngrok com dominio personalizado
echo 3. Abrir localhost:3020 no navegador
echo 4. Abrir www.beefsync.ngrok.app no navegador
echo.
echo ========================================
echo.

echo [1/4] Iniciando Beef-Sync...
start "Beef-Sync Server" cmd /c "title Beef-Sync Server && color 0B && npm run dev"

echo Aguardando servidor iniciar (35 segundos)...
timeout /t 35 /nobreak >nul

echo.
echo [2/4] Iniciando ngrok com dominio personalizado...
start "ngrok" cmd /c "title ngrok - beefsync.ngrok.app && color 0A && ngrok http 3020 --domain=beefsync.ngrok.app"

echo Aguardando ngrok conectar (8 segundos)...
timeout /t 8 /nobreak >nul

echo.
echo [3/4] Abrindo localhost:3020 no navegador...
start http://localhost:3020

timeout /t 2 /nobreak >nul

echo.
echo [4/4] Abrindo dominio ngrok no navegador...
start https://beefsync.ngrok.app

echo.
echo ========================================
echo BEEF-SYNC INICIADO COM SUCESSO!
echo ========================================
echo.
echo Acesso LOCAL (este computador):
echo   http://localhost:3020
echo.
echo Acesso CELULAR (internet):
echo   https://beefsync.ngrok.app
echo   https://beefsync.ngrok.app/a
echo.
echo IMPORTANTE:
echo - Mantenha as 2 janelas abertas
echo - Use o dominio ngrok no celular
echo - Funciona em qualquer rede (4G/Wi-Fi)
echo.
echo ========================================

pause
