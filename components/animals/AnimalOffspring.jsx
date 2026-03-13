import React, { useState } from 'react'
import Link from 'next/link'
import { UserGroupIcon, ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { formatDate, calcularMesesIdade, calcularMesesIdadeNaData, calcularEra } from '../../utils/formatters'

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
      <div className={`transition-all duration-300 ${isExpanded ? '' : 'max-h-0 overflow-hidden'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {listaFilhos.map((f, i) => {
            const reactKey = f.id ?? `filho-${f.serie}-${f.rg}-${i}`
            // Priorizar Série + RG (identificação oficial); nome só quando for nome real, não concatenação
            const serieRg = [f.serie, f.rg].filter(Boolean).join(' ').trim()
            const nomeValido = f.nome && f.nome.trim() && !/^[A-Z0-9]+\s+[A-Z0-9\.]*\s*\d+$/i.test(f.nome.trim())
            const identificacao = serieRg || (nomeValido ? f.nome.trim() : null) || f.nome || '-'
            const mesesFilho = calcularMesesIdade(f.data_nascimento, f.meses)
            const mesesNaVenda = f.data_baixa ? calcularMesesIdadeNaData(f.data_nascimento, f.data_baixa, f.meses) : null
            const eraNaVenda = mesesNaVenda != null ? calcularEra(mesesNaVenda, f.sexo) : null
            
            const isBaixa = f.status && f.status !== 'ATIVO'
            const statusColor = f.status === 'VENDA' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
              : f.status === 'MORTE/BAIXA' || f.status === 'MORTE' ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-600 bg-gray-50 dark:bg-gray-800'

            const conteudoFilho = (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {identificacao || '-'}
                    </span>
                    {isBaixa && (
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                        {f.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {f.sexo && <span>{f.sexo}</span>}
                    {formatDate(f.data_nascimento) !== '-' && <span>Nasc: {formatDate(f.data_nascimento)}</span>}
                    {mesesFilho != null && <span className="font-medium text-amber-600 dark:text-amber-400">{mesesFilho}m</span>}
                    {isBaixa && eraNaVenda && (
                      <span className="font-medium text-amber-700 dark:text-amber-300" title="Era na data da venda/baixa">
                        Era: {eraNaVenda}
                      </span>
                    )}
                    {(f.pai || f.mae || f.avo_materno) && (
                      <span className="block w-full mt-0.5 text-gray-600 dark:text-gray-400">
                        {[f.pai && `Pai: ${f.pai}`, f.mae && `Mãe: ${f.mae}`, (f.avo_materno || f.avoMaterno) && `Avô mat.: ${f.avo_materno || f.avoMaterno}`].filter(Boolean).join(' • ')}
                      </span>
                    )}
                    {isBaixa && f.data_baixa && (
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        Saída: {formatDate(f.data_baixa)}
                      </span>
                    )}
                    {isBaixa && f.valor && (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        R$ {Number(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}

                    {(f.abczg != null && f.abczg !== '') && <span className="font-medium text-blue-600 dark:text-blue-400">iABCZ: {f.abczg}</span>}
                    {(f.deca != null && f.deca !== '') && <span className="font-medium text-emerald-600 dark:text-emerald-400">DECA: {f.deca}</span>}
                    {((f.iqg ?? f.genetica_2) != null && (f.iqg ?? f.genetica_2) !== '') && <span className="font-medium text-purple-600 dark:text-purple-400">IQG: {(f.iqg ?? f.genetica_2)}</span>}
                    {((f.pt_iqg ?? f.decile_2) != null && (f.pt_iqg ?? f.decile_2) !== '') && <span className="font-medium text-amber-600 dark:text-amber-400">Pt IQG: {(f.pt_iqg ?? f.decile_2)}</span>}
                    {(f.mgte != null && f.mgte !== '') && <span className="font-medium text-amber-700 dark:text-amber-300">MGTe: {f.mgte}</span>}
                    {(f.top != null && f.top !== '') && <span className="font-medium text-orange-600 dark:text-orange-400">TOP: {f.top}</span>}
                  </div>
                </div>
                {f.id && !f.id.toString().startsWith('baixa-') && <ArrowTopRightOnSquareIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
              </>
            )
            
            if (f.id && !f.id.toString().startsWith('baixa-')) {
              const linkId = (f.serie && f.rg) ? `${f.serie}-${f.rg}` : f.id
              return (
                <Link 
                  key={reactKey} 
                  href={`/consulta-animal/${linkId}`}
                  className="px-4 py-4 flex justify-between items-start gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors cursor-pointer"
                >
                  {conteudoFilho}
                </Link>
              )
            }
            
            return (
              <div key={reactKey} className="px-4 py-4 flex justify-between items-start gap-3">
                {conteudoFilho}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
