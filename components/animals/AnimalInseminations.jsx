import React, { useState, useEffect } from 'react'
import {
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid } from '@heroicons/react/24/solid'
import { formatDate } from '../../utils/formatters'

/** Calcula idade em meses na data da concepção */
function calcularIdadeConcepcao(dataNascimento, dataConcepcao) {
  if (!dataNascimento || !dataConcepcao) return null
  const nasc = new Date(dataNascimento)
  const conc = new Date(dataConcepcao)
  if (isNaN(nasc.getTime()) || isNaN(conc.getTime())) return null
  if (conc <= nasc) return null
  const diffMs  = conc - nasc
  const meses   = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44))
  const diasExtras = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24))
  return { meses, diasExtras, superPrecoce: meses < 14 }
}

/** Ícone/cor por posição no ranking */
function PosicaoRanking({ pos }) {
  if (pos === 1) return <span className="text-2xl">🥇</span>
  if (pos === 2) return <span className="text-2xl">🥈</span>
  if (pos === 3) return <span className="text-2xl">🥉</span>
  return <span className="text-base font-black text-gray-500 dark:text-gray-400 w-7 text-center">#{pos}</span>
}

function badgePosicao(pos) {
  if (pos === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-amber-300/60 shadow-md'
  if (pos === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-slate-300/60 shadow-md'
  if (pos === 3) return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-orange-300/60 shadow-md'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

export default function AnimalInseminations({ inseminacoes, dataNascimento, animalId }) {
  const [isExpanded, setIsExpanded]   = useState(true)
  const [ranking, setRanking]         = useState([])
  const [posicaoAnimal, setPosicaoAnimal] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(false)

  // ── Cálculo da primeira prenha deste animal
  const inseminacoesPrenhas = (inseminacoes || []).filter(ia =>
    /pren/i.test(String(ia.resultado_dg || ia.status_gestacao || ''))
  )
  const primeiraPrenha = inseminacoesPrenhas.reduce((menor, ia) => {
    const d = ia.data_ia || ia.data_inseminacao || ia.data
    if (!d) return menor
    if (!menor) return ia
    return new Date(d) < new Date(menor.data_ia || menor.data) ? ia : menor
  }, null)

  const idadePrimeiraPrenha = primeiraPrenha
    ? calcularIdadeConcepcao(dataNascimento, primeiraPrenha.data_ia || primeiraPrenha.data)
    : null

  // ── Carrega ranking de precocidade
  useEffect(() => {
    if (!inseminacoesPrenhas.length) return
    setLoadingRanking(true)
    const qp = animalId ? `?limit=10&animalId=${animalId}` : '?limit=10'
    fetch(`/api/animals/ranking-precocidade${qp}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRanking(data.ranking || [])
          setPosicaoAnimal(data.posicaoAnimal || null)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false))
  }, [animalId, inseminacoesPrenhas.length])

  const top3      = ranking.slice(0, 3)
  const isTop3    = posicaoAnimal && posicaoAnimal.posicao <= 3
  const isTop10   = posicaoAnimal && posicaoAnimal.posicao <= 10

  // ── Dados gerais
  const prenhas = inseminacoesPrenhas.length
  const taxaSucessoIA = (inseminacoes || []).length > 0
    ? Math.round((prenhas / inseminacoes.length) * 100)
    : null

  if (!inseminacoes || inseminacoes.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* ── Header clicável ── */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 border-b border-gray-200 dark:border-gray-700 text-left hover:from-pink-150 hover:to-rose-150 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            <h2 className="font-bold text-gray-900 dark:text-white">Reprodução / Inseminações</h2>
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
            {isTop3 && (
              <span className="text-xl" title={`${posicaoAnimal.posicao}º mais precoce`}>
                {posicaoAnimal.posicao === 1 ? '🥇' : posicaoAnimal.posicao === 2 ? '🥈' : '🥉'}
              </span>
            )}
            {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {inseminacoes.length} registro(s)
          {prenhas > 0 && ` • ${prenhas} prenha(s)`}
          {idadePrimeiraPrenha && ` • 1ª prenha com ${idadePrimeiraPrenha.meses}m`}
        </p>
      </button>

      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[9999px]' : 'max-h-0'}`}>

        {/* ══ DESTAQUE DE PRECOCIDADE deste animal ══ */}
        {idadePrimeiraPrenha && (
          <div className={`mx-4 mt-4 rounded-2xl overflow-hidden shadow-md ${
            posicaoAnimal?.posicao === 1
              ? 'ring-2 ring-yellow-400'
              : posicaoAnimal?.posicao === 2
              ? 'ring-2 ring-slate-400'
              : posicaoAnimal?.posicao === 3
              ? 'ring-2 ring-amber-600'
              : ''
          }`}>
            <div className={`p-4 flex items-center gap-4 ${
              idadePrimeiraPrenha.superPrecoce
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-pink-500 to-rose-600'
            }`}>
              {/* ícone/posição */}
              <div className="shrink-0 text-center">
                {posicaoAnimal ? (
                  <div>
                    <div className="text-3xl">
                      {posicaoAnimal.posicao === 1 ? '🥇' :
                       posicaoAnimal.posicao === 2 ? '🥈' :
                       posicaoAnimal.posicao === 3 ? '🥉' : '🏅'}
                    </div>
                    <p className="text-white/80 text-[10px] font-bold mt-0.5">
                      {posicaoAnimal.posicao}º lugar
                    </p>
                  </div>
                ) : (
                  <div className="text-3xl">{idadePrimeiraPrenha.superPrecoce ? '⭐' : '💕'}</div>
                )}
              </div>

              {/* dados principais */}
              <div className="flex-1">
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                  {idadePrimeiraPrenha.superPrecoce ? '⚡ Super Precoce!' : 'Primeira Prenha'}
                </p>
                <p className="text-white text-2xl font-black leading-none">
                  {idadePrimeiraPrenha.meses} meses
                  {idadePrimeiraPrenha.diasExtras > 0 && (
                    <span className="text-base font-semibold opacity-80"> +{idadePrimeiraPrenha.diasExtras}d</span>
                  )}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  Emprenou em {formatDate(primeiraPrenha.data_ia || primeiraPrenha.data)}
                </p>
              </div>

              {/* posição no ranking */}
              {posicaoAnimal && (
                <div className="text-right shrink-0">
                  <p className="text-white/70 text-[10px] font-semibold uppercase">Ranking</p>
                  <p className="text-white text-3xl font-black leading-none">#{posicaoAnimal.posicao}</p>
                  <p className="text-white/60 text-[10px]">precocidade</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ RANKING TOP 3 DAS MAIS PRECOCES ══ */}
        {top3.length > 0 && (
          <div className="mx-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrophySolid className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Ranking — Fêmeas Mais Precoces</h3>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">1ª prenha mais cedo</span>
            </div>

            <div className="space-y-2">
              {top3.map((animal, i) => {
                const isEstaAnimal = animalId && animal.id === Number(animalId)
                const pos = animal.posicao

                return (
                  <div
                    key={animal.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 transition-all ${
                      isEstaAnimal
                        ? 'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20 shadow-md'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40'
                    }`}
                  >
                    {/* Posição */}
                    <div className="shrink-0 w-8 text-center">
                      <PosicaoRanking pos={pos} />
                    </div>

                    {/* Info do animal */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${
                        isEstaAnimal ? 'text-pink-700 dark:text-pink-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {animal.nome}
                        {isEstaAnimal && <span className="ml-1 text-[10px] font-semibold text-pink-500"> ← este animal</span>}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {[animal.serie, animal.rg].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Meses */}
                    <div className={`shrink-0 text-center px-3 py-1.5 rounded-xl font-black ${badgePosicao(pos)}`}>
                      <p className="text-xs opacity-80 font-semibold leading-none">{animal.superPrecoce ? '⚡' : '📅'}</p>
                      <p className="text-base leading-tight">
                        {animal.meses}m
                        {animal.diasExtras > 0 && <span className="text-xs opacity-75">+{animal.diasExtras}d</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Se este animal está no ranking mas fora do top 3 */}
            {posicaoAnimal && posicaoAnimal.posicao > 3 && (
              <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/20">
                <span className="text-base font-black text-gray-500 w-8 text-center">#{posicaoAnimal.posicao}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-pink-700 dark:text-pink-300">Este animal</p>
                  <p className="text-[10px] text-gray-400">no ranking de precocidade</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 font-black text-base border border-pink-200 dark:border-pink-700">
                  {posicaoAnimal.meses}m
                  {posicaoAnimal.diasExtras > 0 && <span className="text-xs opacity-75">+{posicaoAnimal.diasExtras}d</span>}
                </div>
              </div>
            )}

            {loadingRanking && (
              <p className="text-xs text-center text-gray-400 mt-2 animate-pulse">Carregando ranking...</p>
            )}
          </div>
        )}

        {/* ══ LISTA DE INSEMINAÇÕES ══ */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-4">
          {inseminacoes.map((ia, i) => {
            const dataIA    = ia.data_ia || ia.data_inseminacao || ia.data
            const diasDesdeIA = dataIA ? Math.floor((new Date() - new Date(dataIA)) / (1000 * 60 * 60 * 24)) : 0
            const ehPrenha  = /pren/i.test(String(ia.resultado_dg || ia.status_gestacao || ''))
            const invalida  = ia.valida === false || (diasDesdeIA > 120 && !ehPrenha)
            const infoConcep = ehPrenha && dataNascimento && dataIA
              ? calcularIdadeConcepcao(dataNascimento, dataIA)
              : null

            return (
              <div key={ia.id || i} className={`px-4 py-3 flex justify-between items-start ${invalida ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(dataIA)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {ia.touro_nome || ia.touro || '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {ia.resultado_dg && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        ehPrenha
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                          : /vazia/i.test(String(ia.resultado_dg))
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                      }`}>
                        DG: {ia.resultado_dg}
                      </span>
                    )}
                    {infoConcep && (
                      <>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          infoConcep.superPrecoce
                            ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/50 dark:text-amber-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                        }`}>
                          {infoConcep.superPrecoce && <span>⚡</span>}
                          Emprenhou com {infoConcep.meses}m
                          {infoConcep.diasExtras > 0 && ` +${infoConcep.diasExtras}d`}
                        </span>
                        {infoConcep.superPrecoce && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-white">
                            ⭐ Super precoce
                          </span>
                        )}
                      </>
                    )}
                    {invalida && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-medium">
                        Inválida
                      </span>
                    )}
                  </div>
                </div>
                {ia.tipo === 'TE' && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/40 shrink-0 ml-2">
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
