import React, { useState } from 'react'
import {
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalGestations({ gestacoes }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!gestacoes || gestacoes.length === 0) return null

  const concluidas = gestacoes.filter(g => g.data_nascimento || g.data_parto).length
  const emAndamento = gestacoes.length - concluidas

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-emerald-150 hover:to-teal-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-gray-900 dark:text-white">GestaÃ§Ãµes</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {gestacoes.length} gestaÃ§Ã£o(Ãµes)
          {(concluidas > 0 || emAndamento > 0) && ` ââ‚¬¢ ${concluidas} parto(s) ââ‚¬¢ ${emAndamento} em andamento`}
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {gestacoes.map((g, i) => (
            <div key={g.id || i} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {g.situacao || 'Em andamento'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(g.data_cobertura || g.data_cobertura_mae)} ââ‚¬¢ {g.touro_nome || g.touro || '-'}
              </p>
              {(g.data_nascimento || g.data_parto) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Parto: {formatDate(g.data_nascimento || g.data_parto)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
