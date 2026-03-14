import React, { useMemo, useState } from 'react'
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/formatters'

export default function AnimalTimeline({ animal, ocorrencias = [], inseminacoes = [], transferencias = [] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const timeline = useMemo(() => {
    if (!animal) return []
    const events = []

    // Pesagens
    if (animal.pesagens?.length) {
      animal.pesagens.forEach(p => {
        events.push({
          data: p.data_pesagem,
          tipo: 'Peso',
          label: `Pesagem: ${p.peso} kg`
        })
      })
    }

    // Ocorrências
    if (ocorrencias?.length) {
      ocorrencias.forEach(o => {
        events.push({
          data: o.data_ocorrencia,
          tipo: 'Ocorrência',
          label: `${o.tipo_ocorrencia}${o.observacao ? `: ${o.observacao}` : ''}`
        })
      })
    }
    
    // Inseminações
    if (inseminacoes?.length) {
      inseminacoes.forEach(i => {
        events.push({
          data: i.data_ia || i.data,
          tipo: 'IA',
          label: `Inseminação (${i.touro || 'Touro n/i'})`
        })
      })
    }

    // Transferências (Receptora)
    if (transferencias?.length) {
      transferencias.forEach(t => {
        events.push({
          data: t.data_transferencia || t.data,
          tipo: 'TE',
          label: `Transferência (${t.embriao || 'Embrião n/i'})`
        })
      })
    }
    
    // FIVs (Doadora)
    if (animal.fivs?.length) {
      animal.fivs.forEach(f => {
        events.push({
          data: f.data_fiv || f.data,
          tipo: 'FIV',
          label: `Coleta FIV (${f.quantidade_oocitos || 0} oócitos)`
        })
      })
    }
    
    // Localizações (Entrada)
    if (animal.localizacoes?.length) {
      animal.localizacoes.forEach(l => {
        if (l.data_entrada) {
          events.push({
            data: l.data_entrada,
            tipo: 'Localização',
            label: `Entrada em ${l.piquete || 'Local n/i'}`
          })
        }
      })
    }

    // Ordenar por data decrescente
    return events.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
  }, [animal, ocorrencias, inseminacoes, transferencias])

  if (!timeline || timeline.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full p-4 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-gray-200 dark:border-gray-700 text-left hover:from-indigo-600/15 hover:to-violet-600/15 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Linha do Tempo</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full font-medium">
              {timeline.length} eventos
            </span>
            {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Eventos recentes em ordem cronológica
        </p>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[400px]' : 'max-h-0'}`}>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
          {timeline.map((e, i) => (
            <div key={i} className="px-4 py-3 flex justify-between items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  e.tipo === 'IA' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40' :
                  e.tipo === 'FIV' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' :
                  e.tipo === 'Peso' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700' :
                  e.tipo === 'Ocorrência' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' :
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
    </div>
  )
}
