@echo off
title Beef-Sync - Inicializacao Completa
color 0A

echo ========================================
echo BEEF-SYNC - INICIALIZACAO COMPLETA
echo ========================================
echo.
echo Este script vai:
echo 1. Iniciar o servidor Beef-Sync
echo 2. Iniciar o Cloudflare Tunnel
echo 3. Abrir localhost no navegador
echo 4. Abrir URL do celular no navegador
echo.
echo ========================================
echo.

REM Verificar se cloudflared existe
if not exist cloudflared.exe (
    echo ERRO: cloudflared.exe nao encontrado!
    echo Execute primeiro: INSTALAR-CLOUDFLARE-TUNNEL.bat
    echo.
    pause
    exit
)

echo [1/4] Iniciando Beef-Sync...
start "Beef-Sync Server" cmd /c "title Beef-Sync Server && color 0B && npm run dev"

echo Aguardando servidor iniciar (35 segundos)...
timeout /t 35 /nobreak >nul

echo.
echo [2/4] Abrindo localhost:3020 no navegador...
start http://localhost:3020

timeout /t 3 /nobreak >nul

echo.
echo [3/4] Iniciando Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /c "title Cloudflare Tunnel && color 0A && cloudflared.exe tunnel --url http://localhost:3020"

echo Aguardando tunnel iniciar (10 segundos)...
timeout /t 10 /nobreak >nul

echo.
echo [4/4] Tentando abrir URL do celular...

REM Tentar obter a URL do Cloudflare
curl -s http://127.0.0.1:4040/api/tunnels > tunnel_temp.json 2>nul

if exist tunnel_temp.json (
    for /f "tokens=*" %%a in ('findstr /C:"https://" tunnel_temp.json') do (
        set "tunnel_line=%%a"
        goto :found
    )
    :found
    del tunnel_temp.json
)

echo.
echo ========================================
echo BEEF-SYNC INICIADO COM SUCESSO!
echo ========================================
echo.
echo Acesso LOCAL (este computador):
echo   http://localhost:3020
echo.
echo Acesso CELULAR:
echo   Verifique a janela "Cloudflare Tunnel"
echo   Copie a URL que comeca com https://
echo.
echo IMPORTANTE:
echo - Mantenha as janelas abertas
echo - Use a URL do Cloudflare no celular
echo.
echo ========================================

pause
