@echo off
title LocalTunnel - Beef-Sync (Sem Senha)
color 0A

echo ========================================
echo LOCALTUNNEL - BEEF-SYNC
echo ========================================
echo.
echo Iniciando tunel SEM senha...
echo.
echo IMPORTANTE:
echo - Certifique-se que o Beef-Sync esta rodando
echo - A URL sera gerada abaixo
echo - Copie a URL completa
echo - Acesse direto no celular (sem senha)
echo.
echo ========================================
echo.

REM Iniciar LocalTunnel sem subdomínio fixo (sem senha)
lt --port 3020

pause
