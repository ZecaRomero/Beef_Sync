# Busca e Filtros - Coleta de Oócitos (FIV)

## Melhorias Implementadas

### 1. Campo de Busca Inteligente
- Busca em tempo real por:
  - Nome da doadora
  - Nome do touro
  - Laboratório
  - Veterinário
- Ícone de lupa para indicar funcionalidade
- Botão X para limpar a busca rapidamente

### 2. Filtros Avançados
- **Filtro por Laboratório**: Dropdown com todos os laboratórios cadastrados
- **Filtro por Veterinário**: Dropdown com todos os veterinários cadastrados
- **Filtro por Período**: Campos de data início e fim para filtrar coletas por intervalo

### 3. Indicadores Visuais
- Contador de resultados mostrando quantos registros correspondem aos filtros
- Comparação com total de registros quando há filtros ativos
- Botão "Limpar filtros" aparece quando há filtros aplicados

### 4. Experiência do Usuário
- Layout responsivo que se adapta a diferentes tamanhos de tela
- Mensagem amigável quando nenhum resultado é encontrado
- Ícone de busca para indicar que não há resultados
- Sugestão para ajustar filtros

## Como Usar

### Buscar Animal
1. Digite o nome da doadora, touro, laboratório ou veterinário no campo de busca
2. Os resultados são filtrados automaticamente enquanto você digita
3. Clique no X para limpar a busca

### Filtrar por Laboratório ou Veterinário
1. Selecione o laboratório ou veterinário desejado nos dropdowns
2. A tabela mostra apenas os registros correspondentes

### Filtrar por Data
1. Selecione a data de início e/ou data fim
2. A tabela mostra apenas coletas dentro do período selecionado

### Limpar Todos os Filtros
1. Clique no botão "Limpar filtros" no canto inferior direito da barra de filtros
2. Todos os filtros são removidos e a tabela volta ao estado original

## Localização
- Página: `/reproducao/coleta-fiv`
- Arquivo: `pages/reproducao/coleta-fiv.js`

## Tecnologias
- React Hooks (useState)
- Filtros em memória (sem necessidade de API)
- Tailwind CSS para estilização
- Heroicons para ícones
