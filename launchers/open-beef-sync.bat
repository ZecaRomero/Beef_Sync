@echo off
title Beef Sync - Abrindo Aplicacao
echo.
echo ========================================
echo    BEEF SYNC - Sistema de Gestao
echo ========================================
echo.

echo Verificando se o servidor esta rodando...
netstat -an | findstr :3020 >nul
if %errorlevel% == 0 (
    echo Servidor encontrado na porta 3020!
    echo Abrindo navegador...
    start http://localhost:3020
    echo.
    echo ✅ Aplicacao aberta no navegador!
) else (
    echo ❌ Servidor nao encontrado na porta 3020.
    echo.
    echo Dica: para acesso em rede, use o script:
    echo       start-beef-sync-network.bat
    echo.
    echo Iniciando servidor local...
    call restart-beef-sync.bat
)

echo.
pause
