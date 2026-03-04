@echo off
title Serveo - Beef-Sync
color 0A

echo ========================================
echo SERVEO - BEEF-SYNC
echo ========================================
echo.
echo Serveo e a solucao mais simples:
echo - Nao precisa instalar nada
echo - Usa SSH (ja vem no Windows)
echo - SEM senha
echo - SEM limite de banda
echo - Gratuito
echo.
echo Iniciando tunel para porta 3020...
echo.
echo IMPORTANTE:
echo - Certifique-se que o Beef-Sync esta rodando
echo - A URL sera gerada abaixo (exemplo: https://abc.serveo.net)
echo - Copie e use no celular
echo.
echo ========================================
echo.

ssh -R 80:localhost:3020 serveo.net

if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel conectar ao Serveo
    echo.
    echo Tente novamente ou use outra solucao
    echo.
)

pause
