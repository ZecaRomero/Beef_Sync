# Correção de Gestações Órfãs

## Problema

Gestações podem aparecer no sistema mobile mesmo após serem excluídas do app. Isso pode acontecer por:

1. Cache não sincronizado
2. Gestações duplicadas
3. Gestações sem nascimento vinculado (órfãs)
4. Exclusão incompleta

## Soluções Implementadas

### 1. API de Gestações Completa

A API `/api/gestacoes` agora suporta todas as operações CRUD:

- `GET /api/gestacoes` - Listar gestações
- `GET /api/gestacoes?id=123` - Buscar gestação específica
- `POST /api/gestacoes` - Criar gestação
- `PUT /api/gestacoes?id=123` - Atualizar gestação
- `DELETE /api/gestacoes?id=123` - Excluir gestação

### 2. API de Limpeza de Gestações Órfãs

Endpoint: `POST /api/gestacoes/limpar-orfas`

#### Verificar gestações órfãs de um animal específico

```bash
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"animalRg": "16588"}'
```

#### Excluir gestações órfãs de um animal específico

```bash
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"animalRg": "16588", "forceDelete": true}'
```

#### Verificar todas as gestações órfãs do sistema

```bash
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Excluir todas as gestações órfãs do sistema

```bash
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"forceDelete": true}'
```

### 3. Script de Correção Específico

Para o animal 16588 (MARCOLINA SANT ANNA), execute:

```bash
node scripts/corrigir-gestacao-16588.js
```

Este script:
- Lista todas as gestações do animal
- Identifica quais têm nascimentos vinculados
- Exclui apenas as gestações órfãs (sem nascimento)
- Mantém gestações com nascimentos vinculados

## Como Usar

### Caso 1: Gestação aparece no mobile mas foi excluída

1. Identifique o RG do animal (ex: 16588)
2. Verifique as gestações órfãs:
   ```bash
   curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
     -H "Content-Type: application/json" \
     -d '{"animalRg": "16588"}'
   ```
3. Se encontrar gestações órfãs, exclua:
   ```bash
   curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
     -H "Content-Type: application/json" \
     -d '{"animalRg": "16588", "forceDelete": true}'
   ```

### Caso 2: Limpeza geral do sistema

Execute periodicamente para manter o sistema limpo:

```bash
# Verificar
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{}'

# Limpar
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"forceDelete": true}'
```

## Segurança

- Gestações com nascimentos vinculados NUNCA são excluídas
- O relacionamento `ON DELETE SET NULL` garante que nascimentos não sejam perdidos
- Todas as operações são registradas no log
- Transações garantem consistência dos dados

## Prevenção

Para evitar gestações órfãs no futuro:

1. Sempre use a API de exclusão (`DELETE /api/gestacoes?id=123`)
2. Não exclua gestações diretamente do banco de dados
3. Execute limpezas periódicas com o endpoint `/api/gestacoes/limpar-orfas`
4. Monitore os logs para identificar problemas de sincronização

## Troubleshooting

### Gestação ainda aparece após exclusão

1. Limpe o cache do app mobile
2. Force sincronização no mobile
3. Verifique se há duplicatas no banco
4. Execute o script de correção específico

### Erro ao excluir gestação

1. Verifique se o ID está correto
2. Confirme que a gestação existe no banco
3. Verifique os logs para detalhes do erro
4. Tente usar o endpoint de limpeza de órfãs

## Exemplo Completo: Corrigir Animal 16588

```bash
# 1. Verificar gestações
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"animalRg": "16588"}'

# Resposta esperada:
# {
#   "success": true,
#   "message": "2 gestação(ões) órfã(s) encontrada(s)",
#   "total": 2,
#   "gestacoes": [...]
# }

# 2. Excluir gestações órfãs
curl -X POST http://localhost:3000/api/gestacoes/limpar-orfas \
  -H "Content-Type: application/json" \
  -d '{"animalRg": "16588", "forceDelete": true}'

# Resposta esperada:
# {
#   "success": true,
#   "message": "2 gestação(ões) órfã(s) excluída(s)",
#   "total": 2
# }

# 3. Verificar no mobile
# - Feche e abra o app
# - Force sincronização
# - Verifique se a gestação sumiu
```
