# Deploy Beef Sync com Docker

## O que foi criado

- **Dockerfile** – build na imagem (sem `npm ci`/`npm run build` no startup)
- **docker-compose.beefsync.yml** – compose para o app
- **.dockerignore** – exclui node_modules e .next do build

## Porta

O app roda na **porta 3020** (para o NPM encaminhar beefsync.com.br).

## Para o Kodee / VPS

### 1. docker-compose correto

O `docker-compose` do beefsync deve:

- **NÃO** rodar `npm ci && npm run build` no **command/entrypoint**
- Usar o **Dockerfile** para build (multi-stage)
- O **CMD** deve ser apenas: `npm run start:docker` ou `["node", "server.js"]` se usar standalone

### 2. Exemplo de docker-compose

```yaml
services:
  beefsync-app:
    build: .
    container_name: beefsync-app
    restart: unless-stopped
    ports:
      - "3020:3020"
    environment:
      - NODE_ENV=production
```

### 3. Comando de inicialização

**Remover** do command/entrypoint:
- `npm config set python /usr/bin/python3`
- `npm ci && npm run build`

O build já é feito no `docker build`. O container só precisa rodar `npm run start:docker`.

### 4. NPM Proxy Host

- Forward Hostname: `127.0.0.1`
- Forward Port: `3020`
