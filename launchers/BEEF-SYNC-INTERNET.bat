@echo off
chcp 65001 >nul
title Beef Sync - Acesso pela Internet
set "BRAVE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
if not exist "%BRAVE%" set "BRAVE=%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"

echo.
echo ========================================
echo   BEEF SYNC - Acesso pela Internet
echo ========================================
echo.
echo   O celular pode acessar por 4G/5G ou
echo   qualquer rede - nao precisa da mesma WiFi!
echo.

cd /d "%~dp0"

REM Verificar se servidor esta rodando
netstat -an | findstr :3020 | findstr LISTENING >nul
if errorlevel 1 (
    echo Iniciando servidor...
    if not exist "node_modules" (
        echo Instalando dependencias...
        npm install
    )
    start "Beef Sync Server" cmd /c "npm run dev:network"
    echo Aguardando servidor (15 segundos)...
    timeout /t 15 /nobreak >nul
) else (
    echo Servidor ja esta rodando.
)

echo.
echo ========================================
echo   Criando tunnel para internet...
echo ========================================
echo.
echo Aguarde - em alguns segundos aparecera a URL.
echo.
echo No celular: abra a URL que aparecer abaixo.
echo Para tela mobile: adicione /a no final (ex: https://xxx.loca.lt/a)
echo.
echo NOTA: Na primeira vez, o localtunnel pode pedir seu IP - digite e clique Continue.
echo.

start "" "%BRAVE%" "http://localhost:3020"

npx localtunnel --port 3020

echo.
echo Tunnel encerrado. Pressione uma tecla para fechar.
pause >nul
