/**
 * Overlay de progresso de importação - reutilizável em todas as importações do app
 * Mostra spinner circular com progresso, etapa atual e barra de progresso
 */

export default function ImportProgressOverlay({ importando, progress }) {
  if (!importando) return null

  const { atual = 0, total = 0, etapa = 'Importando...' } = progress || {}
  const percent = total > 0 ? Math.min(100, (atual / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Indicador circular com progresso */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Círculo de fundo */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Círculo de progresso */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - percent / 100)}`}
              className="text-pink-500 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          {/* Porcentagem no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(percent)}%
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {etapa.includes('...') ? etapa : `${etapa}...`}
        </h3>
        
        {total > 0 && (
          <>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
              <div
                className="bg-pink-500 h-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {atual} de {total} {total === 1 ? 'registro' : 'registros'}
            </p>
          </>
        )}
        
        {total === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aguarde, não feche a janela.
          </p>
        )}
      </div>
    </div>
  )
}
