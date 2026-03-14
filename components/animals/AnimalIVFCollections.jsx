import React, { useState } from 'react'
import {
  CubeTransparentIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalIVFCollections({ fivs }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!fivs || fivs.length === 0) return null

  const totalOocitos = fivs.reduce((acc, fiv) => acc + (fiv.quantidade_oocitos || 0), 0)
  const mediaOocitos = fivs.length ? (totalOocitos / fivs.length).toFixed(1) : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 border-b border-gray-200 dark:border-gray-700 text-left hover:from-violet-150 hover:to-fuchsia-150 dark:hover:from-violet-800/50 dark:hover:to-fuchsia-800/50 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CubeTransparentIcon className="h-6 w-6 text-violet-700 dark:text-violet-300" />
            <h2 className="font-bold text-gray-900 dark:text-white">Coletas FIV</h2>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
          {fivs.length} coleta(s) • {totalOocitos} oócitos totais
          {mediaOocitos > 0 && ` • Média: ${mediaOocitos}/coleta`}
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {fivs.map((fiv, i) => (
            <div key={fiv.id || i} className="px-4 py-3 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(fiv.data_fiv)}
                    {fiv.data_transferencia && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-1 font-normal">
                        (TE: {formatDate(fiv.data_transferencia)})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Lab: {fiv.laboratorio || fiv.veterinario || '-'}
                  </p>
                  {fiv.touro && (
                    <p className="text-xs text-violet-700 dark:text-violet-400 mt-1 font-medium">
                      Touro: {fiv.touro}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-lg text-sm font-bold bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100 border border-violet-300 dark:border-violet-700 shrink-0">
                  {(fiv.quantidade_oocitos || 0)} oócitos
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
