@echo off
title Beef Sync - Reiniciando Aplicacao
echo.
echo ========================================
echo    BEEF SYNC - Sistema de Gestao
echo ========================================
echo.

cd /d "%~dp0"

echo Parando processos anteriores na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Aguardando 2 segundos...
timeout /t 2 /nobreak > nul

echo Iniciando servidor de desenvolvimento...
echo.
echo A aplicacao sera aberta em: http://localhost:3000
echo.
echo Aguarde 3 segundos para o servidor inicializar...
timeout /t 3 /nobreak > nul

echo Abrindo navegador...
start http://localhost:3000

echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

npm run dev

pause
