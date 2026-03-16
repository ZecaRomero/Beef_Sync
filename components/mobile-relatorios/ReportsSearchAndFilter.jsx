import { ChartBarIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { ICONE_POR_CATEGORIA } from '../../utils/mobileRelatoriosUtils'

export default function ReportsSearchAndFilter({
  searchReports,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categoriasComRelatorios,
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchReports}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar relatórios..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
        />
        {searchReports && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </motion.div>

      {categoriasComRelatorios.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !categoryFilter
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          {categoriasComRelatorios.map(({ cat }) => {
            const CatIcon = ICONE_POR_CATEGORIA[cat] || ChartBarIcon
            const ativo = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(ativo ? '' : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  ativo
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <CatIcon className="h-3.5 w-3.5" />
                {cat}
              </button>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
