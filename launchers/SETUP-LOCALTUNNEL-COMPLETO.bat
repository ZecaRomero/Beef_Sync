@echo off
title Setup LocalTunnel - Beef-Sync
color 0E

echo ========================================
echo SETUP LOCALTUNNEL - BEEF-SYNC
echo ========================================
echo.
echo LocalTunnel e a solucao mais simples:
echo - Gratuito para sempre
echo - SEM limite de banda
echo - SEM limite de conexoes
echo - Instalacao rapida via npm
echo - URL fixa opcional
echo.
echo ========================================
echo.
pause

echo Verificando se LocalTunnel esta instalado...
echo.

where lt >nul 2>&1
if errorlevel 1 (
    echo LocalTunnel nao encontrado. Instalando...
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
    echo Instalacao concluida!
    echo.
) else (
    echo LocalTunnel ja esta instalado!
    echo.
)

echo ========================================
echo INICIANDO TUNEL...
echo ========================================
echo.
echo IMPORTANTE:
echo - Certifique-se que o Beef-Sync esta rodando (npm run dev)
echo - A URL sera gerada abaixo
echo - Copie a URL completa (exemplo: https://beefsync2026.loca.lt)
echo - Acesse no celular
echo.
echo Iniciando em 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo Tentando criar tunel com subdominio fixo: beefsync2026
echo.

lt --port 3020 --subdomain beefsync2026

if errorlevel 1 (
    echo.
    echo Subdominio ja em uso por outro usuario.
    echo Gerando URL aleatoria...
    echo.
    lt --port 3020
)

pause
