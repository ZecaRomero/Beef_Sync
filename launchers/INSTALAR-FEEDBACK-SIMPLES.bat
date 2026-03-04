@echo off
echo ========================================
echo  INSTALACAO DO SISTEMA DE FEEDBACK
echo ========================================
echo.

echo Criando tabela no banco de dados...
echo.

curl -X POST http://localhost:3020/api/setup-feedback

echo.
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
