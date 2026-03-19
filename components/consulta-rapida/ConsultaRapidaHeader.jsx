import Image from 'next/image'

export default function ConsultaRapidaHeader({
  recentesCount,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) {
  return (
    <div className="mb-5 animate-fade-in">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-[1px] shadow-2xl shadow-amber-500/30">
        <div className="rounded-3xl bg-white/95 dark:bg-gray-900/90 backdrop-blur-md p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 font-bold">Consulta rápida</p>
              <h1 className="text-3xl font-black mt-1 bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-300 bg-clip-text text-transparent">
                Beef-Sync
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Interface nova para buscar fichas com mais velocidade.
              </p>
            </div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/40 overflow-hidden p-2 animate-glow-pulse">
              <Image
                src="/Host_ico_rede.ico"
                alt="Ícone Nelore"
                width={64}
                height={40}
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 p-3 inline-block">
              <p className="text-[10px] uppercase font-bold tracking-wide text-amber-700 dark:text-amber-300">Recentes</p>
              <p className="text-lg font-black text-amber-900 dark:text-amber-200">{recentesCount}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="flex-1 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold transition-colors"
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {isDarkMode ? '☀️ Claro' : '🌙 Escuro'}
            </button>
            <button
              onClick={onLogout}
              className="flex-1 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold transition-colors"
              title="Sair"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

