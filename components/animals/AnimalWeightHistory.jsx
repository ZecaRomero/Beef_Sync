import React, { useState } from 'react'
import { ScaleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalWeightHistory({ animal }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!animal.pesagens || animal.pesagens.length === 0) return null

  // Calculate weight evolution
  const evolucaoPeso = animal.pesagens.length > 1
    ? (animal.pesagens[0].peso - animal.pesagens[animal.pesagens.length - 1].peso).toFixed(1)
    : null
  
  const primeiraPesagem = animal.pesagens[animal.pesagens.length - 1]
  const isMacho = animal.sexo === 'Macho'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-slate-600/10 to-slate-500/10 dark:from-slate-800/50 dark:to-slate-700/50 border-b border-gray-200 dark:border-gray-700 text-left hover:from-slate-600/20 hover:to-slate-500/20 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Pesagens</h2>
          </div>
          <div className="flex items-center gap-2">
            {evolucaoPeso != null && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                parseFloat(evolucaoPeso) >= 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {parseFloat(evolucaoPeso) >= 0 ? '+' : ''}{evolucaoPeso} kg
              </span>
            )}
            {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {animal.pesagens.length} pesagem(ns)
          {evolucaoPeso != null && ` • Evolução desde ${formatDate(primeiraPesagem?.data)}`}
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="p-4 space-y-2">
          {animal.pesagens.map((p, i) => (
            <div key={p.id || i} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="min-w-0">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(p.data)}</span>
                {p.lote && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lote: {p.lote}</p>
                )}
                {p.observacoes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.observacoes}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {p.ce && isMacho && (
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                    CE {p.ce} cm
                  </span>
                )}
                <span className="font-semibold text-gray-900 dark:text-white">{p.peso || p.peso_kg} kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
