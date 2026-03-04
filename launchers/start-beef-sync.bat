@echo off
title BEEF SYNC - Sistema de Gestao Bovina - PORTA 3020
echo ===============================================
echo BEEF SYNC - Sistema de Gestao Bovina
echo PORTA FIXA: 3020
echo ===============================================
echo.
echo Verificando se o servidor esta rodando...

cd /d "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _x"

:: Verificar se ja esta rodando na porta 3020
netstat -an | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 (
    echo Servidor ja esta rodando na porta 3020!
    echo Abrindo navegador...
    start http://localhost:3020
    goto :end
)

echo Iniciando servidor Next.js na porta 3020...
start /min cmd /c "npm run dev"

echo Aguardando servidor inicializar...
timeout /t 8 /nobreak >nul

echo Abrindo navegador na porta 3020...
start http://localhost:3020

:end
echo.
echo ===============================================
echo Sistema iniciado com sucesso!
echo URL FIXA: http://localhost:3020
echo ===============================================
echo Mantenha esta janela aberta enquanto usar o sistema.
echo.
pause