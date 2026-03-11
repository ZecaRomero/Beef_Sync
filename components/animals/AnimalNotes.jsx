import React, { useState } from 'react'
import { DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate, formatCurrency } from '../../utils/formatters'
import InfoRow from './InfoRow'

export default function AnimalNotes({ animal }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Filtrar observações de sistema (ex: "Atualizado via lote LOTE-00192")
  const obsFiltrada = (animal.observacoes || animal.informacoes_adicionais || '')
    .replace(/Atualizado via lote LOTE-\d+/gi, '')
    .trim()
  const hasInfo = obsFiltrada || animal.origem || animal.data_entrada || animal.valor_compra

  if (!hasInfo) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700 text-left hover:from-gray-200 hover:to-slate-200 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Informações Adicionais</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="p-4 space-y-3">
          {obsFiltrada && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                {obsFiltrada}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {animal.origem && <InfoRow label="Origem" value={animal.origem} />}
            {animal.data_entrada && <InfoRow label="Data Entrada" value={formatDate(animal.data_entrada)} />}
            {animal.valor_compra && <InfoRow label="Valor Compra" value={formatCurrency(animal.valor_compra)} />}
          </div>
        </div>
      </div>
    </div>
  )
}
