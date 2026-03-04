@echo off
title Beef Sync - Sistema Unificado
set "BRAVE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
if not exist "%BRAVE%" set "BRAVE=%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"
echo.
echo ========================================
echo    BEEF SYNC - Sistema de Gestao
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar se o servidor já está rodando
netstat -an | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 (
    echo ✅ Servidor já está rodando na porta 3020!
    echo.
    
    REM Descobrir IP local para exibir
    for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select -ExpandProperty IPAddress | Select -First 1)"') do set IP=%%i
    if "%IP%"=="" set IP=localhost
    
    echo 🌐 URLs disponíveis:
    echo    • Local:   http://localhost:3020
    echo    • Celular: http://%IP%:3020/a
    echo.
    echo Abrindo navegador Brave...
    start "" "%BRAVE%" "http://localhost:3020"
    start "" "%BRAVE%" --new-window --window-size=390,844 "http://localhost:3020/a"
    goto :end
)

REM Verificar dependências
if not exist "node_modules" (
    echo ⚙️ Instalando dependências...
    npm install
    echo ✅ Dependências instaladas!
    echo.
)

REM Descobrir IP local
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select -ExpandProperty IPAddress | Select -First 1)"') do set IP=%%i
if "%IP%"=="" set IP=localhost

echo 🚀 Iniciando servidor na porta 3020...
echo.
echo 🌐 URLs que estarão disponíveis:
echo    • Local:   http://localhost:3020
echo    • Celular: http://%IP%:3020/a
echo.
echo 📱 No celular: conecte na MESMA WiFi e abra o link acima
echo.
echo 📌 O sistema detecta automaticamente o tipo de acesso:
echo    • localhost = Acesso total (Zeca)
echo    • 192.168.x.x = Acesso limitado (Rede)
echo.

REM Iniciar servidor (dev:network = aceita celular na mesma WiFi)
start "Beef Sync Server" cmd /c "npm run dev:network"

echo ⏳ Aguardando servidor inicializar...
timeout /t 8 /nobreak >nul

REM Tentar verificar se está online
powershell -NoProfile -Command "$limit=15; for($i=0;$i -lt $limit;$i++){ if((Test-NetConnection -ComputerName localhost -Port 3020 -InformationLevel Quiet -WarningAction SilentlyContinue)){ exit 0 } Start-Sleep -Seconds 1 }; exit 1" >nul 2>&1

if %errorlevel%==0 (
    echo ✅ Servidor online!
    echo.
    echo 🌐 Abrindo navegador Brave...
    start "" "%BRAVE%" "http://localhost:3020"
    start "" "%BRAVE%" --new-window --window-size=390,844 "http://localhost:3020/a"
    echo.
    echo ========================================
    echo ✅ Sistema iniciado com sucesso!
    echo.
    echo 📌 Acesso disponível em:
    echo    • Local:   http://localhost:3020
    echo    • Celular: http://%IP%:3020/a
    echo.
    echo 🔐 Permissões:
    echo    • localhost = Acesso total (pode excluir, backup, etc)
    echo    • Rede = Acesso limitado (só incluir e alterar)
    echo ========================================
) else (
    echo ⚠️ Servidor pode estar iniciando...
    echo    Abrindo navegador (aguarde alguns segundos se necessário)
    start "" "%BRAVE%" "http://localhost:3020"
    start "" "%BRAVE%" --new-window --window-size=390,844 "http://localhost:3020/a"
    echo.
    echo ⏳ Se a página não carregar, aguarde alguns segundos.
    echo    O servidor está iniciando em segundo plano.
)

:end
echo.
echo 💡 Dica: O servidor roda em segundo plano.
echo    Para encerrar, feche a janela "Beef Sync Server".
echo.
pause

