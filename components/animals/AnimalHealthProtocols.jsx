import React, { useState } from 'react'
import { ShieldCheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function AnimalHealthProtocols({ animal }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!animal.protocolos || animal.protocolos.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-emerald-600/10 to-green-600/10 dark:from-emerald-900/30 dark:to-green-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-emerald-600/20 hover:to-green-600/20 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Protocolos SanitÃ¡rios</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {animal.protocolos.length} protocolo(s) registrado(s)
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {animal.protocolos.map((p, i) => (
            <div key={p.id || i} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {p.nome_protocolo || p.protocolo || p.tipo || 'Protocolo'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                InÃ­cio: {formatDate(p.data_inicio)}
                {p.data_fim && ` ââ‚¬¢ Fim: ${formatDate(p.data_fim)}`}
              </p>
              {p.veterinario && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vet: {p.veterinario}</p>
              )}
              {p.observacoes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.observacoes}</p>
              )}
              {p.custo && (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                  Custo: {formatCurrency(p.custo)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
