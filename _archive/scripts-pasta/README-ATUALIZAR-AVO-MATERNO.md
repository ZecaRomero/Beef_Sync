# Script de Atualização de Avô Materno em Lote

Este script permite atualizar o avô materno de vários animais de uma vez usando um arquivo CSV.

## Como usar:

1. **Criar arquivo CSV** com o formato:
   ```csv
   serie,rg,avo_materno
   BENT,6167,CALVARIO SANT FIV 51
   CJCJ,16173,NOME DO AVO MATERNO
   ```

2. **Executar o script**:
   ```bash
   node scripts/atualizar-avo-materno-lote.js seu-arquivo.csv
   ```

## Formato do CSV:

- **Primeira linha**: Cabeçalho `serie,rg,avo_materno`
- **Linhas seguintes**: Dados no formato `serie,rg,nome do avô materno`
- Separação por vírgula
- Campos não devem estar entre aspas (a menos que necessário)

## Exemplo:

```csv
serie,rg,avo_materno
BENT,6167,CALVARIO SANT FIV 51
CJCJ,16173,REMP 1197 REM JACARANDA GENETICA ADITIVA
CJCJ,16158,OUTRO NOME DO AVO
```

## O que o script faz:

1. Lê o arquivo CSV
2. Para cada linha:
   - Busca o animal pela série e RG
   - Atualiza o campo `avo_materno` se encontrado
   - Registra sucessos, erros e animais não encontrados
3. Gera um log JSON com todos os resultados

## Observações:

- O script verifica se o animal já tem o mesmo valor antes de atualizar
- Animais não encontrados são listados separadamente
- Um arquivo de log é gerado automaticamente com timestamp

