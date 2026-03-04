@echo off
chcp 65001 >nul
title Beef-Sync - Acesso pela Internet (ngrok)

echo.
echo ========================================================
echo   Beef-Sync - Acesso pelo celular VIA INTERNET
echo ========================================================
echo.
echo   Usando ngrok para expor o app na internet
echo   O celular pode estar em 4G ou em qualquer Wi-Fi
echo.
echo ========================================================
echo.
echo   IMPORTANTE: Configure o ngrok primeiro!
echo   Leia o arquivo ACESSO-INTERNET.md
echo.
echo   1. Conta em ngrok.com
echo   2. npm install -g ngrok
echo   3. ngrok config add-authtoken SEU_TOKEN
echo.
echo ========================================================
echo.
echo   Abrindo dois terminais:
echo   - Terminal 1: servidor Next.js (porta 3020)
echo   - Terminal 2: ngrok (após 8 segundos)
echo.
echo ========================================================
echo.

REM Iniciar o servidor Next.js em uma nova janela
start "Beef-Sync Servidor" cmd /k "cd /d "%~dp0" && npm run dev"

REM Aguardar o servidor subir
echo Aguardando servidor iniciar (8 segundos)...
timeout /t 8 /nobreak >nul

REM Iniciar ngrok em outra janela
start "ngrok - URL pública" cmd /k "cd /d "%~dp0" && ngrok http 3020"

echo.
echo Pronto! Duas janelas foram abertas.
echo Na janela do ngrok, copie a URL https://....ngrok-free.app
echo No celular, acesse: [URL]/a
echo.
pause
