# Publicar Beef Sync no Docker Hub

O Kodee/Hostinger nao suporta `build:` local. Entao precisa publicar a imagem no Docker Hub.

## Passo a passo

### 1. Criar conta no Docker Hub

- Acesse: https://hub.docker.com
- Crie uma conta gratuita
- Anote seu **usuario** (ex.: `zecaromero`)

### 2. Fazer login no Docker

No PowerShell (no seu PC):

```powershell
docker login
```

Digite seu usuario e senha do Docker Hub.

### 3. Build e push da imagem

```powershell
cd "c:\Users\zeca8\OneDrive\Documentos\Sistemas\beef sync"
.\scripts\publicar-docker-hub.ps1 -Usuario SEU_USUARIO
```

Ou manualmente:

```powershell
cd "c:\Users\zeca8\OneDrive\Documentos\Sistemas\beef sync"
docker build -t SEU_USUARIO/beefsync:latest .
docker push SEU_USUARIO/beefsync:latest
```

Substitua `SEU_USUARIO` pelo seu usuario do Docker Hub.

### 4. Enviar ao Kodee

Depois do push, envie ao Kodee:

```
SEU_USUARIO/beefsync:latest
```

Exemplo: `zecaromero/beefsync:latest`

### 5. Compose atualizado (para Kodee)

O Kodee vai trocar `build: .` por `image: SEU_USUARIO/beefsync:latest` no compose.
