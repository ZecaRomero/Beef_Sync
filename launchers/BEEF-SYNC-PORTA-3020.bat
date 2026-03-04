@echo off
title BEEF SYNC - PORTA FIXA 3020 - Sistema de Gestao Bovina
color 0A

echo ===============================================
echo    BEEF SYNC - PORTA FIXA 3020
echo    Sistema de Gestao Bovina + Contabilidade
echo ===============================================
echo.
echo ✅ PORTA PADRONIZADA: 3020
echo ✅ Novas funcionalidades de contabilidade
echo ✅ Sistema de notas fiscais integrado
echo.

:: Navegar para o diretorio do projeto
cd /d "%~dp0"

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
    echo Dependencias instaladas!
    echo.
)

:: Verificar se a porta 3020 ja esta em uso
echo Verificando porta 3020...
netstat -an | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 (
    echo ✅ Servidor ja esta rodando na porta 3020!
    echo Abrindo navegador...
    start http://localhost:3020
    echo.
    echo Para acessar as novas funcionalidades:
    echo 👉 Clique em "Configuracoes" no menu
    echo 👉 Va na aba "Notas Fiscais"
    echo.
    goto :end
)

echo Iniciando servidor na porta 3020...
echo Por favor, aguarde...

:: Iniciar o servidor (sempre porta 3020)
start /min "Beef Sync Server - Porta 3020" cmd /c "npm run dev"

:: Aguardar o servidor inicializar
echo Aguardando servidor inicializar na porta 3020...
set "TENTATIVAS=0"
:wait_loop
set /a TENTATIVAS+=1
if %TENTATIVAS% GTR 30 (
    echo ERRO: Servidor nao iniciou em 60 segundos.
    echo Verifique se a porta 3020 esta disponivel.
    pause
    exit /b 1
)

timeout /t 2 /nobreak >nul
netstat -an | findstr :3020 | findstr LISTENING >nul
if errorlevel 1 goto wait_loop

echo.
echo ✅ Servidor iniciado com sucesso na porta 3020!
echo ✅ Abrindo navegador...

:: Abrir o navegador
start http://localhost:3020

:end
echo.
echo ===============================================
echo ✅ Sistema BEEF SYNC rodando na PORTA 3020!
echo.
echo 🌐 URL: http://localhost:3020
echo 📊 Configuracoes: http://localhost:3020/settings
echo 📄 Notas Fiscais: Configuracoes → Notas Fiscais
echo.
echo IMPORTANTE: Nao feche esta janela!
echo O servidor precisa ficar rodando.
echo ===============================================
echo.
echo Pressione qualquer tecla para minimizar...
pause >nul

:: Minimizar a janela
powershell -command "(New-Object -ComObject Shell.Application).MinimizeAll()"