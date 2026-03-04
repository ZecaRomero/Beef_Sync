@echo off
chcp 65001 >nul
title Executar Migração no Neon

echo.
echo ========================================================
echo   Migração Neon - 3 passos rápidos
echo ========================================================
echo.
echo Passo 1: Abrindo Neon Console (SQL Editor)...
start https://console.neon.tech
timeout /t 2 /nobreak >nul
echo.
echo Passo 2: Abrindo o script SQL para copiar...
start "" "%~dp0scripts\neon-migracao-minima.sql"
echo.
echo Passo 3: No Neon Console:
echo   - Clique em "SQL Editor"
echo   - Selecione o projeto beef-sync e database neondb
echo   - Copie TODO o conteúdo do arquivo neon-migracao-minima.sql
echo   - Cole no editor e clique em "Run"
echo.
echo Depois teste em: https://beef-sync-2.vercel.app/a
echo   Série: CJCJ   RG: 15563
echo.
echo ========================================================
pause
