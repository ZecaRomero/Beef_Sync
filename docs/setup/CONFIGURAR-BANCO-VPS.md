# Configurar banco de dados no VPS (beefsync-app + evolution-postgres)

## Situação atual

- **beefsync-app** roda na porta 3020, mas retorna 500/503 porque não conecta ao banco
- **evolution-postgres** já existe no VPS (PostgreSQL do Evolution API)
- É preciso configurar `DATABASE_URL` e colocar o Beef Sync na mesma rede Docker

---

## Passo 1: Descobrir o nome da rede Docker no VPS

No VPS, execute:

```bash
docker network ls
```

Procure a rede onde está o container `evolution-postgres`. Exemplos comuns:
- `beef_sync_default` (se o compose está em pasta beef_sync)
- `evolution_default` (se o compose está em pasta evolution)
- `beefsync_default`

Anote o nome exato da rede.

---

## Passo 2: Criar o banco `beef_sync` no PostgreSQL

O Evolution usa o banco `evolution`. O Beef Sync precisa do banco `beef_sync`.

No VPS:

```bash
docker exec -it evolution-postgres psql -U evolution -d evolution -c "CREATE DATABASE beef_sync;"
```

Se der erro de permissão, tente como superusuário:

```bash
docker exec -it evolution-postgres psql -U postgres -d postgres -c "CREATE DATABASE beef_sync OWNER evolution;"
```

*(O usuário padrão do container pode ser `evolution`; se não existir `postgres`, use o primeiro comando.)*

---

## Passo 3: Atualizar o docker-compose do Beef Sync

Use o arquivo `docker-compose.beefsync-completo.yml` com estes ajustes:

1. **Hostname do PostgreSQL**: no compose do Evolution, o serviço se chama `postgres` (não `evolution-postgres`). Use `postgres` na URL.
2. **Banco**: use `beef_sync` (não `evolution`).
3. **Rede**: use o nome exato da rede que você anotou no Passo 1.

Exemplo de `DATABASE_URL`:

```
postgresql://evolution:evolution123@postgres:5432/beef_sync
```

---

## Passo 4: Aplicar no Kodee / VPS

Cole o conteúdo de `docker-compose.beefsync-completo.yml` no Kodee ou no servidor e ajuste:

- `DATABASE_URL` com a URL acima
- `networks` com o nome correto da rede (ex: `beef_sync_default` ou o que aparecer no `docker network ls`)

Depois:

```bash
cd /opt/beefsync  # ou o diretório onde está o compose
docker compose -f docker-compose.beefsync-completo.yml down
docker compose -f docker-compose.beefsync-completo.yml up -d
```

---

## Passo 5: Verificar

```bash
docker logs beefsync-app
```

Não deve aparecer mais `ECONNREFUSED 127.0.0.1:5432`. Se aparecer, confira:

- Rede correta
- Hostname `postgres` (não `evolution-postgres`)
- Banco `beef_sync` criado

---

## Alternativa: usar banco `evolution`

Se preferir usar o mesmo banco do Evolution (não recomendado, mas possível):

```
DATABASE_URL=postgresql://evolution:evolution123@postgres:5432/evolution
```

O Beef Sync criará suas tabelas (`animais`, `custos`, etc.) no mesmo banco. As tabelas do Evolution são diferentes, então não há conflito direto, mas a separação fica menos clara.
