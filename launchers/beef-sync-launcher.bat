@echo off
title BEEF SYNC - Sistema de Gestao Bovina
color 0A

echo ===============================================
echo    BEEF SYNC - Sistema de Gestao Bovina
echo ===============================================
echo.

:: Navegar para o diretorio do projeto
cd /d "C:\Users\zeca8\Documents\Sistemas\Beef-Sync_TOP _x"

:: Verificar se o Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

:: Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

:: Verificar se a porta 3020 ja esta em uso
set "PORT_FOUND="
netstat -an | findstr :3020 | findstr LISTENING >nul && set "PORT_FOUND=3020"
if defined PORT_FOUND (
    echo Servidor ja esta rodando na porta %PORT_FOUND%!
    echo Abrindo navegador...
    start http://localhost:%PORT_FOUND%
    goto :end
)

echo Iniciando servidor de desenvolvimento...
echo Por favor, aguarde...

:: Iniciar o servidor em segundo plano (FIXO NA PORTA 3020)
start /min "Beef Sync Server" cmd /c "npm run dev"

:: Aguardar o servidor inicializar (porta 3020)
echo Aguardando servidor inicializar...
set "PORT_FOUND="
for /L %%i in (1,1,30) do (
    timeout /t 2 /nobreak >nul
    if not defined PORT_FOUND (
        netstat -an | findstr :3020 | findstr LISTENING >nul && set "PORT_FOUND=3020"
    )
    if defined PORT_FOUND goto server_ready
)

:server_ready

echo.
echo ✓ Servidor iniciado com sucesso!
echo ✓ Abrindo navegador...

:: Abrir o navegador na porta detectada
if not defined PORT_FOUND set "PORT_FOUND=3020"
start http://localhost:%PORT_FOUND%

:end
echo.
echo ===============================================
echo Sistema BEEF SYNC esta rodando!
echo URL: http://localhost:3020
echo.
echo IMPORTANTE: Nao feche esta janela!
echo O servidor precisa ficar rodando em segundo plano.
echo ===============================================
echo.
echo Pressione qualquer tecla para minimizar esta janela...
pause >nul

:: Minimizar a janela
powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"