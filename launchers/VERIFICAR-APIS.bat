@echo off
chcp 65001 >nul
cls

echo.
echo ═══════════════════════════════════════════════════════════
echo    BEEF-SYNC - VERIFICAÇÃO DE APIS
echo    Sistema de Gestão Pecuária
echo ═══════════════════════════════════════════════════════════
echo.

echo [INFO] Iniciando verificação das APIs...
echo.

node scripts\verificar-apis.js

if errorlevel 1 (
    echo.
    echo [ERRO] Algumas verificações falharam!
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo [SUCESSO] Todas as verificações passaram!
    echo.
    pause
    exit /b 0
)

