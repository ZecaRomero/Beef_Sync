# Script para configurar Nginx + SSL no VPS
# Uso: .\scripts\configurar-dominio.ps1

$ErrorActionPreference = "Stop"

# Configurações
$Ip = "187.77.238.142"
$Dominio = "beefsync.com.br"
$Email = "zeca85@gmail.com" # Ajuste se necessário

Write-Host "Iniciando configuracao do dominio $Dominio no servidor $Ip..." -ForegroundColor Cyan

# 1. Criar script de configuração do Nginx localmente
$TempScript = "$env:TEMP\setup-nginx.sh"
Set-Content -Path $TempScript -Encoding utf8 -Value @"
#!/bin/bash
set -e

# Atualizar e instalar Nginx
echo "Instalando Nginx..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Configurar Nginx para o Beef Sync (Porta 3020)
echo "Configurando Proxy..."
cat > /etc/nginx/sites-available/beefsync << 'EOF'
server {
    listen 80;
    server_name $Dominio www.$Dominio;

    location / {
        proxy_pass http://127.0.0.1:3020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/beefsync /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar Nginx
nginx -t
systemctl restart nginx

# Configurar Firewall (UFW) se estiver ativo
if command -v ufw > /dev/null; then
    echo "Configurando Firewall..."
    ufw allow 'Nginx Full'
    ufw allow ssh
    # ufw enable # Cuidado ao ativar se não tiver certeza
fi

# Configurar SSL (HTTPS) com Certbot
echo "Configurando SSL..."
certbot --nginx -d $Dominio -d www.$Dominio --non-interactive --agree-tos -m $Email --redirect

echo "✅ Configuracao concluida! Acesse: https://$Dominio"
"@

# 2. Enviar para o VPS
Write-Host "Enviando script de configuracao para o VPS..." -ForegroundColor Yellow
scp $TempScript "root@${Ip}:/tmp/setup-nginx.sh"

# 3. Executar no VPS
Write-Host "Executando configuracao no VPS (pode demorar alguns minutos)..." -ForegroundColor Yellow
ssh "root@${Ip}" "chmod +x /tmp/setup-nginx.sh && /tmp/setup-nginx.sh"

# Limpeza
Remove-Item $TempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Tudo pronto! Seu site deve estar acessivel em https://$Dominio" -ForegroundColor Green
