# Plano de Refatoração Completa - Beef Sync 2025

## Visão Geral

Este documento descreve o plano de refatoração do aplicativo Beef Sync, um sistema de gestão pecuária com ~600 páginas, ~420 componentes e APIs extensas.

## Objetivos

1. **Manutenibilidade** - Código mais fácil de entender e modificar
2. **Consistência** - Padrões unificados em todo o projeto
3. **Performance** - Menos re-renders, cache inteligente
4. **Qualidade** - Menos bugs, melhor tratamento de erros

---

## Fase 1: Infraestrutura (Concluída)

### 1.1 Cliente API Centralizado
- **Arquivo**: `lib/apiClient.js`
- **Funções**: `apiRequest`, `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiAll`
- **Benefícios**: Tratamento de erros centralizado, respostas padronizadas, logging

### 1.2 Hook useFetch
- **Arquivo**: `hooks/useFetch.js`
- **Funções**: `useFetch`, `useFetchAll`
- **Uso**: Substituir `fetch` direto nos componentes

### 1.3 apiResponse com Logger
- **Arquivo**: `utils/apiResponse.js`
- **Alteração**: `console.log/error` → `logger`

### 1.4 Exemplo: MonthlyReport
- **Arquivo**: `components/reports/MonthlyReport.js`
- **Mudanças**: Usa `apiAll`, separação fetch/processamento, constante MONTHS

---

## Fase 2: Componentes (Prioridade Alta)

### 2.1 Migrar componentes para apiClient
Componentes que fazem `fetch` direto → usar `apiRequest` ou `useFetch`:

| Componente | Chamadas fetch | Ação |
|------------|----------------|------|
| CostManager.js | 8 | Criar useCosts hook |
| SemenStock.js | 9 | Criar useSemenStock hook |
| SemenEntradaSaidaModals.js | 7 | Usar apiPost/apiPut |
| AplicarMedicamentosLote.js | 7 | Usar apiAll |
| Reports (vários) | 4 cada | useFetch |

### 2.2 Padronizar tratamento de loading/error
- Estado de loading consistente
- Mensagens de erro amigáveis
- Retry em falhas de rede (opcional)

### 2.3 Extrair lógica para hooks
- `useAnimals` - já existe (hooks/useAnimals.ts)
- `useCosts` - criar
- `useSemen` - criar
- `useBirths` - criar

---

## Fase 3: APIs (Prioridade Média)

### 3.1 Padronizar respostas
Todas as APIs devem usar `sendSuccess`/`sendError` de `utils/apiResponse`:

```javascript
// Padrão
return sendSuccess(res, data, 'Mensagem', HTTP_STATUS.OK)
return sendError(res, 'Mensagem', HTTP_STATUS.BAD_REQUEST)
```

### 3.2 Validar uso de apiResponse
- Verificar APIs que retornam `res.json()` direto
- Garantir estrutura `{ success, data?, message?, errors? }`

### 3.3 Criar APIs faltantes
- `/api/animals/custos` - custos agregados por animal (se necessário)
- Documentar endpoints existentes

---

## Fase 4: Estrutura e Organização

### 4.1 Pastas
```
/components
  /ui          - Componentes genéricos (Button, Input, Modal)
  /reports     - Relatórios
  /animals     - Componentes de animais
  /dashboard   - Dashboard
  /forms       - Formulários reutilizáveis
```

### 4.2 Nomenclatura
- Componentes: PascalCase
- Hooks: camelCase com prefixo `use`
- Utilitários: camelCase
- Constantes: UPPER_SNAKE_CASE

### 4.3 Imports
- Preferir paths absolutos: `@/lib/apiClient`, `@/components/ui/Button`
- Agrupar: React, libs, components, utils

---

## Fase 5: TypeScript (Opcional/Gradual)

### 5.1 Prioridade
- Novos arquivos: TypeScript
- Arquivos críticos: Migrar gradualmente
- Manter compatibilidade JS

### 5.2 Tipos existentes
- `types/index.ts` - Entidades
- `types/api.ts` - Respostas API
- `types/components.ts` - Props de componentes

### 5.3 Corrigir useOptimizedFetch
- Remover `;` solto na linha 6
- Garantir import `@/types` correto

---

## Fase 6: Performance

### 6.1 Memoização
- React.memo em componentes puros
- useMemo para cálculos pesados
- useCallback para funções passadas como props

### 6.2 Code splitting
- Lazy load de páginas pesadas
- Dynamic import para modais

### 6.3 Cache
- useFetch com cacheTTL
- invalidateCache após mutações

---

## Checklist de Migração por Componente

Para cada componente que usa fetch:

- [ ] Substituir `fetch()` por `apiRequest()` ou `useFetch()`
- [ ] Extrair dados de `response.data` (formato padronizado)
- [ ] Tratar erros com `result.success` / `result.error`
- [ ] Usar logger em vez de console
- [ ] Adicionar estado de loading se não existir
- [ ] Testar fluxo de sucesso e erro

---

## Ordem de Execução Sugerida

1. **Semana 1**: Componentes de relatórios (ReportsDashboard, CostReport, etc.)
2. **Semana 2**: Componentes de sêmen (SemenStock, SemenEntradaSaidaModals)
3. **Semana 3**: Componentes de custos (CostManager, CostManagerEnhanced)
4. **Semana 4**: Formulários e modais (BatchReceptoraForm, ImportModal)
5. **Semana 5+**: Páginas e APIs restantes

---

## Referências

- [REFATORACAO_COMPLETA_2025.md](./REFATORACAO_COMPLETA_2025.md) - Refatoração anterior
- [utils/apiResponse.js](../../utils/apiResponse.js) - Padrões de resposta
- [lib/apiClient.js](../../lib/apiClient.js) - Cliente API
- [hooks/useFetch.js](../../hooks/useFetch.js) - Hook de fetch
