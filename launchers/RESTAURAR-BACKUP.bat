@echo off
chcp 65001 >nul
echo ========================================
echo   RESTAURAR BACKUP - BEEF SYNC
echo ========================================
echo.
echo Este script irá restaurar os backups:
echo   - SQL: backup_completo_2026-02-10 (1).sql
echo   - JSON: backup_completo_2026-02-10_12.json
echo.
echo ⚠️  ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais!
echo.
pause

echo.
echo 🔄 Iniciando restauração...
echo.

node restaurar-backup.js

echo.
echo ========================================
echo   Processo finalizado!
echo ========================================
echo.
pause
