@echo off
title Atualizando Atalhos - Porta 3020
echo ===============================================
echo  ATUALIZANDO ATALHOS PARA PORTA 3020
echo ===============================================
echo.
echo Este script vai:
echo ✅ Padronizar TODOS os atalhos para porta 3020
echo ✅ Remover atalhos antigos (porta 3000)
echo ✅ Criar novos atalhos atualizados
echo.
echo Pressione qualquer tecla para continuar...
pause >nul
echo.

echo Executando atualizacao...
cscript //nologo atualizar-atalhos-porta-3020.vbs

echo.
echo ===============================================
echo ✅ ATALHOS ATUALIZADOS COM SUCESSO!
echo.
echo Novos atalhos na area de trabalho:
echo 🔗 Beef Sync (Porta 3020) - Acesso local
echo 🔗 Beef Sync (Rede - Porta 3020) - Acesso rede
echo.
echo 🎯 PORTA PADRONIZADA: 3020
echo 📊 Funcionalidades de contabilidade incluidas!
echo.
echo Agora todos os atalhos sempre abrirao na porta 3020!
echo ===============================================
echo.
pause