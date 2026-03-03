# Como Corrigir o Erro de Importação AGORA

## O Problema
Erro: "Lc CJCJ 17039 (tipo no COMLSLSC text e numeric não podem corresponder)"

## Solução Rápida (3 passos)

### Passo 1: Executar Script de Diagnóstico

Abra o terminal e execute:

```bash
node corrigir-tipo-rg.js
```

Este script vai:
- Verificar o tipo da coluna RG
- Identificar RGs problemáticos
- Testar se consegue inserir o RG com letras
- Mostrar a causa exata do problema

### Passo 2: Aplicar Correção no Banco (se necessário)

Se o script identificar que a coluna RG tem tipo incorreto, execute no SQL Editor do Neon:

```sql
-- Corrigir tipo da coluna RG
ALTER TABLE animais ALTER COLUMN rg TYPE VARCHAR(20);

-- Recriar índices
DROP INDEX IF EXISTS idx_animais_rg;
DROP INDEX IF EXISTS idx_animais_serie_rg;

CREATE INDEX idx_animais_rg ON animais(rg);
CREATE INDEX idx_animais_serie_rg ON animais(serie, rg);
```

### Passo 3: Testar Importação

1. Reinicie o servidor Next.js (Ctrl+C e depois `npm run dev`)
2. Tente importar novamente o arquivo Excel
3. O código agora sanitiza automaticamente os RGs antes de inserir

## Solução Alternativa (se o problema persistir)

### Opção A: Limpar os Dados no Excel

Antes de importar, limpe os RGs no Excel:

1. Abra o arquivo Excel
2. Selecione a coluna RG
3. Use "Localizar e Substituir" (Ctrl+H):
   - Localizar: `  ` (dois espaços)
   - Substituir por: ` ` (um espaço)
4. Repita até não encontrar mais espaços duplos
5. Salve e tente importar novamente

### Opção B: Remover Letras do RG

Se o RG "Lc CJCJ 17039" deveria ser apenas "17039":

1. No Excel, crie uma nova coluna
2. Use a fórmula: `=DIREITA(A2, 5)` (onde A2 é a célula com o RG)
3. Isso vai extrair apenas os últimos 5 caracteres (o número)
4. Copie e cole como valores na coluna RG original
5. Salve e tente importar novamente

## O Que Foi Feito

Modifiquei o código de importação (`pages/api/animals/batch.js`) para:

1. **Sanitizar automaticamente** os RGs antes de inserir:
   - Remove espaços extras
   - Limita o tamanho a 20 caracteres
   - Mantém letras e números (RGs podem ter letras)

2. **Validar** os dados antes de tentar inserir no banco

3. **Registrar avisos** quando encontrar dados problemáticos

## Verificar se Funcionou

Após aplicar as correções:

1. Abra o console do navegador (F12)
2. Tente importar o arquivo novamente
3. Verifique se há mensagens de erro ou aviso
4. Se aparecer "✅ X registros importados com sucesso", funcionou!

## Se Ainda Não Funcionar

Execute este comando no terminal para ver os logs detalhados:

```bash
# No terminal onde está rodando o servidor Next.js
# Procure por mensagens de erro relacionadas a "COMLSLSC" ou "tipo"
```

E me envie:
1. A mensagem de erro completa do console do navegador
2. A saída do script `corrigir-tipo-rg.js`
3. Os logs do servidor Next.js

## Contato para Suporte

Se precisar de ajuda adicional, forneça:
- Screenshot do erro
- Resultado do script de diagnóstico
- Exemplo de algumas linhas do Excel que está tentando importar
