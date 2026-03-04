@echo off
title Abrindo Beef-Sync nos Navegadores (Auto)
color 0A

echo ========================================
echo ABRINDO BEEF-SYNC NOS NAVEGADORES
echo ========================================
echo.

REM Abrir localhost:3020
echo [1/2] Abrindo localhost:3020...
start http://localhost:3020
timeout /t 2 /nobreak >nul

REM Tentar obter a URL do ngrok automaticamente
echo [2/2] Obtendo URL do ngrok...
curl -s http://localhost:4040/api/tunnels > ngrok_temp.json 2>nul

if exist ngrok_temp.json (
    REM Extrair a URL pública do ngrok (simplificado)
    for /f "tokens=*" %%a in ('findstr /C:"public_url" ngrok_temp.json') do (
        set "ngrok_line=%%a"
        goto :found
    )
    :found
    
    REM Limpar e extrair apenas a URL
    set "ngrok_line=%ngrok_line:*https://=%"
    set "ngrok_url=https://%ngrok_line:~0,50%"
    set "ngrok_url=%ngrok_url:"=%"
    set "ngrok_url=%ngrok_url:,=%"
    
    echo URL do ngrok encontrada!
    echo Abrindo: %ngrok_url%
    start %ngrok_url%
    
    del ngrok_temp.json
) else (
    echo.
    echo AVISO: Não foi possível detectar a URL do ngrok automaticamente.
    echo.
    echo Verifique se:
    echo - O ngrok está rodando
    echo - A interface web do ngrok está em http://localhost:4040
    echo.
    echo Abrindo interface do ngrok para você copiar a URL...
    start http://localhost:4040
)

echo.
echo ========================================
echo Concluído!
echo ========================================
echo.

pause
