@echo off
chcp 65001 >nul
title Verificar RGs Faltantes

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🔍 VERIFICAR RGs FALTANTES POR SÉRIE                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📋 Este script vai:
echo    1. Analisar todas as séries cadastradas
echo    2. Identificar RGs faltantes em cada série
echo    3. Gerar relatório em Excel e JSON
echo.

pause

echo.
echo 🔄 Executando análise...
echo.

node verificar-rgs-faltantes.js

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Análise concluída!
echo.
echo 📄 Arquivos gerados:
echo    - relatorio-rgs-faltantes-YYYY-MM-DD.xls
echo    - relatorio-rgs-faltantes-YYYY-MM-DD.json
echo.
echo 💡 Abra o arquivo Excel para ver o relatório completo.
echo.
pause
