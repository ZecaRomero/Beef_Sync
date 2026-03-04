@echo off
title Instalar LocalTunnel
color 0E

echo ========================================
echo INSTALANDO LOCALTUNNEL
echo ========================================
echo.
echo LocalTunnel e:
echo - Gratuito para sempre
echo - SEM limite de banda
echo - SEM limite de conexoes
echo - Muito simples de usar
echo.
echo Instalando via npm...
echo.

npm install -g localtunnel

if errorlevel 1 (
    echo.
    echo ERRO: Falha na instalacao
    echo Verifique se o Node.js/npm esta instalado
    echo.
    pause
    exit
)

echo.
echo ========================================
echo INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Agora execute: ABRIR-LOCALTUNNEL.bat
echo.
pause
