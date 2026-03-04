@echo off
title Unificar Atalhos - Beef Sync
echo ===============================================
echo     UNIFICANDO ATALHOS BEEF SYNC
echo ===============================================
echo.
echo Este script vai:
echo ✅ Remover TODOS os atalhos antigos
echo ✅ Criar APENAS UM atalho unificado
echo ✅ Limpar duplicatas
echo.
echo Pressione qualquer tecla para continuar...
pause >nul
echo.

echo Removendo atalhos antigos...
cscript //nologo criar-atalho-unificado.vbs

echo.
echo ===============================================
echo ✅ ATALHOS UNIFICADOS COM SUCESSO!
echo.
echo Agora você tem apenas UM ícone na área de trabalho:
echo 🔗 Beef Sync
echo.
echo Este atalho funciona para:
echo • Acesso local (localhost:3020)
echo • Acesso em rede (192.168.x.x:3020)
echo.
echo 🎯 PORTA PADRONIZADA: 3020
echo ===============================================
echo.
pause

