@echo off
chcp 65001 >nul
title Beef-Sync - Acesso pelo Celular

echo.
echo ========================================================
echo   Beef-Sync - Acesso pelo Celular
echo ========================================================
echo.
echo 1. Conecte o celular na MESMA rede Wi-Fi do PC
echo 2. Descubra o IP do PC: digite ipconfig no terminal
echo    e procure "IPv4" ou "Endereço IPv4"
echo 3. No celular, abra: http://[SEU_IP]:3020/a
echo.
echo    Executando "npm run ip" para mostrar seu IP...
call npm run ip
echo.
echo ========================================================
echo   Iniciando servidor na rede...
echo ========================================================
echo.

npm run dev:network
