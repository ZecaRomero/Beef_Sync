/**
 * Overlay de progresso de importação - reutilizável em todas as importações do app
 * Mostra spinner, etapa atual e barra de progresso
 */
import React from 'react'

export default function ImportProgressOverlay({ importando, progress = {} }) {
  if (!importando) return null

  const { atual = 0, total = 0, etapa = 'Importando...' } = progress
  const percent = total > 0 ? Math.min(100, (atual / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
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
