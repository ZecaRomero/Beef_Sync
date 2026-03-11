import React, { useState } from 'react'
import {
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

/** Calcula idade em meses na data da concepção (data_ia) e se é super precoce (< 14 meses) */
function calcularIdadeConcepcao(dataNascimento, dataConcepcao) {
  if (!dataNascimento || !dataConcepcao) return null
  const nasc = new Date(dataNascimento)
  const conc = new Date(dataConcepcao)
  if (isNaN(nasc.getTime()) || isNaN(conc.getTime())) return null
  if (conc < nasc) return null
  const diffMs = conc - nasc
  const meses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const diasExtras = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24))
  return { meses, diasExtras, superPrecoce: meses < 14 }
}

export default function AnimalInseminations({ inseminacoes, dataNascimento }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!inseminacoes || inseminacoes.length === 0) return null

  const prenhas = inseminacoes.filter(ia => 
    String(ia.resultado_dg || ia.status_gestacao || '').toLowerCase().includes('prenha')
  ).length
  
  const taxaSucessoIA = inseminacoes.length > 0 
    ? Math.round((prenhas / inseminacoes.length) * 100) 
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-pink-150 hover:to-rose-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            <h2 className="font-bold text-gray-900 dark:text-white">Inseminações</h2>
          </div>
          <div className="flex items-center gap-2">
            {taxaSucessoIA != null && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                taxaSucessoIA >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                taxaSucessoIA >= 25 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
              }`}>
                {taxaSucessoIA}% prenhez
              </span>
            )}
            {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {inseminacoes.length} registro(s)
          {taxaSucessoIA != null && ` • ${prenhas} prenha(s)`}
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {inseminacoes.map((ia, i) => {
            const dataIA = ia.data_ia || ia.data_inseminacao || ia.data
            const diasDesdeIA = dataIA ? Math.floor((new Date() - new Date(dataIA)) / (1000 * 60 * 60 * 24)) : 0
            const ehPrenha = /pren/i.test(String(ia.resultado_dg || ia.status_gestacao || ''))
            const maisDe4Meses = diasDesdeIA > 120
            const invalida = ia.valida === false || (maisDe4Meses && !ehPrenha)
            return (
              <div key={ia.id || i} className={`px-4 py-3 flex justify-between items-start ${invalida ? 'opacity-75' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(ia.data_ia || ia.data)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {ia.touro_nome || ia.touro || '-'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {ia.resultado_dg && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        String(ia.resultado_dg).toLowerCase().includes('prenha') ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                        String(ia.resultado_dg).toLowerCase().includes('vazia') ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                      }`}>
                        DG: {ia.resultado_dg}
                      </span>
                    )}
                    {ehPrenha && dataIA && dataNascimento && (() => {
                      const info = calcularIdadeConcepcao(dataNascimento, dataIA)
                      if (!info) return null
                      return (
                        <>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                            Emprenhou com {info.meses}m {info.diasExtras > 0 ? `+${info.diasExtras}d` : ''}
                          </span>
                          {info.superPrecoce && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-900 dark:bg-amber-500/50 dark:text-amber-100">
                              Super precoce
                            </span>
                          )}
                        </>
                      )
                    })()}
                    {invalida && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-medium">
                        Inválida
                      </span>
                    )}
                  </div>
                </div>
                {ia.tipo === 'TE' && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/40 shrink-0">
                    TE
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
