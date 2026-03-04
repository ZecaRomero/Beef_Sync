import React, { useState } from 'react'
import { ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalOccurrences({ ocorrencias }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!ocorrencias || ocorrencias.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-b border-gray-200 dark:border-gray-700 text-left active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Ocorrências</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {ocorrencias.length} registro(s) • Vacinas, tratamentos, serviços
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {ocorrencias.slice(0, 15).map((o, i) => (
            <div key={o.id || i} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(o.data_registro || o.data)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {o.descricao || o.observacoes || o.tipo || '-'}
              </p>
              {(o.servicos_aplicados?.length > 0 || o.medicamento) && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {o.servicos_aplicados?.join(', ') || o.medicamento}
                </p>
              )}
              {(o.peso || o.ce) && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {o.peso && `Peso: ${o.peso} kg`}
                  {o.peso && o.ce && ' • '}
                  {o.ce && `CE: ${o.ce} cm`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
