# Script para diagnosticar o VPS
# Uso: .\scripts\verificar-vps.ps1

$ErrorActionPreference = "Stop"
$Ip = "187.77.238.142"

Write-Host "Verificando status do servidor $Ip..." -ForegroundColor Cyan
Write-Host ""

$Cmd = @'
echo "=== 1. STATUS DO NGINX (Porta 80/443) ==="
systemctl status nginx --no-pager | grep "Active:" || echo "Nginx não instalado ou parado"
echo ""

echo "=== 2. STATUS DO APP (Docker) ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=== 3. PORTAS ABERTAS (Ouvindo) ==="
ss -tulpn | grep LISTEN
echo ""

echo "=== 4. FIREWALL DO SISTEMA (UFW) ==="
ufw status verbose || echo "UFW não instalado"
'@

ssh "root@${Ip}" $Cmd

Write-Host ""
Write-Host "DIAGNOSTICO CONCLUIDO" -ForegroundColor Green
Write-Host "---------------------------------------------------"
Write-Host "Se o Nginx estiver 'active (running)' e as portas 80/443 estiverem ouvindo,"
Write-Host "mas voce ainda nao consegue acessar, o problema e o FIREWALL DA HOSTINGER."
Write-Host "Acesse o painel da Hostinger -> VPS -> Rede/Firewall e libere as portas 80, 443 e 3020."
