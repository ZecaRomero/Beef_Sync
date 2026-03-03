# Guia: Migrar Banco de Dados para Supabase

Este guia permite que você acesse o Beef-Sync pelo celular **mesmo com o PC desligado**, usando o banco de dados na nuvem (Supabase).

## ⚡ Configuração Rápida (automática)

Se você já criou o projeto no Supabase:

```bash
# Opção 1: Só configurar o .env (senha já definida no script)
npm run db:configurar-supabase
# Digite o Reference ID quando solicitado (Settings → General no Supabase)

# Opção 2: Migração completa (backup + config + restore)
npm run db:migrar-tudo-supabase
# Digite o Reference ID quando solicitado
```

O Reference ID está em: **Supabase Dashboard → Settings → General → Reference ID**

---

## Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Dados atuais no PostgreSQL local

---

## Passo 1: Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New Project**
3. Preencha:
   - **Name**: beef-sync
   - **Database Password**: crie uma senha forte e **guarde**
   - **Region**: escolha a mais próxima (ex: South America)
4. Clique em **Create new project** e aguarde ~2 minutos

---

## Passo 2: Obter a Connection String

1. No Supabase Dashboard, vá em **Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Role até **Connection string**
4. Selecione **URI** e copie a string
5. Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1

Exemplo:
```
postgresql://postgres.xxxxx:SuaSenha123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

Para uso com o Beef-Sync, adicione `?pgbouncer=true` no final (modo connection pooling):
```
postgresql://postgres.xxxxx:SuaSenha123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Passo 3: Fazer backup do banco local

No terminal, na pasta do projeto:

```bash
# Backup completo em JSON
npm run backup:completo

# Ou backup em SQL (para importar direto no Supabase)
npm run backup:sql
```

O arquivo será salvo em `backups/`.

---

## Passo 4: Criar estrutura no Supabase

O Supabase começa com um banco vazio. Você precisa criar as tabelas:

**Opção A – Restaurar backup JSON (recomendado):**

1. Adicione no seu `.env` (temporariamente para o restore):
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:SuaSenha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. Execute o script de inicialização:
   ```bash
   npm run db:init
   ```

3. Restaure o backup:
   ```bash
   node scripts/restore-database.js backups/backup_completo_XXXX.json --force
   ```

**Opção B – Usar SQL direto no Supabase:**

1. No Supabase Dashboard, vá em **SQL Editor**
2. Se você gerou `backup_completo_XXXX.sql`, copie o conteúdo
3. Cole no editor e execute (Run)

---

## Passo 5: Configurar o .env

No arquivo `.env` na raiz do projeto:

```env
# Banco Supabase (substitua pela sua connection string)
DATABASE_URL=postgresql://postgres.xxxxx:SuaSenha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Opcional: para recursos do Supabase (Realtime, Auth)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

Para obter a URL e a Anon Key: **Settings → API** no Supabase.

---

## Passo 6: Testar a conexão

```bash
npm run db:test
```

Se aparecer "Conexão estabelecida", o banco está configurado corretamente.

---

## Passo 7: Acessar pelo celular com PC desligado

O banco já está na nuvem, mas o **servidor Next.js** ainda roda no seu PC. Para acessar com o PC desligado, é preciso hospedar o app.

### Opção 1: Deploy na Vercel (recomendado)

1. Crie conta em [vercel.com](https://vercel.com)
2. Conecte o repositório do Beef-Sync
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = sua connection string do Supabase
4. Faça o deploy
5. Acesse pelo celular em: `https://seu-projeto.vercel.app`

### Opção 2: Manter o PC ligado

Se o PC ficar ligado, você pode acessar pelo celular na mesma rede:

- Use o IP do PC: `http://192.168.x.x:3020`
- Ou use `npm run dev:network` e acesse pelo IP

---

## Resumo

| Etapa | Ação |
|-------|------|
| 1 | Criar projeto no Supabase |
| 2 | Copiar Connection String |
| 3 | Fazer backup local |
| 4 | Restaurar no Supabase |
| 5 | Configurar DATABASE_URL no .env |
| 6 | Testar conexão |
| 7 | (Opcional) Deploy na Vercel para acesso 24/7 |

---

## Solução de problemas

**Erro ETIMEDOUT / Connection timeout**
- **Projeto pausado**: Projetos free tier pausam após inatividade. No Dashboard, clique em "Restore project"
- **Firewall/rede**: Portas 5432 e 6543 podem estar bloqueadas. Tente outra rede (ex: celular como hotspot)
- **Porta 5432**: Para migração/restore, use `:5432` em vez de `:6543` (conexão mais estável)
- **Região**: Confirme que a região na URL (`sa-east-1`, etc.) é a do seu projeto

**Erro de conexão**
- Confirme que a senha na connection string está correta
- Use a string com `pooler.supabase.com:6543` (porta 6543) para o app
- Para restore: use `:5432` (sem `?pgbouncer=true`)

**Tabelas não existem**
- Execute `npm run db:init` com DATABASE_URL apontando para o Supabase
- Ou restaure o backup JSON

**Lento no celular**
- Supabase free tier pode ter latência maior
- Escolha uma região próxima (ex: South America)
