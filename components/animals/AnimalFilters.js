const AnimalFilters = ({ filters, onFilterChange, animals, onClearFilters }) => {
  const filtrar = (v) => v != null && String(v).trim() !== ''
  const racas = [...new Set(animals.map(a => a.raca).filter(filtrar))].sort()
  const eras = [...new Set(animals.map(a => a.era).filter(filtrar))].sort()
  const situacoes = [...new Set(animals.map(a => a.situacao).filter(filtrar))].sort()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ðÅ¸â€�� Filtros
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca por nome/nÃºmero */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nome ou nÃºmero..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Filtro por raÃ§a */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RaÃ§a
          </label>
          <select
            value={filters.raca || ''}
            onChange={(e) => onFilterChange({ ...filters, raca: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas as raÃ§as</option>
            {racas.map(raca => (
              <option key={`raca-${raca}`} value={raca}>{raca}</option>
            ))}
          </select>
        </div>

        {/* Filtro por situaÃ§Ã£o */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SituaÃ§Ã£o
          </label>
          <select
            value={filters.situacao || ''}
            onChange={(e) => onFilterChange({ ...filters, situacao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas as situaÃ§Ãµes</option>
            {situacoes.map(situacao => (
              <option key={`situacao-${situacao}`} value={situacao}>{situacao}</option>
            ))}
          </select>
        </div>

        {/* Filtro por ERA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ERA
          </label>
          <select
            value={filters.era || ''}
            onChange={(e) => onFilterChange({ ...filters, era: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas as ERAs</option>
            {eras.map(era => (
              <option key={`era-${era}`} value={era}>{era}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros avanÃ§ados */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por sexo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sexo
            </label>
            <select
              value={filters.sexo || ''}
              onChange={(e) => onFilterChange({ ...filters, sexo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="Macho">Machos</option>
              <option value="FÃªmea">FÃªmeas</option>
            </select>
          </div>

          {/* Filtro por peso mÃ­nimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Peso MÃ­nimo (kg)
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.pesoMin || ''}
              onChange={(e) => onFilterChange({ ...filters, pesoMin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtro por peso mÃ¡ximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Peso MÃ¡ximo (kg)
            </label>
            <input
              type="number"
              placeholder="1000"
              value={filters.pesoMax || ''}
              onChange={(e) => onFilterChange({ ...filters, pesoMax: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* BotÃ£o para limpar filtros */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            if (onClearFilters) {
              onClearFilters();
            } else {
              onFilterChange({});
            }
          }}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  )
}

export default AnimalFilters