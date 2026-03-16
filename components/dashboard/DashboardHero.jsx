export default function DashboardHero({
  darkMode,
  showInteractive,
  onGoMobile,
  onToggleDarkMode,
  onToggleInteractive,
}) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-4 md:p-8 text-white shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-white opacity-10 rounded-lg"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center space-x-2">
              <span className="text-3xl md:text-5xl">📊</span>
              <span>Beef Sync</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-lg">Visão geral do rebanho</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoMobile}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-lg transition-all"
              title="Modo Mobile"
            >
              <span className="text-xl md:text-2xl">📱</span>
            </button>

            <button
              onClick={onToggleDarkMode}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-lg transition-all"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              <span className="text-xl md:text-2xl">{darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={onToggleInteractive}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-white text-sm md:text-base font-medium transition-all flex items-center space-x-1.5"
          >
            <span>{showInteractive ? '📊' : '📈'}</span>
            <span className="hidden sm:inline">{showInteractive ? 'Simples' : 'Interativo'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

