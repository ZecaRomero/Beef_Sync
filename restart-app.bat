@echo off
echo ========================================
echo  Reiniciando Beef Sync na porta 8081
echo ========================================
echo.

echo [1/3] Parando aplicacao...
pm2 stop beef-sync

echo.
echo [2/3] Iniciando aplicacao na porta 8081...
pm2 start ecosystem.config.cjs

echo.
echo [3/3] Verificando status...
pm2 status

echo.
echo ========================================
echo  Aplicacao reiniciada com sucesso!
echo  Acesse: http://187.77.238.142:8081
echo ========================================
echo.
echo Pressione qualquer tecla para ver os logs...
pause > nul
pm2 logs beef-sync --lines 50
