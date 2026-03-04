@echo off
echo ========================================
echo  INSTALACAO DO SISTEMA DE FEEDBACK
echo ========================================
echo.

echo [1/3] Instalando dependencias...
call npm install formidable
echo.

echo [2/3] Criando tabela no banco de dados...
node scripts/run-feedback-migration.js
echo.

echo [3/3] Verificando estrutura...
if not exist "public\uploads\feedback" mkdir "public\uploads\feedback"
echo.

echo ========================================
echo  INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Acesse:
echo - Mobile: http://localhost:3020/mobile-feedback
echo - Admin:  http://localhost:3020/admin/feedbacks
echo.
pause
