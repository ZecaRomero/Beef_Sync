# Correção de Estoque de Embriões

## Problema Identificado

Embriões que foram transferidos ainda aparecem no relatório de "Estoque de Embriões" no mobile.

### Causa Raiz

A consulta do relatório busca registros da tabela `estoque_semen` com os seguintes critérios:
- `tipo_operacao = 'entrada'`
- `doses_disponiveis > 0`
- `tipo = 'embriao'` OU `nome_touro` contém "ACASALAMENTO" ou " X "

Quando você transfere embriões, o sistema não está atualizando o campo `doses_disponiveis` para refletir a transferência. Isso faz com que embriões já transferidos continuem aparecendo no relatório.

## Solução

### Opção 1: Correção Manual via SQL (Recomendado)

1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
2. Execute o script `scripts/verificar-embrioes.sql`
3. Primeiro, execute as consultas de verificação (seções 1 e 2) para ver o estado atual
4. Identifique os acasalamentos que precisam ser corrigidos
5. Execute a correção apropriada:

#### Para zerar doses de um acasalamento específico:

```sql
UPDATE estoque_semen 
SET doses_disponiveis = 0, 
    doses_usadas = quantidade_doses,
    updated_at = CURRENT_TIMESTAMP
WHERE nome_touro ILIKE '%CJ SANT ANNA 14785 (B2887 X JATOBÁ)%'
  AND tipo_operacao = 'entrada'
  AND (tipo = 'embriao' OR nome_touro ILIKE '%ACASALAMENTO%');
```

#### Para recalcular todas as doses disponíveis:

```sql
UPDATE estoque_semen 
SET doses_disponiveis = GREATEST(0, quantidade_doses - COALESCE(doses_usadas, 0)),
    updated_at = CURRENT_TIMESTAMP
WHERE tipo_operacao = 'entrada'
  AND (tipo = 'embriao'
       OR nome_touro ILIKE '%ACASALAMENTO%'
       OR nome_touro ILIKE '% X %');
```

### Opção 2: Correção via Interface do Sistema

1. Acesse o módulo de "Estoque de Sêmen/Embriões"
2. Localize o acasalamento que foi transferido
3. Edite o registro manualmente
4. Atualize o campo "Doses Disponíveis" para 0
5. Atualize o campo "Doses Usadas" para o valor total de doses

## Prevenção Futura

Para evitar que isso aconteça novamente, o sistema precisa ser atualizado para:

1. **Ao registrar uma transferência de embrião:**
   - Decrementar `doses_disponiveis` no registro de entrada
   - Incrementar `doses_usadas` no registro de entrada
   - Criar um registro de saída (opcional, para histórico)

2. **Implementar trigger no banco de dados:**
   ```sql
   CREATE OR REPLACE FUNCTION atualizar_doses_embrioes()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Quando uma transferência é registrada, atualizar o estoque
     UPDATE estoque_semen
     SET doses_disponiveis = GREATEST(0, doses_disponiveis - 1),
         doses_usadas = COALESCE(doses_usadas, 0) + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE nome_touro ILIKE '%' || NEW.acasalamento || '%'
       AND tipo_operacao = 'entrada'
       AND doses_disponiveis > 0
     LIMIT 1;
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trigger_atualizar_doses_embrioes
   AFTER INSERT ON transferencias_embriao
   FOR EACH ROW
   EXECUTE FUNCTION atualizar_doses_embrioes();
   ```

## Verificação

Após a correção, verifique:

1. Acesse o relatório de "Estoque de Embriões" no mobile
2. Confirme que os embriões transferidos não aparecem mais
3. Verifique que apenas embriões com doses disponíveis são exibidos

## Exemplo dos Touros na Imagem

Com base na imagem fornecida, os seguintes acasalamentos precisam ser corrigidos:

1. **CJ SANT ANNA 14785 (B2887 X JATOBÁ)** - 171 doses
2. **CJ SANT ANNA 15407 (HERMOSO X GENERAL)** - 66 doses
3. **CJCJ 15559 (MALÃO X REM ARMADOR)** - 30 doses
4. **CJ SANT ANNA 15168 (URI X GENERAL)** - 15 doses

Execute o UPDATE para cada um deles se já foram transferidos.

## Suporte

Se precisar de ajuda, consulte:
- `scripts/verificar-embrioes.sql` - Script SQL completo
- `scripts/corrigir-estoque-embrioes.js` - Script Node.js (requer configuração do banco)
