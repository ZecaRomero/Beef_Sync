import React, { useState } from 'react'
import { CubeTransparentIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { formatDate, formatDoadoraIdentificacao } from '../../utils/formatters'

export default function AnimalEmbryoTransfers({ transferencias }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!transferencias || transferencias.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 border-b border-gray-200 dark:border-gray-700 text-left active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CubeTransparentIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">TransferÃªncias (TE)</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {transferencias.length} TE(s) como receptora
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {transferencias.map((te, i) => (
            <div key={te.id || i} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(te.data_te || te.data_transferencia)}
                {te.numero_te && <span className="ml-2 text-xs text-gray-500">#{te.numero_te}</span>}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Doadora: {formatDoadoraIdentificacao(te.doadora_nome || te.doadora) || '-'} ââ‚¬¢ Touro: {te.touro || '-'}
              </p>
              {(te.resultado || te.status) && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                  String(te.resultado || te.status || '').toLowerCase().includes('prenha')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {te.resultado || te.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
