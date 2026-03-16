import {
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ACESSO_RAPIDO_KEYS, DESCRICOES_ACESSO_RAPIDO, ICONE_POR_CATEGORIA } from '../../utils/mobileRelatoriosUtils'

export default function HomeQuickAccessSection({
  allTypes,
  enabledReports,
  favorites,
  recentIds,
  categoriasComRelatorios,
  onSelectTipo,
  onToggleFavorite,
  onSetPeriodLastMonth,
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Acesso Rápido */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <ChartBarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Acesso Rápido</span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent dark:from-amber-800/40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ACESSO_RAPIDO_KEYS.filter((k) => enabledReports.includes(k)).map((id, i) => {
            const tipo = allTypes.find((t) => t.key === id)
            if (!tipo) return null
            const Icon = ICONE_POR_CATEGORIA[tipo.category] || ChartBarIcon
            const desc = DESCRICOES_ACESSO_RAPIDO[id]
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 200 }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => onSelectTipo(id)}
                className="relative flex flex-col items-start gap-2 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 text-left overflow-hidden group"
              >
                <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors z-10">
                  <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="z-10 w-full">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100 block mb-0.5">{tipo.label.replace(/^[📊📅🏆]\s*/, '')}</span>
                  {desc && <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight block">{desc}</span>}
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRightIcon className="h-4 w-4 text-amber-400" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Ações Rápidas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center gap-2 mb-4 px-1 mt-6">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <LightBulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ações Rápidas</span>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-200/60 to-transparent dark:from-blue-800/40" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/a">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                <MagnifyingGlassIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 text-center leading-tight">
                Consultar
                <br />
                Animal
              </span>
            </motion.div>
          </Link>

          <Link href="/mobile-feedback">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 text-center leading-tight">
                Enviar
                <br />
                Feedback
              </span>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSetPeriodLastMonth}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
              <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 text-center leading-tight">
              Último
              <br />
              Mês
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Favoritos */}
      {favorites.filter((id) => enabledReports.includes(id)).length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3 px-1 mt-4">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <StarIconSolid className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Seus Favoritos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent dark:from-amber-800/40" />
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites
              .filter((id) => enabledReports.includes(id))
              .map((id) => {
                const tipo = allTypes.find((t) => t.key === id)
                if (!tipo) return null
                const Icon = ICONE_POR_CATEGORIA[tipo.category] || DocumentTextIcon
                return (
                  <motion.div key={id} whileTap={{ scale: 0.97 }} className="flex items-center gap-1 group">
                    <button
                      onClick={() => onSelectTipo(id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/50 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all"
                    >
                      <Icon className="h-4 w-4 text-amber-500" />
                      {tipo.label.replace(/^[📊📅🏆]\s*/, '')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(id)
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-amber-400 hover:text-amber-500 shadow-sm hover:shadow-md transition-all"
                    >
                      <StarIconSolid className="h-4 w-4" />
                    </button>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {(() => {
        const excluidos = new Set([...ACESSO_RAPIDO_KEYS, ...recentIds, ...favorites])
        const sugestoes = []
        for (const { tipos } of categoriasComRelatorios) {
          for (const t of tipos) {
            if (!excluidos.has(t.key) && sugestoes.length < 3) {
              sugestoes.push(t)
              excluidos.add(t.key)
            }
          }
        }
        return sugestoes.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <LightBulbIcon className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Você pode gostar</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((tipo) => {
                const Icon = ICONE_POR_CATEGORIA[tipo.category] || ChartBarIcon
                return (
                  <motion.button
                    key={tipo.key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectTipo(tipo.key)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors text-left max-w-full"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words min-w-0">{tipo.label.replace(/^[📊📅🏆]\s*/, '')}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ) : null
      })()}

      {/* Recentes */}
      {recentIds.filter((id) => !ACESSO_RAPIDO_KEYS.includes(id)).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Acessados recentemente</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentIds
              .filter((id) => !ACESSO_RAPIDO_KEYS.includes(id))
              .filter((id) => enabledReports.includes(id))
              .slice(0, 5)
              .map((id) => {
                const tipo = allTypes.find((t) => t.key === id)
                if (!tipo) return null
                const Icon = ICONE_POR_CATEGORIA[tipo.category] || DocumentTextIcon
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectTipo(id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors text-left max-w-full"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words min-w-0">{tipo.label.replace(/^[📊📅🏆]\s*/, '')}</span>
                  </motion.button>
                )
              })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
