@echo off
chcp 65001 >nul
title Migrar dados para o Neon

echo.
echo ========================================================
echo   Migração automática para o Neon
echo ========================================================
echo.
echo Abrindo Neon Console para copiar a connection string...
start https://console.neon.tech
echo.
echo Cole a connection string do Neon (Connection details):
set /p DATABASE_URL="> "
echo.
if "%DATABASE_URL%"=="" (
  echo Nenhuma URL informada. Adicione DATABASE_URL no .env e execute: npm run db:migrar-neon
  pause
  exit /b 1
)
echo.
echo Executando migração...
echo.
call npm run db:migrar-neon
echo.
pause
