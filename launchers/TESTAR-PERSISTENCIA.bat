@echo off
chcp 65001 >nul
echo ========================================
echo   TESTE DE PERSISTÊNCIA DE DADOS
echo   Beef Sync - PostgreSQL
echo ========================================
echo.
echo Este script irá:
echo   1. Criar tabela de nitrogênio (se não existir)
echo   2. Verificar todas as tabelas e dados
echo   3. Mostrar relatório completo
echo.
pause

echo.
echo 🔧 Passo 1: Criando tabela de nitrogênio...
echo.
node criar-tabela-nitrogenio.js

echo.
echo 🔍 Passo 2: Verificando persistência de dados...
echo.
node verificar-persistencia-dados.js

echo.
echo ========================================
echo   ✅ Teste concluído!
echo ========================================
echo.
echo 📄 Consulte o arquivo:
echo    GARANTIA-PERSISTENCIA-DADOS.md
echo.
echo    Para mais informações sobre como
echo    o sistema garante a persistência.
echo.
pause
