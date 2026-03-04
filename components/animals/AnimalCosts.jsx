import React, { useState } from 'react'
import { CurrencyDollarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function AnimalCosts({ animal }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const custosArray = animal.custos || []
  const custoTotal = custosArray.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
  
  if (custoTotal <= 0) return null

  const custosPorTipo = custosArray.reduce((acc, curr) => {
    const tipo = curr.tipo || curr.subtipo || 'Outros'
    acc[tipo] = (acc[tipo] || 0) + (Number(curr.valor) || 0)
    return acc
  }, {})

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-green-600/20 hover:to-emerald-600/20 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Custos Detalhados</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(custoTotal)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{custosArray.length} lançamento(s)</p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        {Object.keys(custosPorTipo).length > 1 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Por categoria</p>
            <div className="space-y-2">
              {Object.entries(custosPorTipo)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, val]) => (
                  <div key={tipo} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{tipo}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(val)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {custosArray.slice(0, 10).map((c, i) => (
            <div key={c.id || i} className="px-4 py-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {c.tipo || c.subtipo || 'Custo'}
                  </p>
                  {c.descricao && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.descricao}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDate(c.data)}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0">
                  {formatCurrency(c.valor)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
