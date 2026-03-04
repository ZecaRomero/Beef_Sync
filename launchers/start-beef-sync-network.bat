@echo off
title Beef Sync - Iniciar Servidor para Rede
echo.
echo ========================================
echo    BEEF SYNC - Acesso em Rede Local
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar dependências
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    echo Dependencias instaladas!
    echo.
)

echo Descobrindo IP local...
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select -ExpandProperty IPAddress | Select -First 1)"') do set IP=%%i
if "%IP%"=="" set IP=localhost

echo Iniciando servidor acessivel na rede...
echo Local:   http://localhost:3020
echo Rede:    http://%IP%:3020
echo.

echo Criando atalho de rede na Area de Trabalho...
cscript //nologo create-network-shortcut.vbs
echo Atalho criado.
echo.

echo Subindo servidor de desenvolvimento (PORTA FIXA: 3020)...
start "Beef Sync Dev Server" cmd /c npm run dev:network

echo Aguardando servidor ficar online (ate 60s)...
powershell -NoProfile -Command "$limit=60; for($i=0;$i -lt $limit;$i++){ if((Test-NetConnection -ComputerName localhost -Port 3020).TcpTestSucceeded){ exit 0 } Start-Sleep -Seconds 1 }; exit 1"
if %errorlevel%==0 (
    echo ✅ Servidor online!
    echo Local:   http://localhost:3020
    echo Rede:    http://%IP%:3020
    echo Abrindo navegador local...
    start http://localhost:3020
) else (
    echo ❌ Falha ao detectar servidor na porta 3020.
    echo Verifique logs na janela "Beef Sync Dev Server" e firewall.
)

echo.
echo Para encerrar, feche a janela do servidor ou pressione qualquer tecla aqui.
pause