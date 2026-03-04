@echo off
echo ========================================
echo  CRIAR TABELA DE FEEDBACKS
echo ========================================
echo.

echo Executando SQL no banco de dados...
echo.

REM Ajuste as credenciais conforme seu banco
set PGPASSWORD=postgres
psql -U postgres -d beef_sync -f criar-tabela-feedbacks.sql

echo.
echo ========================================
echo  CONCLUIDO!
echo ========================================
echo.
echo Agora tente enviar o feedback novamente.
echo.
pause
