@echo off
title BEEF SYNC - Iniciando Servidor
echo ===============================================
echo BEEF SYNC - Iniciando Servidor na Porta 3020
echo ===============================================
echo.

cd /d "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _x"

echo Verificando Node.js...
node --version

echo.
echo Iniciando servidor Next.js...
npx next dev -p 3020

pause
