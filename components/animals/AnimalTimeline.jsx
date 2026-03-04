import React from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Linha do Tempo</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Eventos recentes em ordem cronológica
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {timeline.map((e, i) => (
          <div key={i} className="px-4 py-3 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                e.tipo === 'IA' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40' :
                e.tipo === 'FIV' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' :
                e.tipo === 'Peso' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
              }`}>
                {e.tipo.charAt(0)}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.label}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{formatDate(e.data)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
