# Script PowerShell para iniciar Beef Sync SEM mostrar janelas do CMD

# Função para verificar se o servidor está rodando
function Test-ServerRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3020" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

# Verificar se o servidor já está rodando
if (Test-ServerRunning) {
    Write-Host "Servidor já está rodando. Abrindo navegador..."
    Start-Process "http://localhost:3020"
} else {
    Write-Host "Iniciando servidor (janela oculta)..."
    
    # Iniciar npm run dev em processo oculto
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c npm run dev"
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    $psi.UseShellExecute = $false
    
    $process = [System.Diagnostics.Process]::Start($psi)
    
    Write-Host "Aguardando servidor inicializar..."
    
    # Aguardar até 30 segundos para o servidor iniciar
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts -and -not (Test-ServerRunning)) {
        Start-Sleep -Seconds 1
        $attempt++
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    
    if (Test-ServerRunning) {
        Write-Host "Servidor iniciado! Abrindo navegador..."
        Start-Process "http://localhost:3020"
    } else {
        Write-Host "Aviso: Servidor pode estar iniciando. Abrindo navegador..."
        Start-Process "http://localhost:3020"
    }
}

Write-Host "Pronto! Você pode fechar esta janela."
