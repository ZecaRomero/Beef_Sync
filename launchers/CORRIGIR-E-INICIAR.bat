@echo off
chcp 65001 >nul
title Beef-Sync - Corrigir e Iniciar

echo.
echo ========================================================
echo   Corrigindo problemas e iniciando
echo ========================================================
echo.

REM 1. Matar processo na porta 3020
echo [1/3] Liberando porta 3020...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3020"') do (
  taskkill /F /PID %%a >nul 2>&1
  echo      Porta liberada.
)
timeout /t 2 /nobreak >nul
echo.

REM 2. Corrigir token do ngrok (foi salvo com "SEU_TOKEN" na frente)
echo [2/3] Corrigindo token do ngrok...
echo.
echo   O token foi salvo errado (com SEU_TOKEN na frente).
echo   Execute este comando com APENAS o token (copie do dashboard ngrok):
echo.
echo   ngrok config add-authtoken SEU_TOKEN_REAL
echo.
echo   Pegue em: https://dashboard.ngrok.com/get-started/your-authtoken
echo   Copie so o token, sem "SEU_TOKEN"
echo.
set /p TOKEN="Cole seu token do ngrok (so o token): "
if not "%TOKEN%"=="" (
  ngrok config add-authtoken %TOKEN%
  echo Token atualizado!
) else (
  echo Pulado. Execute manualmente: ngrok config add-authtoken SEU_TOKEN
)
echo.

REM 3. Iniciar
echo [3/3] Iniciando servidor e ngrok...
echo.
start "Beef-Sync" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 10 /nobreak >nul
start "ngrok" cmd /k "cd /d "%~dp0" && ngrok http 3020"

echo.
echo ========================================================
echo   PRONTO! Copie a URL da janela ngrok e acesse /a no celular
echo ========================================================
pause
