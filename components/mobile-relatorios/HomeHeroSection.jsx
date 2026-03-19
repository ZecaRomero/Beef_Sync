import { ChartBarIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { formatDisplayValue, getGreeting } from '../../utils/mobileRelatoriosUtils'

const MOD_CONFIG = {
  Rebanho: { icon: '🐄', bgIcon: 'bg-blue-100 dark:bg-blue-900/40' },
  Reprodução: { icon: '💕', bgIcon: 'bg-pink-100 dark:bg-pink-900/40' },
  Peso: { icon: '⚖️', bgIcon: 'bg-amber-100 dark:bg-amber-900/40' },
  Financeiro: { icon: '💰', bgIcon: 'bg-emerald-100 dark:bg-emerald-900/40' },
  Sanidade: { icon: '💉', bgIcon: 'bg-violet-100 dark:bg-violet-900/40' },
  Estoque: { icon: '📦', bgIcon: 'bg-cyan-100 dark:bg-cyan-900/40' },
}
const DEFAULT_MOD_CONFIG = { icon: '📊', bgIcon: 'bg-gray-100 dark:bg-gray-800' }

const LABEL_CURTO = {
  'Média Recente': 'Média',
  'Para Parir (30d)': 'Parir 30d',
  'Gestações Ativas': 'Gestações',
  'Nascimentos (30d)': 'Nasc. 30d',
  'Touros (sêmen)': 'Touros',
  'Doses Sêmen': 'Doses',
  'Embriões Disp.': 'Embriões',
}

export default function HomeHeroSection({
  dashboardData,
  enabledReports,
  favorites,
  onSelectTipo,
  onGoToReports,
  userName,
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="px-1 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/50 mb-3"
        >
          <SparklesIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Beef-Sync</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {getGreeting()},{' '}
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
            {userName || 'Fazendeiro'}
          </span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Resumo executivo da sua fazenda</p>
      </div>

      {dashboardData?.data?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <ChartBarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600/90 dark:text-amber-400/90">Visão Geral</span>
            </div>
            <button
              onClick={() => onSelectTipo('resumo_geral')}
              className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 active:scale-95 transition-colors"
            >
              Ver completo
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dashboardData.data.slice(0, 6).map((mod, i) => {
              const config = MOD_CONFIG[mod.modulo] || DEFAULT_MOD_CONFIG
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, type: 'spring', stiffness: 260, damping: 20 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectTipo('resumo_geral')}
                  className="relative p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bgIcon.replace('/40', '')}`} />
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{mod.modulo}</p>
                    <div className={`w-8 h-8 rounded-full ${config.bgIcon} flex items-center justify-center text-lg shadow-sm`}>{config.icon}</div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(mod.dados || {})
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <div key={k} className="flex flex-col min-w-0">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{LABEL_CURTO[k] || k}</span>
                          <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 tabular-nums leading-tight">{formatDisplayValue(v)}</span>
                        </div>
                      ))}
                  </div>
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-5 grid grid-cols-3 gap-2">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/80 dark:border-gray-700/80 shadow-md shadow-gray-200/40 dark:shadow-black/20 cursor-default"
            >
              <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Hoje</p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mt-0.5 tabular-nums">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToReports}
              className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/80 dark:border-gray-700/80 shadow-md shadow-gray-200/40 dark:shadow-black/20 hover:shadow-lg hover:shadow-emerald-200/30 dark:hover:shadow-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all cursor-pointer"
            >
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Relatórios</p>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mt-0.5 tabular-nums">{enabledReports.length}</p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToReports}
              className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/80 dark:border-gray-700/80 shadow-md shadow-gray-200/40 dark:shadow-black/20 hover:shadow-lg hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20 hover:border-amber-200 dark:hover:border-amber-700/50 transition-all cursor-pointer"
            >
              <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Favoritos</p>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-0.5 tabular-nums">{favorites.length}</p>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
