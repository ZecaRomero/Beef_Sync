# Otimização de Requisições - Página de Detalhes do Animal

## Problema Identificado

A página de detalhes do animal (`/animals/[id]`) estava fazendo mais de 100 requisições HTTP ao carregar, causando:
- Lentidão no carregamento
- Alto consumo de banda
- Sobrecarga no servidor
- Experiência ruim para o usuário

## Solução Implementada

### 1. API Consolidada (`/api/animals/[id]/consolidated`)

Criamos um endpoint que retorna TODOS os dados do animal em uma única requisição:

**Dados incluídos:**
- Dados básicos do animal
- Custos
- Exames andrológicos
- Inseminações
- Transferências de embriões
- Ocorrências
- Gestações
- Coletas FIV (do animal e da mãe)
- Localização
- Dados da mãe e do pai
- Estatísticas de reprodução
- Informações de venda (se vendido)
- Informações de morte (se morto)

**Benefícios:**
- Redução de ~15 requisições para 1 única requisição
- Queries SQL executadas em paralelo no backend
- Menor latência total
- Menos overhead de conexões HTTP

### 2. Cache no Cliente

Implementamos um sistema de cache simples (`utils/animalDataCache.js`):

**Características:**
- Cache de 5 minutos por animal
- Invalidação automática quando animal é atualizado
- Armazenamento em memória (Map)
- Eventos customizados para sincronização

**Benefícios:**
- Navegação instantânea entre animais já visitados
- Zero requisições para dados já carregados
- Melhor experiência ao usar botões de navegação (anterior/próximo)

### 3. Fallback Inteligente

Se a API consolidada falhar, o sistema volta automaticamente para o método antigo de carregamento escalonado.

## Resultados Esperados

### Antes:
- 105+ requisições HTTP
- 1.2 MB transferidos
- 37.5 MB de recursos
- Tempo de carregamento: ~3-5 segundos

### Depois:
- 1 requisição HTTP (primeira visita)
- 0 requisições (visitas subsequentes com cache)
- ~200-300 KB transferidos
- Tempo de carregamento: ~0.5-1 segundo (primeira visita)
- Tempo de carregamento: instantâneo (com cache)

## Arquivos Modificados

1. **`pages/api/animals/[id]/consolidated.js`** (NOVO)
   - Endpoint consolidado que busca todos os dados em paralelo

2. **`utils/animalDataCache.js`** (NOVO)
   - Sistema de cache no cliente

3. **`pages/animals/[id].js`** (MODIFICADO)
   - Usa API consolidada
   - Implementa cache
   - Mantém fallback para método antigo

## Como Testar

1. Abra o DevTools (F12) na aba Network
2. Acesse a página de um animal
3. Verifique que há apenas 1 requisição para `/api/animals/[id]/consolidated`
4. Navegue para outro animal e volte
5. Verifique que não há novas requisições (dados vêm do cache)

## Monitoramento

Para verificar se o cache está funcionando, abra o console do navegador:
- `✅ Usando dados do cache para animal X` = Cache hit
- `🔄 Buscando dados da API para animal X` = Cache miss (primeira visita)

## Manutenção

### Invalidar Cache Manualmente

```javascript
// No console do navegador
animalDataCache.clear() // Limpa todo o cache
animalDataCache.invalidate(animalId) // Limpa cache de um animal específico
```

### Ajustar Duração do Cache

Edite `utils/animalDataCache.js`:
```javascript
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos (padrão)
```

## Próximas Melhorias

1. **Service Worker**: Cache persistente entre sessões
2. **Prefetch**: Carregar próximo animal em background
3. **Compressão**: Gzip/Brotli na API
4. **Lazy Loading**: Carregar dados secundários sob demanda
5. **WebSocket**: Atualizações em tempo real sem polling
