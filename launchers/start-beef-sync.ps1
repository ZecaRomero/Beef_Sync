param()
$ErrorActionPreference = "Continue"
$projectDir = "c:\Users\zeca8\OneDrive\Documentos\Sistemas\beef sync"

# Garantir PATH com Node.js (atalhos do Windows podem nao herdar o PATH completo)
$nodePaths = @(
  "$env:ProgramFiles\nodejs",
  "${env:ProgramFiles(x86)}\nodejs",
  "$env:APPDATA\npm"
)
foreach ($p in $nodePaths) {
  if (Test-Path $p) { $env:PATH = "$p;$env:PATH" }
}

# Verificar Node.js antes de continuar
$nodeOk = $false
try {
  $null = Get-Command node -ErrorAction Stop
  $nodeVer = node -v 2>$null
  if ($nodeVer) { $nodeOk = $true }
} catch {}
if (-not $nodeOk) {
  Write-Host "ERRO: Node.js nao encontrado!" -ForegroundColor Red
  Write-Host "Instale o Node.js em https://nodejs.org e tente novamente." -ForegroundColor Yellow
  Write-Host ""
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
  exit 1
}

# Verificar se node_modules existe
if (-not (Test-Path (Join-Path $projectDir "node_modules"))) {
  Write-Host "Dependencias nao instaladas. Executando npm install..." -ForegroundColor Yellow
  Push-Location $projectDir
  npm install
  Pop-Location
  Write-Host ""
}

function Test-Server($port) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:{0}/" -f $port) -TimeoutSec 2 | Out-Null
    return $true
  } catch { return $false }
}

function Get-NpxPath {
  $npx = Get-Command npx -ErrorAction SilentlyContinue
  if ($npx) { return "npx" }
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if ($npm) {
    $npmDir = Split-Path $npm.Source -Parent
    $npxPath = Join-Path $npmDir "npx.cmd"
    if (Test-Path $npxPath) { return $npxPath }
  }
  return "npx"
}

# Mostrar que esta iniciando
Write-Host "Beef Sync - Iniciando..." -ForegroundColor Cyan
Write-Host ""

# Se o servidor ja esta rodando, usar a porta existente
$port = $null
foreach ($p in 3020, 3021, 3000) {
  if (Test-Server $p) {
    $port = $p
    Write-Host "Servidor ja rodando na porta $p" -ForegroundColor Green
    break
  }
}

if (-not $port) {
  Write-Host "Iniciando servidor Next.js (pode levar 30-60 segundos na primeira vez)..." -ForegroundColor Gray
  Write-Host ""

  # Iniciar servidor em janela VISIVEL para ver erros
  $npx = Get-NpxPath
  $serverProcess = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-Command", "cd '$projectDir'; Write-Host 'Iniciando Beef Sync...' -ForegroundColor Cyan; & '$npx' next dev -p 3020"
  ) -WorkingDirectory $projectDir -PassThru

  # Aguardar ate 50 segundos
  $deadline = (Get-Date).AddSeconds(50)
  while (-not (Test-Server 3020)) {
    if ((Get-Date) -gt $deadline) {
      Write-Host ""
      Write-Host ""
      Write-Host "TIMEOUT: O servidor nao iniciou em 50 segundos." -ForegroundColor Red
      Write-Host ""
      Write-Host "Possiveis causas:" -ForegroundColor Yellow
      Write-Host "  1. Execute 'npm install' na pasta do projeto (se ainda nao fez)" -ForegroundColor White
      Write-Host "  2. Verifique a janela do servidor que abriu - pode ter erro" -ForegroundColor White
      Write-Host "  3. Tente manualmente: cd projeto; npm run dev" -ForegroundColor White
      Write-Host ""
      Write-Host "Pressione uma tecla para fechar..." -ForegroundColor Gray
      $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
      exit 1
    }
    Write-Host "." -NoNewline
    Start-Sleep -Milliseconds 500
  }
  $port = 3020
  Write-Host ""
  Write-Host "Servidor iniciado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Abrindo navegador em http://localhost:$port ..." -ForegroundColor Cyan

function Get-BrowserPath {
  $brave = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
  if (Test-Path $brave) { return $brave }
  $braveLocal = "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe"
  if (Test-Path $braveLocal) { return $braveLocal }
  return $brave
}

try {
  $browser = Get-BrowserPath
  Start-Process -FilePath $browser -ArgumentList @("http://localhost:$port/") -Verb Open | Out-Null
  Start-Process -FilePath $browser -ArgumentList @("--new-window","--window-size=390,844","http://localhost:$port/a") -Verb Open | Out-Null
  Write-Host "Pronto! O navegador foi aberto." -ForegroundColor Green
  Start-Sleep -Seconds 2
} catch {
  Write-Host "Erro ao abrir navegador: $_" -ForegroundColor Red
  Write-Host "Acesse manualmente: http://localhost:$port" -ForegroundColor Yellow
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
