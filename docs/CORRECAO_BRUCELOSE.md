# Correção: Fêmeas para Brucelose

## Problema Relatado
Animais de 2 meses estavam aparecendo para vacinação de brucelose, quando deveriam aparecer apenas animais entre 3 e 8 meses (90-240 dias).

## Correções Realizadas

### 1. Verificação de Vacinas Aplicadas
As queries estavam verificando apenas a tabela `custos` para identificar animais que já tomaram a vacina de brucelose. Agora também verificam a tabela `historia_ocorrencias`.

**Arquivos corrigidos:**
- `pages/api/planejamento/agenda-eventos.js`
- `pages/api/relatorios-envio/enviar.js`

**Mudança:**
```sql
-- ANTES: Verificava apenas custos
WITH animais_com_brucelose AS (
  SELECT DISTINCT c.animal_id
  FROM custos c
  WHERE c.tipo ILIKE '%brucelose%' 
    OR c.subtipo ILIKE '%brucelose%' 
    OR c.observacoes ILIKE '%brucelose%'
)

-- DEPOIS: Verifica custos E histórico de ocorrências
WITH animais_com_brucelose AS (
  SELECT DISTINCT c.animal_id
  FROM custos c
  WHERE c.tipo ILIKE '%brucelose%' 
    OR c.subtipo ILIKE '%brucelose%' 
    OR c.observacoes ILIKE '%brucelose%'
  UNION
  SELECT DISTINCT h.animal_id
  FROM historia_ocorrencias h
  WHERE LOWER(h.tipo) LIKE '%brucelose%' 
    OR LOWER(h.descricao) LIKE '%brucelose%'
)
```

### 2. Regra de Idade Mantida
A regra de idade está correta em todas as queries:
- **Mínimo:** 90 dias (3 meses)
- **Máximo:** 240 dias (8 meses)

```sql
AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
```

## Como Verificar se Há Animais com Idade Incorreta

Se ainda aparecerem animais de 2 meses (menos de 90 dias), pode ser um problema de:

1. **Data de nascimento incorreta** no cadastro do animal
2. **Cache de dados** no navegador/aplicativo

### Verificação Manual

Execute esta query no banco de dados para verificar se há animais com menos de 90 dias sendo retornados:

```sql
WITH animais_com_brucelose AS (
  SELECT DISTINCT c.animal_id
  FROM custos c
  WHERE c.tipo ILIKE '%brucelose%' 
    OR c.subtipo ILIKE '%brucelose%' 
    OR c.observacoes ILIKE '%brucelose%'
  UNION
  SELECT DISTINCT h.animal_id
  FROM historia_ocorrencias h
  WHERE LOWER(h.tipo) LIKE '%brucelose%' 
    OR LOWER(h.descricao) LIKE '%brucelose%'
)
SELECT
  a.id,
  a.serie,
  a.rg,
  a.data_nascimento,
  (CURRENT_DATE - a.data_nascimento::date) as idade_dias,
  FLOOR((CURRENT_DATE - a.data_nascimento::date) / 30.44) as idade_meses
FROM animais a
LEFT JOIN animais_com_brucelose b ON a.id = b.animal_id
WHERE a.situacao = 'Ativo'
  AND a.sexo = 'Fêmea'
  AND a.data_nascimento IS NOT NULL
  AND b.animal_id IS NULL
  AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 90 AND 240
ORDER BY idade_dias ASC;
```

**Resultado esperado:**
- Todos os animais devem ter `idade_dias >= 90` e `idade_dias <= 240`
- Todos os animais devem ter `idade_meses >= 2` (pois 90 dias / 30.44 ≈ 2.95 meses)

Se aparecer algum animal com `idade_dias < 90`, há um problema na query ou no banco de dados.

## Próximos Passos

1. **Limpar cache:** Recarregue a página/aplicativo com Ctrl+F5 ou limpe o cache
2. **Verificar dados:** Se o problema persistir, execute a query de verificação acima
3. **Corrigir datas:** Se encontrar animais com data de nascimento incorreta, corrija no cadastro

## Observações

- O cálculo de meses usa `30.44` dias por mês (média anual)
- Um animal com 90 dias terá aproximadamente 2.95 meses (exibido como "2 meses" com `Math.floor`)
- Um animal com 91 dias já terá 3 meses completos
- A vacina de brucelose é obrigatória para fêmeas entre 3 e 8 meses de idade
