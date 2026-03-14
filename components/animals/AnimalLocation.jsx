import React, { useState } from 'react'
import { MapPinIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate, localizacaoValidaParaExibir } from '../../utils/formatters'

export default function AnimalLocation({ animal }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Recalculate derived values if they are not passed directly
  // In the original file, locAtual was calculated in the component body.
  // We can recalculate it here or pass it as a prop. Passing as prop is cleaner if available,
  // but let's recalculate to be self-contained if we just pass 'animal'.
  
  const locAtiva = animal.localizacoes?.find(l => !l.data_saida)
  const locMaisRecente = animal.localizacoes?.[0]
  const locBruto = locAtiva?.piquete
    || locMaisRecente?.piquete
    || animal.piquete_atual
    || animal.piqueteAtual
    || animal.pasto_atual
    || animal.pastoAtual
    || (typeof animal.localizacao_atual === 'object' ? animal.localizacao_atual?.piquete : null)
    || animal.localizacao_atual
  
  const locAtual = localizacaoValidaParaExibir(locBruto) || (locBruto ? 'NÃ£o informado' : null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-blue-150 hover:to-cyan-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">LocalizaÃ§Ã£o</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">
          Atual: {locAtual || 'NÃ£o informado'}
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        {animal.localizacoes && animal.localizacoes.length > 1 && (
          <div className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">HistÃ³rico recente</p>
            <div className="space-y-1">
              {animal.localizacoes.slice(0, 6).map((l, i) => (
                <div key={l.id || i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{localizacaoValidaParaExibir(l.piquete) || 'NÃ£o informado'}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {formatDate(l.data_entrada)}
                    {l.data_saida && ` ââ€ â€™ ${formatDate(l.data_saida)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {locAtual && (!animal.localizacoes || animal.localizacoes.length <= 1) && (
          <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{locAtual}</p>
        )}
      </div>
    </div>
  )
}
