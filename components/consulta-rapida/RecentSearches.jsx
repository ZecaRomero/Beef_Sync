export default function RecentSearches({ recentes, onClear, onOpenAnimal }) {
  if (!recentes?.length) return null

  return (
    <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/70 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Buscas recentes</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          limpar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentes.map((item, idx) => (
          <button
            key={`${item.serie}-${item.rg}-${idx}`}
            type="button"
            onClick={() => onOpenAnimal(item)}
            className="px-3 py-1.5 rounded-full text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 transition-colors"
          >
            {item.serie}-{item.rg}
            {item.nome ? ` • ${item.nome.slice(0, 16)}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

