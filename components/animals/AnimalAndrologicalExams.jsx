import React, { useState } from 'react'
import { AcademicCapIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalAndrologicalExams({ examesAndrologicos, metrics = {} }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!examesAndrologicos || examesAndrologicos.length === 0) return null

  const ultExame = examesAndrologicos[0]
  const { diasDesdeExame, isInapto, diasParaProximoExame } = metrics

  const dataProximoExame = (isInapto && ultExame?.data_exame)
    ? new Date(new Date(ultExame.data_exame).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-blue-150 hover:to-indigo-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">Exames Andrológicos</h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {examesAndrologicos.length} exame(s) registrado(s)
              {diasDesdeExame != null && ` • Último há ${diasDesdeExame} dias`}
              {isInapto && dataProximoExame && (
                <span className="block mt-1 font-semibold text-red-700 dark:text-red-300">
                  Próximo previsto: {formatDate(dataProximoExame)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ultExame?.resultado && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                String(ultExame.resultado).toUpperCase().includes('APTO')
                  ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                  : String(ultExame.resultado).toUpperCase().includes('INAPTO')
                  ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                  : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
              }`}>
                {ultExame.resultado}
              </span>
            )}
            {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </div>
        </div>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {examesAndrologicos.map((ex, i) => (
            <div key={ex.id || i} className="px-4 py-3 flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(ex.data_exame)}
                  {ex.ce != null && ex.ce !== '' && (
                    <span className="ml-2 text-xs font-normal text-gray-600 dark:text-gray-400">CE: {ex.ce}</span>
                  )}
                </p>
                {(ex.defeitos || ex.observacoes) && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {[ex.defeitos, ex.observacoes].filter(Boolean).join(' • ')}
                  </p>
                )}
                {ex.veterinario && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Vet: {ex.veterinario}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 shadow-sm ${
                String(ex.resultado || '').toUpperCase().includes('APTO')
                  ? 'bg-white dark:bg-gray-700 border-2 border-green-500 text-green-800 dark:text-green-200'
                  : String(ex.resultado || '').toUpperCase().includes('INAPTO')
                  ? 'bg-white dark:bg-gray-700 border-2 border-red-500 text-red-800 dark:text-red-200'
                  : 'bg-white dark:bg-gray-700 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
              }`}>
                {ex.resultado || 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
