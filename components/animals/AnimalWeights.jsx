import React, { useState } from 'react'
import { ScaleIcon, ChevronDownIcon, ChevronUpIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalWeights({ pesagens }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!pesagens || pesagens.length === 0) return null

  // Ordenar por data decrescente para exibiÃ§Ã£o
  const pesagensOrdenadas = [...pesagens].sort((a, b) => new Date(b.data_pesagem) - new Date(a.data_pesagem))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-blue-600/20 hover:to-indigo-600/20 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">HistÃ³rico de Pesagens</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {pesagens.length} pesagem(ns) registrada(s)
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {pesagensOrdenadas.map((p, i) => {
            // Calcular GMD em relaÃ§Ã£o ao peso anterior (que Ã© o prÃ³ximo na lista ordenada desc)
            const pesoAnterior = pesagensOrdenadas[i + 1]
            let gmd = null
            let dias = 0
            
            if (pesoAnterior) {
              const diffTime = Math.abs(new Date(p.data_pesagem) - new Date(pesoAnterior.data_pesagem))
              dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              if (dias > 0) {
                gmd = ((p.peso - pesoAnterior.peso) / dias).toFixed(3)
              }
            }

            return (
              <div key={p.id || i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{p.peso} kg</span>
                    {gmd && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        parseFloat(gmd) >= 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {parseFloat(gmd) >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                        {gmd} kg/dia
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(p.data_pesagem)}
                    {p.tipo_pesagem && ` ââ‚¬¢ ${p.tipo_pesagem}`}
                  </p>
                </div>
                {p.ce && (
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">CE: {p.ce} cm</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
