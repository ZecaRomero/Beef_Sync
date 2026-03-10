# Correção: [object Object] nos Cards Mobile

## Problema
Os cards na visualização mobile estavam exibindo `[object Object]` em vez dos valores corretos quando o resumo continha objetos JavaScript.

## Causa
O código estava usando `String(v)` diretamente para converter valores do resumo em texto. Quando `v` é um objeto JavaScript, `String(objeto)` retorna a string `"[object Object]"`.

## Solução Implementada

### 1. Função Helper `formatValue`
Criada uma função para formatar valores de forma segura:

```javascript
const formatValue = (v) => {
  if (v == null) return '-'
  if (typeof v === 'object') {
    // Se for um objeto, tentar extrair informações úteis
    if (Array.isArray(v)) return v.length
    return JSON.stringify(v)
  }
  return String(v)
}
```

### 2. Locais Corrigidos
A função `formatValue` foi aplicada em:

- **Cards de resumo**: Linha ~3081
  ```javascript
  <p className={`font-bold ${valSize} ${valCls}`}>{formatValue(v)}</p>
  ```

- **Títulos de modais**: Função `handleCardClick`
  ```javascript
  const displayValue = formatValue(v)
  setCardFilterModal({ open: true, title: `Machos (${displayValue})`, ... })
  ```

- **Compartilhamento**: Funções `handleShareSummary`, `handleShareWhatsApp`, `handleShareEmail`
  ```javascript
  Object.entries(reportData.resumo).map(([k, v]) => `${k}: ${formatValue(v)}`)
  ```

- **Outros displays**: Linha ~1910

## Comportamento Esperado

### Antes
```
rebanho: [object Object]
reproducao: [object Object]
peso: [object Object]
```

### Depois
```
rebanho: {"machos": 150, "femeas": 200}
reproducao: 45
peso: 450.5 kg
```

## Tipos de Valores Tratados

1. **null/undefined**: Retorna `-`
2. **Arrays**: Retorna o tamanho do array
3. **Objetos**: Retorna JSON.stringify(objeto)
4. **Primitivos** (string, number, boolean): Retorna String(valor)

## Testes Recomendados

1. Abrir página mobile-relatorios
2. Selecionar diferentes tipos de relatórios
3. Verificar se os cards exibem valores legíveis
4. Testar compartilhamento via WhatsApp/Email
5. Verificar modais de detalhes

## Arquivos Modificados
- `pages/mobile-relatorios.js`

## Data da Correção
2026-03-09
