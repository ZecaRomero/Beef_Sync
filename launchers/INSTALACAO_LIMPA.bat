@echo off
setlocal enabledelayedexpansion
title Instalador Beef Sync - Instalacao Limpa

echo ===============================================================================
echo                INSTALADOR AUTOMATICO BEEF SYNC - INSTALACAO LIMPA
echo ===============================================================================
echo.
echo Este script ira ajudar a configurar o ambiente apos uma formatacao do PC.
echo.

:: 1. Verificar Node.js
echo [1/5] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js NAO encontrado!
    echo.
    echo Por favor, instale o Node.js (versao LTS recomendada) antes de continuar.
    echo O site oficial ira abrir em seu navegador...
    timeout /t 3
    start https://nodejs.org/
    pause
    exit
) else (
    echo [V] Node.js instalado:
    node -v
)
echo.

:: 2. Verificar PostgreSQL
echo [2/5] Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] O comando 'psql' nao foi encontrado no PATH.
    echo Isso nao significa necessariamente que o PostgreSQL nao esta instalado,
    echo mas que nao esta acessivel via linha de comando.
    echo.
    echo Certifique-se de que o PostgreSQL esta instalado e rodando na porta 5432.
    echo Se voce ainda nao instalou, o site ira abrir...
    echo.
    set /p "INSTALL_PG=Deseja abrir o site do PostgreSQL agora? (S/N): "
    if /i "!INSTALL_PG!"=="S" (
        start https://www.postgresql.org/download/windows/
        echo Apos instalar, execute este script novamente.
        pause
        exit
    )
) else (
    echo [V] PostgreSQL client encontrado:
    psql --version
)
echo.

:: 3. Instalar dependencias do projeto
echo [3/5] Instalando pacotes do projeto (npm install)...
echo Isso pode levar alguns minutos...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [X] Erro ao instalar pacotes!
    echo Verifique sua conexao com a internet e tente novamente.
    pause
    exit
)
echo [V] Pacotes instalados com sucesso.
echo.

:: 4. Configurar variaveis de ambiente (.env)
echo [4/5] Configurando ambiente...
if not exist .env (
    echo Arquivo .env nao encontrado. Criando a partir do exemplo...
    copy .env.example .env
    echo.
    echo [!] IMPORTANTE: O arquivo .env foi criado com as configuracoes padrao.
    echo Se voce mudou a senha do banco de dados, precisara editar este arquivo.
    echo.
    echo O arquivo .env sera aberto para verificacao/edicao...
    timeout /t 2
    notepad .env
) else (
    echo Arquivo .env ja existe. Mantendo configuracao atual.
)
echo.

:: 5. Inicializar Banco de Dados
echo [5/5] Inicializando Banco de Dados...
echo Tentando criar tabelas e inserir dados iniciais...
call npm run setup
if %errorlevel% neq 0 (
    echo.
    echo [X] Erro na configuracao do banco de dados!
    echo Verifique se o PostgreSQL esta rodando e se as credenciais no .env estao corretas.
    pause
    exit
)
echo.

echo ===============================================================================
echo                      INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo.
echo O sistema esta pronto para uso.
echo.
set /p "START_APP=Deseja iniciar o sistema agora? (S/N): "
if /i "!START_APP!"=="S" (
    echo Iniciando o Beef Sync...
    npm run dev
) else (
    echo Voce pode iniciar o sistema depois executando 'BeefSync.bat' ou 'npm run dev'.
    pause
)
