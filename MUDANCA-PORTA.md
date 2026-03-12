# Mudança de Porta - Beef Sync

## O que foi alterado?

A porta do Beef Sync foi alterada de **3020** para **8081** para corresponder à URL que você estava tentando acessar.

## Arquivos modificados:

1. `ecosystem.config.cjs` - Configuração do PM2
2. `package.json` - Scripts NPM
3. Criados scripts de restart: `restart-app.bat` (Windows) e `restart-app.sh` (Linux/Mac)

## Como reiniciar o app:

### Opção 1: Usando o script (RECOMENDADO)

**Windows:**
```bash
restart-app.bat
```

**Linux/Mac:**
```bash
chmod +x restart-app.sh
./restart-app.sh
```

### Opção 2: Comandos manuais

```bash
# Parar o app
pm2 stop beef-sync

# Iniciar com a nova configuração
pm2 start ecosystem.config.cjs

# Verificar status
pm2 status

# Ver logs
pm2 logs beef-sync
```

### Opção 3: Rebuild completo (se houver problemas)

```bash
# Build da aplicação
npm run build

# Restart do PM2
pm2 restart beef-sync

# Ou delete e recrie o processo
pm2 delete beef-sync
pm2 start ecosystem.config.cjs
```

## URLs de acesso:

- **Produção:** http://187.77.238.142:8081
- **Local:** http://localhost:8081
- **Rede local:** http://[SEU-IP-LOCAL]:8081

## Verificar se está funcionando:

1. Acesse: http://187.77.238.142:8081/test-consulta
2. Verifique o console do navegador (F12)
3. Teste a API: http://187.77.238.142:8081/api/test-animal

## Troubleshooting:

### Porta já em uso?
```bash
# Windows - verificar o que está usando a porta 8081
netstat -ano | findstr :8081

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID [PID] /F
```

### PM2 não encontrado?
```bash
npm install -g pm2
```

### App não inicia?
```bash
# Ver logs detalhados
pm2 logs beef-sync --lines 100

# Verificar erros
pm2 describe beef-sync
```

## Rollback (voltar para porta 3020):

Se precisar voltar para a porta 3020:

1. Edite `ecosystem.config.cjs` e mude `8081` para `3020`
2. Edite `package.json` e mude todas as ocorrências de `8081` para `3020`
3. Execute: `pm2 restart beef-sync`

## Notas importantes:

- A Evolution API (WhatsApp) continua na porta 8080 (não foi alterada)
- O PostgreSQL continua na porta 5432 (não foi alterada)
- Certifique-se de que o firewall permite conexões na porta 8081
- Se estiver usando um roteador, configure o port forwarding para 8081
