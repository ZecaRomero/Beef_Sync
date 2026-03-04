@echo off
chcp 65001 >nul
title Sincronizar localStorage com PostgreSQL

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🔄 SINCRONIZAR LOCALSTORAGE COM POSTGRESQL               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📋 INSTRUÇÕES:
echo.
echo 1. Abra o arquivo "extrair-localStorage.html" no navegador
echo 2. Clique em "Extrair Dados do localStorage"
echo 3. Um arquivo JSON será baixado
echo 4. Copie o nome do arquivo
echo 5. Execute este script novamente com o nome do arquivo
echo.

if "%~1"=="" (
    echo ⚠️  Nenhum arquivo especificado!
    echo.
    echo 💡 Uso: SINCRONIZAR-LOCALSTORAGE.bat arquivo.json
    echo.
    echo Exemplo:
    echo   SINCRONIZAR-LOCALSTORAGE.bat localStorage-backup-2026-02-11.json
    echo.
    pause
    exit /b 1
)

echo ✅ Arquivo especificado: %~1
echo.

if not exist "%~1" (
    echo ❌ Arquivo não encontrado: %~1
    echo.
    echo Verifique se o arquivo está na mesma pasta deste script.
    echo.
    pause
    exit /b 1
)

echo 🔄 Iniciando sincronização...
echo.

node sincronizar-localStorage.js "%~1"

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Processo concluído!
echo.
echo 💡 Próximos passos:
echo    1. Recarregue a página do Beef Sync (Ctrl+F5)
echo    2. Verifique se os dados aparecem
echo    3. Se tudo estiver OK, você pode limpar o localStorage
echo.
pause
