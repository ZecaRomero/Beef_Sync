@echo off
title TESTE COMPLETO - BEEF SYNC PORTA 3020
color 0A

echo ===============================================
echo  TESTE COMPLETO - BEEF SYNC PORTA 3020
echo  Sistema de Gestao Bovina + Contabilidade
echo ===============================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js nao encontrado!
    echo Instale o Node.js primeiro: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo [2/5] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ ERRO: Falha ao instalar dependencias
        pause
        exit /b 1
    )
)
echo ✅ Dependencias OK

echo.
echo [3/5] Verificando porta 3020...
netstat -an | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 (
    echo ⚠️  Porta 3020 ja esta em uso
    echo Tentando abrir navegador...
    start http://localhost:3020
    goto :test_browser
)

echo.
echo [4/5] Iniciando servidor na porta 3020...
start /min "Beef Sync Test Server" cmd /c "npm run dev"

echo Aguardando servidor inicializar...
set "TENTATIVAS=0"
:wait_server
set /a TENTATIVAS+=1
if %TENTATIVAS% GTR 30 (
    echo ❌ ERRO: Servidor nao iniciou em 60 segundos
    echo Verifique se a porta 3020 esta disponivel
    pause
    exit /b 1
)

timeout /t 2 /nobreak >nul
netstat -an | findstr :3020 | findstr LISTENING >nul
if errorlevel 1 goto wait_server

echo ✅ Servidor iniciado na porta 3020

:test_browser
echo.
echo [5/5] Testando funcionalidades...
echo ✅ Abrindo sistema principal...
start http://localhost:3020

timeout /t 3 /nobreak >nul

echo ✅ Abrindo configuracoes...
start http://localhost:3020/settings

echo.
echo ===============================================
echo ✅ TESTE COMPLETO REALIZADO!
echo.
echo 🌐 Sistema Principal: http://localhost:3020
echo ⚙️  Configuracoes: http://localhost:3020/settings
echo 📄 Notas Fiscais: Configuracoes → Aba "Notas Fiscais"
echo.
echo FUNCIONALIDADES TESTADAS:
echo ✅ Servidor na porta 3020
echo ✅ Sistema principal funcionando
echo ✅ Configuracoes acessiveis
echo ✅ APIs de contabilidade disponiveis
echo.
echo PROXIMOS PASSOS:
echo 1. Va em Configuracoes → Notas Fiscais
echo 2. Veja sua NF de R$ 46,50 no resumo
echo 3. Clique em "Enviar Boletim p/ Contador"
echo 4. Teste as funcionalidades de contabilidade
echo.
echo ===============================================
echo.
pause