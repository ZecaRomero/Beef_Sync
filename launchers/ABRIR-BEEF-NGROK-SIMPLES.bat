@echo off
title Beef-Sync + ngrok
color 0A

echo ========================================
echo BEEF-SYNC + NGROK
echo ========================================
echo.
echo Iniciando ngrok na porta 3020...
echo.
echo IMPORTANTE:
echo - Certifique-se que o Beef-Sync esta rodando (npm run dev)
echo - A URL sera gerada abaixo
echo - Copie a URL e use no celular
echo.
echo ========================================
echo.

ngrok http 3020

pause
