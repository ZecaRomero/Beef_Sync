# Solução para Erro de Importação

## Problema
Erro ao importar animal: "Lc CJCJ 17039 (tipo no COMLSLSC text e numeric não podem corresponder)"

## Causa Provável
O erro ocorre quando há uma tentativa de comparar ou converter um valor de texto (que contém letras) para um tipo numérico. O valor "Lc CJCJ 17039" parece ser um RG que contém letras e espaços.

## Possíveis Causas

### 1. Coluna RG com tipo incorreto no banco
Se a coluna `rg` foi criada como INTEGER ou NUMERIC ao invés de VARCHAR, causará esse erro.

### 2. Índice ou Constraint com conversão de tipo
Pode haver um índice ou constraint que tenta converter RG para número.

### 3. Trigger que faz conversão de tipo
Pode haver um trigger que tenta fazer operações numéricas com o RG.

## Soluções

### Solução 1: Verificar e Corrigir o Tipo da Coluna RG

Execute no SQL Editor do Neon ou PostgreSQL:

```sql
-- 1. Verificar tipo atual da coluna RG
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'animais' 
AND column_name = 'rg';

-- 2. Se o tipo estiver incorreto (INTEGER, NUMERIC, etc), corrigir:
-- ATENÇÃO: Isso pode falhar se houver dados que não podem ser convertidos
ALTER TABLE animais ALTER COLUMN rg TYPE VARCHAR(20);

-- 3. Se houver erro na conversão, primeiro limpar dados problemáticos:
-- Listar RGs que não são texto puro
SELECT id, serie, rg 
FROM animais 
WHERE rg IS NOT NULL
LIMIT 10;
```

### Solução 2: Remover Índices Problemáticos

```sql
-- Verificar índices que podem estar causando problema
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'animais'
AND column_name = 'rg';

-- Se houver índice com CAST ou conversão, remover:
-- DROP INDEX IF EXISTS nome_do_indice_problematico;

-- Recriar índice correto
CREATE INDEX IF NOT EXISTS idx_animais_rg ON animais(rg);
CREATE INDEX IF NOT EXISTS idx_animais_serie_rg ON animais(serie, rg);
```

### Solução 3: Verificar e Remover Triggers Problemáticos

```sql
-- Listar triggers na tabela animais
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'animais';

-- Se houver trigger problemático, remover:
-- DROP TRIGGER IF EXISTS nome_do_trigger ON animais;
```

### Solução 4: Limpar Dados Problemáticos Antes de Importar

Se o problema for com o dado específico "Lc CJCJ 17039", você pode:

1. **Remover espaços e caracteres especiais do RG antes de importar**
2. **Padronizar o formato do RG no Excel antes de importar**

Exemplo de limpeza no Excel:
- RG original: "Lc CJCJ 17039"
- RG limpo: "LcCJCJ17039" ou "17039"

### Solução 5: Modificar o Código de Importação

Se o problema persistir, podemos modificar o código de importação para sanitizar os RGs antes de inserir:

```javascript
// Em pages/api/animals/batch.js
// Adicionar função de sanitização:

function sanitizarRG(rg) {
  if (!rg) return null
  
  // Converter para string e remover espaços extras
  let rgLimpo = String(rg).trim()
  
  // Remover espaços múltiplos
  rgLimpo = rgLimpo.replace(/\s+/g, ' ')
  
  // Limitar tamanho
  if (rgLimpo.length > 20) {
    rgLimpo = rgLimpo.substring(0, 20)
  }
  
  return rgLimpo
}

// Usar na importação:
const dadosAnimal = {
  // ...
  rg: sanitizarRG(animalData.rg),
  // ...
}
```

## Passos Recomendados

1. **Primeiro**: Execute a Solução 1 para verificar o tipo da coluna
2. **Se necessário**: Execute a Solução 2 para verificar índices
3. **Se persistir**: Execute a Solução 3 para verificar triggers
4. **Como alternativa**: Use a Solução 4 para limpar os dados no Excel
5. **Última opção**: Implemente a Solução 5 no código

## Teste Rápido

Execute este teste no SQL Editor para verificar se consegue inserir o RG problemático:

```sql
-- Teste de inserção
BEGIN;

INSERT INTO animais (serie, rg, nome, sexo, raca, situacao)
VALUES ('TEST', 'Lc CJCJ 17039', 'Animal Teste', 'Macho', 'Nelore', 'Ativo');

-- Se der erro, anote a mensagem completa
-- Se funcionar, desfazer:
ROLLBACK;
```

## Informações Adicionais

Se nenhuma das soluções acima funcionar, por favor forneça:

1. A mensagem de erro completa do console do navegador (F12 → Console)
2. O resultado da query de verificação de tipo da coluna RG
3. O resultado do teste de inserção acima
4. Os logs do servidor Next.js (terminal onde está rodando `npm run dev`)

Isso ajudará a identificar a causa exata do problema.
