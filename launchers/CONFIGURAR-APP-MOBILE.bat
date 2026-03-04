@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  📱 CONFIGURAR APP MOBILE PARA FUNCIONAR SEM PC LIGADO    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🎯 Este script vai configurar o sistema para usar Supabase
echo    (banco de dados na nuvem) para que o app mobile funcione
echo    24/7 sem depender do PC estar ligado.
echo.
echo ⚠️  REQUISITOS:
echo    1. VPN ativa (Cloudflare WARP, ProtonVPN, etc)
echo    OU
echo    2. Hotspot do celular conectado
echo.
echo ═══════════════════════════════════════════════════════════
echo.

pause

echo.
echo 🔍 Passo 1: Testando conexão com Supabase...
echo.
node testar-conexao-supabase.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO: Não foi possível conectar ao Supabase!
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Instale e ative uma VPN:
    echo       • Cloudflare WARP: https://1.1.1.1/
    echo       • ProtonVPN: https://protonvpn.com/
    echo.
    echo    2. OU use hotspot do celular
    echo.
    echo    3. Execute este script novamente após ativar VPN
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Conexão com Supabase OK!
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 🚀 Passo 2: Migrando dados para Supabase...
echo    (Isso pode levar alguns minutos)
echo.

node migrar-local-para-supabase.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO na migração!
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
echo.
echo 📱 CONFIGURAR APP MOBILE:
echo.
echo    URL: https://bpsltnglmbwdpvumjeaf.supabase.co
echo    Tipo: Supabase (Nuvem)
echo.
echo 🎉 Agora o app funciona 24/7 sem o PC ligado!
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
