# ✅ Beef Sync - Porta 8081 Configurada com Sucesso!

## Status Atual

🟢 **O Beef Sync está rodando na porta 8081!**

- **URL Local:** http://localhost:8081
- **URL Rede:** http://187.77.238.142:8081
- **Status:** Online e funcionando

## O que foi feito?

1. ✅ Alterada a porta de 3020 para 8081 em:
   - `ecosystem.config.cjs` (PM2)
   - `package.json` (scripts NPM)

2. ✅ Aplicação iniciada e testada com sucesso

3. ✅ Criados scripts auxiliares:
   - `start-app.ps1` - Iniciar manualmente (PowerShell)
   - `restart-app.bat` - Reiniciar com PM2 (Windows)
   - `restart-app.sh` - Reiniciar com PM2 (Linux/Mac)

## Como acessar agora?

### Do seu computador:
```
http://localhost:8081
```

### De outros dispositivos na rede:
```
http://187.77.238.142:8081
```

### Páginas de teste criadas:
- http://localhost:8081/test-consulta - Diagnóstico do sistema
- http://localhost:8081/api/test-animal - Teste da API

## Como gerenciar o app?

### Ver logs em tempo real:
```powershell
# Ver os últimos logs
Get-Content -Path "C:\Users\zeca8\.pm2\logs\beef-sync-out.log" -Tail 50 -Wait
```

### Parar o app:
No terminal onde está rodando, pressione `CTRL+C`

### Reiniciar o app:
```powershell
# Opção 1: Usando o script PowerShell
.\start-app.ps1

# Opção 2: Comando direto
npm run start:network
```

### Verificar se a porta está em uso:
```powershell
Get-NetTCPConnection -LocalPort 8081
```

## Troubleshooting

### Problema: "Porta já em uso"
```powershell
# Descobrir qual processo está usando a porta
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess

# Matar o processo (substitua PID pelo número encontrado)
Stop-Process -Id PID -Force
```

### Problema: "Não consigo acessar de outro dispositivo"
1. Verifique o firewall do Windows
2. Certifique-se de que a porta 8081 está liberada
3. Comando para liberar:
```powershell
New-NetFirewallRule -DisplayName "Beef Sync 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```

### Problema: "Página não carrega"
1. Verifique se o app está rodando:
```powershell
Test-NetConnection -ComputerName localhost -Port 8081
```

2. Veja os logs para identificar erros
3. Tente acessar a página de teste: http://localhost:8081/test-consulta

## Próximos passos

1. ✅ Acesse http://187.77.238.142:8081 no navegador
2. ✅ Teste a página de consulta de animais
3. ✅ Verifique se tudo está funcionando normalmente

## Notas importantes

- A Evolution API (WhatsApp) continua na porta 8080
- O PostgreSQL continua na porta 5432
- O app agora está rodando diretamente via npm (não via PM2)
- Para produção, recomenda-se configurar como serviço do Windows

## Configurar como serviço do Windows (opcional)

Se quiser que o app inicie automaticamente com o Windows:

1. Instale o NSSM (Non-Sucking Service Manager):
```powershell
choco install nssm
```

2. Crie o serviço:
```powershell
nssm install BeefSync "C:\Program Files\nodejs\npm.cmd" "run start:network"
nssm set BeefSync AppDirectory "C:\Users\zeca8\OneDrive\Documentos\Sistemas\beef sync"
nssm set BeefSync DisplayName "Beef Sync - Sistema de Gestão Pecuária"
nssm set BeefSync Description "Sistema de gestão pecuária Beef Sync rodando na porta 8081"
nssm start BeefSync
```

## Suporte

Se encontrar problemas:
1. Verifique os logs
2. Teste a página de diagnóstico
3. Verifique se a porta está liberada no firewall
4. Reinicie o app

---

**Data da configuração:** ${new Date().toLocaleString('pt-BR')}
**Versão do Beef Sync:** 3.0.0
**Porta configurada:** 8081
