import React, { useState } from 'react'
import Link from 'next/link'
import { UserGroupIcon, ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { formatDate, calcularMesesIdade } from '../../utils/formatters'

export default function AnimalOffspring({ animal, filhos }) {
  const listaFilhos = filhos || animal?.filhos || []
  const [isExpanded, setIsExpanded] = useState(true)

  if (!listaFilhos || listaFilhos.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-amber-150 hover:to-orange-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Crias</h2>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {listaFilhos.length} filho(s) registrado(s)
        </p>
      </button>
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[999px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {listaFilhos.map((f, i) => {
            const identificacao = `${f.nome || f.serie || '-'} ${f.rg || ''}`.trim()
            const mesesFilho = calcularMesesIdade(f.data_nascimento, f.meses)
            
            const conteudoFilho = (
              <>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {identificacao || '-'}
                  </span>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {f.sexo && <span>{f.sexo}</span>}
                    {formatDate(f.data_nascimento) !== '-' && <span>Nasc: {formatDate(f.data_nascimento)}</span>}
                    {mesesFilho != null && <span className="font-medium text-amber-600 dark:text-amber-400">{mesesFilho}m</span>}
                    {(f.abczg != null && f.abczg !== '') && <span className="font-medium text-blue-600 dark:text-blue-400">iABCZ: {f.abczg}</span>}
                    {(f.deca != null && f.deca !== '') && <span className="font-medium text-emerald-600 dark:text-emerald-400">DECA: {f.deca}</span>}
                    {((f.iqg ?? f.genetica_2) != null && (f.iqg ?? f.genetica_2) !== '') && <span className="font-medium text-purple-600 dark:text-purple-400">IQG: {(f.iqg ?? f.genetica_2)}</span>}
                    {((f.pt_iqg ?? f.decile_2) != null && (f.pt_iqg ?? f.decile_2) !== '') && <span className="font-medium text-amber-600 dark:text-amber-400">Pt IQG: {(f.pt_iqg ?? f.decile_2)}</span>}
                  </div>
                </div>
                {f.id && <ArrowTopRightOnSquareIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
              </>
            )
            
            if (f.id) {
              return (
                <Link 
                  key={f.id || i} 
                  href={`/consulta-animal/${f.id}`}
                  className="px-4 py-3 flex justify-between items-center gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors cursor-pointer"
                >
                  {conteudoFilho}
                </Link>
              )
            }
            
            return (
              <div key={f.id || i} className="px-4 py-3 flex justify-between items-center gap-3">
                {conteudoFilho}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
