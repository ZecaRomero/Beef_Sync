import React, { useState, useEffect } from 'react'
import { TrophyIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/router'

export default function RankingIABCZCard({ onSelectAnimal }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/animals/ranking-iabcz?limit=10')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setRanking(data.data)
        }
      })
      .catch(err => console.error('Erro ao carregar ranking:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleClick = (r) => {
    if (onSelectAnimal) {
      onSelectAnimal(r)
    } else {
      router.push(`/animals/${r.id}`)
    }
  }

  const idadeTexto = (dataNascimento) => {
    if (!dataNascimento) return null
    try {
      const d = new Date(String(dataNascimento))
      if (isNaN(d.getTime())) return null
      const diffMs = Date.now() - d.getTime()
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const meses = Math.floor(diffDias / 30.44)
      const diasRest = Math.max(0, Math.round(diffDias - meses * 30.44))
      return `${meses}m ${diasRest}d`
    } catch {
      return null
    }
  }

  if (loading) return null

  if (ranking.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          Ranking iABCZ (Top 10)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum animal com iABCZ cadastrado. Use a Central de Importações (sidebar) para importar Série, RG, iABCZ e Deca do Excel.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            Ranking iABCZ (Top 10)
          </h3>
         
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
        >
          {expanded ? 'Ocultar lista' : 'Ver lista'}
        </button>
      </div>
      <div className="p-3 space-y-3">
        {expanded && ranking.slice(0, 3).map((r) => (
          <div
            key={r.id}
            onClick={() => handleClick(r)}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                r.posicao === 1 ? 'bg-amber-500 text-white' : r.posicao === 2 ? 'bg-gray-400 text-white' : 'bg-amber-700 text-white'
              }`}>
                {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : '🥉'}
              </span>
              <span className="font-medium text-gray-900 dark:text-white truncate">{r.identificacao}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-600 dark:text-blue-400">iABCZ {r.abczg}</div>
              <div className="text-[11px] text-gray-600 dark:text-gray-300">
                {r.sexo || '-'} • {idadeTexto(r.data_nascimento) || '-'} • {r.local || '-'}
                {r.ultimo_peso != null && ` • ${r.ultimo_peso} kg`}
                {(r.sexo && String(r.sexo).toUpperCase().startsWith('M')) && r.ultimo_ce != null && ` • CE: ${r.ultimo_ce} cm`}
              </div>
            </div>
          </div>
        ))}

        {expanded && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ranking.slice(3, 10).map((r) => (
            <div
              key={r.id}
              onClick={() => handleClick(r)}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {r.posicao}
                </span>
                <span className="font-medium text-gray-900 dark:text-white truncate">{r.identificacao}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600 dark:text-blue-400">iABCZ {r.abczg}</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300">
                  {r.sexo || '-'} • {idadeTexto(r.data_nascimento) || '-'} • {r.local || '-'}
                  {r.ultimo_peso != null && ` • ${r.ultimo_peso} kg`}
                  {(r.sexo && String(r.sexo).toUpperCase().startsWith('M')) && r.ultimo_ce != null && ` • CE: ${r.ultimo_ce} cm`}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
