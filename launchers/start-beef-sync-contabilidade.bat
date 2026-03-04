@echo off
echo ========================================
echo  🐄 BEEF SYNC - SISTEMA DE CONTABILIDADE
echo ========================================
echo.
echo Iniciando servidor com novas funcionalidades:
echo ✅ Sistema de Notas Fiscais
echo ✅ Integração Contábil
echo ✅ Templates de Email
echo ✅ Relatórios Fiscais
echo ✅ Boletim para Contador
echo.
echo Servidor será iniciado em: http://localhost:3020
echo.
echo Aguarde...
echo.

cd /d "%~dp0"

echo Verificando dependências...
if not exist node_modules (
    echo Instalando dependências...
    npm install
)

echo.
echo Iniciando servidor Next.js...
echo.
echo ⚠️  IMPORTANTE: Acesse http://localhost:3020/settings
echo    e vá na aba "Notas Fiscais" para ver as novas funcionalidades!
echo.

npm run dev

pause