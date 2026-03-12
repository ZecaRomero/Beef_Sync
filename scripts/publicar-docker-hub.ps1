# Publicar Beef Sync no Docker Hub
# Uso: .\scripts\publicar-docker-hub.ps1 -Usuario "SEU_USUARIO_DOCKERHUB"

param(
    [Parameter(Mandatory=$true)]
    [string]$Usuario
)

$ErrorActionPreference = "Stop"
$Imagem = "${Usuario}/beefsync:latest"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Set-Location $ProjectRoot

Write-Host "=== Publicar Beef Sync no Docker Hub ===" -ForegroundColor Cyan
Write-Host "Imagem: $Imagem" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Fazendo login no Docker Hub..." -ForegroundColor Green
docker login

Write-Host ""
Write-Host "2. Construindo imagem..." -ForegroundColor Green
docker build -t $Imagem .

Write-Host ""
Write-Host "3. Enviando para Docker Hub..." -ForegroundColor Green
docker push $Imagem

Write-Host ""
Write-Host "=== Concluido! ===" -ForegroundColor Green
Write-Host "Envie ao Kodee: $Imagem" -ForegroundColor Yellow
Write-Host ""
