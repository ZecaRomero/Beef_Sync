import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { extrairSerieRG } from '../utils/animalUtils'
import Head from 'next/head'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  DocumentArrowUpIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function MobileAnimal() {
  const router = useRouter()
  const [serie, setSerie] = useState('')
  const [rg, setRg] = useState('')
  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allAnimals, setAllAnimals] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [ranking, setRanking] = useState([])
  const [rankingDECA, setRankingDECA] = useState([])
  const [rankingIQG, setRankingIQG] = useState([])
  const [rankingPtIQG, setRankingPtIQG] = useState([])
  const [rankingMGte, setRankingMGte] = useState([])
  const [mgtePosicao, setMgtePosicao] = useState(null) // { posicao, total, mgte }
  const [rankingPeso, setRankingPeso] = useState([])
  const [rankingCE, setRankingCE] = useState([])
  const [sincronizandoNascimento, setSincronizandoNascimento] = useState(false)
  const [toastSync, setToastSync] = useState(null)
  const [maeLink, setMaeLink] = useState(null) // { serie, rg } quando mãe pode ser linkada
  const [maeColetas, setMaeColetas] = useState(null) // resumo de coletas quando mãe não cadastrada mas tem histórico FIV
  const [fichaDoadora, setFichaDoadora] = useState(null) // histórico FIV quando o animal é doadora (sua própria ficha)
  const [custoTotal, setCustoTotal] = useState(0)
  const [custosLista, setCustosLista] = useState([])
  const [refreshingCustos, setRefreshingCustos] = useState(false)
  const [baixasResumo, setBaixasResumo] = useState(null) // { baixaPropria, resumoMae }

  const sincronizarNascimentos = async () => {
    setSincronizandoNascimento(true)
    setToastSync(null)
    try {
      const res = await fetch('/api/animals/sync-nascimento', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.data) {
        setToastSync({ tipo: 'ok', msg: data.data.mensagem || `${data.data.atualizados} animal(is) atualizado(s)` })
        if (data.data.atualizados > 0) {
          const r = await fetch('/api/animals?orderBy=created_at')
          const d = await r.json()
          if (d.success && d.data) setAllAnimals(d.data)
        }
      } else {
        setToastSync({ tipo: 'erro', msg: data.message || 'Erro ao sincronizar' })
      }
    } catch (e) {
      setToastSync({ tipo: 'erro', msg: 'Erro de conexão' })
    } finally {
      setSincronizandoNascimento(false)
      setTimeout(() => setToastSync(null), 4000)
    }
  }

  // Carregar todos os animais e ranking
  useEffect(() => {
    fetch('/api/animals?orderBy=created_at')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setAllAnimals(data.data)
          
          // Calcular ranking de peso (Top 10 maiores pesos)
          const animaisComPeso = data.data
            .filter(a => a.peso && a.peso > 0)
            .sort((a, b) => b.peso - a.peso)
            .slice(0, 10)
            .map((a, index) => ({
              ...a,
              posicao: index + 1,
              identificacao: `${a.serie || ''}-${a.rg || ''}`
            }))
          setRankingPeso(animaisComPeso)
          
          // Calcular ranking de CE (Top 10 maiores CE - apenas machos)
          const animaisComCE = data.data
            .filter(a => a.ce && a.ce > 0 && a.sexo && (a.sexo.toLowerCase().includes('m') || a.sexo === 'M'))
            .sort((a, b) => b.ce - a.ce)
            .slice(0, 10)
            .map((a, index) => ({
              ...a,
              posicao: index + 1,
              identificacao: `${a.serie || ''}-${a.rg || ''}`
            }))
          setRankingCE(animaisComCE)
        }
      })
      .catch(err => console.error('Erro ao carregar animais:', err))

    fetch('/api/animals/ranking-iabcz?limit=10')
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setRanking(data.data) })
      .catch(err => console.error('Erro ao carregar ranking:', err))

    fetch('/api/animals/ranking-deca?limit=10')
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setRankingDECA(data.data) })
      .catch(err => console.error('Erro ao carregar ranking DECA:', err))

    fetch('/api/animals/ranking-genetica-2?limit=10')
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setRankingIQG(data.data) })
      .catch(err => console.error('Erro ao carregar ranking IQG:', err))

    fetch('/api/animals/ranking-pt-iqg?limit=10')
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setRankingPtIQG(data.data) })
      .catch(err => console.error('Erro ao carregar ranking Pt IQG:', err))

    fetch('/api/animals/ranking-mgte?limit=10')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setRankingMGte(data.data)
        }
      })
      .catch(err => console.error('Erro ao carregar ranking MGTe:', err))
  }, [])

  const buscarAnimal = async (e, overrideSerie, overrideRg) => {
    if (e) e.preventDefault()
    const s = overrideSerie ?? serie
    const r = overrideRg ?? rg
    if (!s || !r) {
      setError('Digite a Série e o RG')
      return
    }
    setSerie(s)
    setRg(r)
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/animals?serie=${encodeURIComponent(s)}&rg=${encodeURIComponent(r)}`)
      const data = await response.json()

      if (data.success && data.data && data.data.length > 0) {
        const animalEncontrado = data.data[0]
        setAnimal(animalEncontrado)
        
        // Encontrar índice do animal na lista completa
        const idx = allAnimals.findIndex(a => a.id === animalEncontrado.id)
        setCurrentIndex(idx)
      } else {
        setError('Animal não encontrado')
        setAnimal(null)
      }
    } catch (err) {
      setError('Erro ao buscar animal')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const navegarAnimal = (direcao) => {
    if (allAnimals.length === 0) return
    
    let novoIndex = currentIndex
    
    if (direcao === 'primeiro') novoIndex = 0
    else if (direcao === 'anterior') novoIndex = Math.max(0, currentIndex - 1)
    else if (direcao === 'proximo') novoIndex = Math.min(allAnimals.length - 1, currentIndex + 1)
    else if (direcao === 'ultimo') novoIndex = allAnimals.length - 1
    
    if (novoIndex !== currentIndex && allAnimals[novoIndex]) {
      const novoAnimal = allAnimals[novoIndex]
      setAnimal(novoAnimal)
      setSerie(novoAnimal.serie)
      setRg(novoAnimal.rg)
      setCurrentIndex(novoIndex)
    }
  }

  const limparBusca = () => {
    setSerie('')
    setRg('')
    setAnimal(null)
    setError('')
    setCurrentIndex(-1)
  }

  // Buscar serie/rg da mãe quando não vier do backend
  useEffect(() => {
    if (!animal?.mae || (animal.serie_mae && animal.rg_mae)) {
      setMaeLink(null)
      setMaeColetas(null)
      return
    }
    const { serie, rg } = extrairSerieRG(animal.mae, animal.serie)
    if (serie && rg) {
      setMaeLink({ serie, rg })
      setMaeColetas(null)
      return
    }
    const params = new URLSearchParams({ mae: animal.mae.trim() })
    if (animal.serie) params.set('animalSerie', animal.serie)
    if (animal.rg) params.set('animalRg', animal.rg)
    fetch(`/api/animals/buscar-mae?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.serie && d.rg) {
          setMaeLink({ serie: d.serie, rg: d.rg })
          setMaeColetas(null)
        } else {
          setMaeLink(null)
          // Mãe não cadastrada: buscar se tem histórico de coletas FIV
          fetch(`/api/animals/doadora-coletas?identificador=${encodeURIComponent(animal.mae.trim())}`)
            .then(r2 => r2.json())
            .then(d2 => {
              if (d2.success && d2.data?.resumo) setMaeColetas(d2.data)
              else setMaeColetas(null)
            })
            .catch(() => setMaeColetas(null))
        }
      })
      .catch(() => {
        setMaeLink(null)
        fetch(`/api/animals/doadora-coletas?identificador=${encodeURIComponent(animal.mae.trim())}`)
          .then(r2 => r2.json())
          .then(d2 => {
            if (d2.success && d2.data?.resumo) setMaeColetas(d2.data)
            else setMaeColetas(null)
          })
          .catch(() => setMaeColetas(null))
      })
  }, [animal?.mae, animal?.serie, animal?.rg, animal?.serie_mae, animal?.rg_mae])

  // Buscar custos do animal
  const refreshCustos = async () => {
    if (!animal?.id) return
    setRefreshingCustos(true)
    try {
      const r = await fetch(`/api/animals/${animal.id}/custos`)
      const result = r.ok ? await r.json() : { data: [] }
      const custos = result.data || result.custos || []
      const total = custos.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)
      setCustoTotal(total)
      setCustosLista(custos)
    } catch {
      setCustoTotal(0)
      setCustosLista([])
    } finally {
      setRefreshingCustos(false)
    }
  }

  useEffect(() => {
    if (!animal?.id) {
      setCustoTotal(0)
      setCustosLista([])
      return
    }
    refreshCustos()
  }, [animal?.id])

  // Buscar resumo de baixas (próprias e como mãe)
  useEffect(() => {
    if (!animal?.serie || !animal?.rg) {
      setBaixasResumo(null)
      return
    }
    const params = new URLSearchParams({ serie: animal.serie, rg: animal.rg })
    fetch(`/api/animals/baixas-resumo?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setBaixasResumo(d.data)
        else setBaixasResumo(null)
      })
      .catch(() => setBaixasResumo(null))
  }, [animal?.serie, animal?.rg])

  // Buscar histórico FIV quando o animal é doadora (sua própria ficha)
  // Buscar posição MGTe do animal
  useEffect(() => {
    if (!animal?.serie || !animal?.rg) {
      setMgtePosicao(null)
      return
    }
    fetch(`/api/animals/ranking-mgte-posicao?serie=${encodeURIComponent(animal.serie)}&rg=${encodeURIComponent(animal.rg)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.posicao != null) {
          setMgtePosicao({ posicao: d.posicao, total: d.total, mgte: d.mgte })
        } else {
          setMgtePosicao(null)
        }
      })
      .catch(() => setMgtePosicao(null))
  }, [animal?.serie, animal?.rg])

  useEffect(() => {
    if (!animal?.id || !animal?.sexo) {
      setFichaDoadora(null)
      return
    }
    const isFemea = String(animal.sexo || '').toLowerCase().includes('f') || animal.sexo === 'F'
    if (!isFemea) {
      setFichaDoadora(null)
      return
    }
    const params = new URLSearchParams({ animalId: animal.id })
    if (animal.serie && animal.rg) params.set('identificador', `${animal.serie} ${animal.rg}`)
    else if (animal.nome) params.set('identificador', animal.nome.trim())
    fetch(`/api/animals/doadora-coletas?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.resumo) setFichaDoadora(d.data)
        else setFichaDoadora(null)
      })
      .catch(() => setFichaDoadora(null))
  }, [animal?.id, animal?.sexo, animal?.serie, animal?.rg, animal?.nome])

  return (
    <>
      <Head>
        <title>Beef-Sync Mobile | Buscar Animal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Beef-Sync Mobile</h1>
          <div className="flex gap-2">
            <button
              onClick={sincronizarNascimentos}
              disabled={sincronizandoNascimento}
              className="p-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 disabled:opacity-50 text-white"
              title="Sincronizar data de nascimento (nascimentos → animais)"
            >
              <ArrowPathIcon className={`h-5 w-5 ${sincronizandoNascimento ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/mobile-feedback')}
              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              title="Enviar Feedback"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/importacoes')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              title="Central de Importações"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/custos')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              title="Custos por Animal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toast sincronização nascimentos */}
        {toastSync && (
          <div className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
            toastSync.tipo === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toastSync.msg}
          </div>
        )}

        {/* Ordem: iABCZ, DECA, IQG, Pt IQG, MGTe (conforme planilha) */}
        {ranking.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-amber-500" />
              Ranking iABCZ (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quanto maior o iABCZ, melhor o animal</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ranking.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{r.abczg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rankingDECA.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-emerald-500" />
              Ranking DECA (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Menor DECA = melhor (1º lugar)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingDECA.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.deca}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rankingIQG.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-emerald-500" />
              Ranking IQG (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quanto maior o IQG, melhor o animal</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingIQG.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{(r.iqg ?? r.genetica_2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rankingPtIQG.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-cyan-500" />
              Ranking Pt IQG (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Percentil IQG</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingPtIQG.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{(r.pt_iqg ?? r.decile_2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rankingMGte.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-amber-600" />
              Ranking MGTe (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quanto maior o MGTe, melhor o animal</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingMGte.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{r.mgte}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Top 10 Peso */}
        {rankingPeso.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-green-500" />
              Ranking Peso (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Maiores pesos registrados</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingPeso.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">{r.peso} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Top 10 C.E */}
        {rankingCE.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrophyIcon className="h-5 w-5 text-purple-500" />
              Ranking CE (Top 10)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Maiores circunferências escrotais (machos)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rankingCE.map((r) => (
                <div
                  key={r.id}
                  onClick={() => buscarAnimal(null, r.serie, r.rg)}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      r.posicao === 1 ? 'bg-amber-500 text-white' :
                      r.posicao === 2 ? 'bg-gray-400 text-white' :
                      r.posicao === 3 ? 'bg-amber-700 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{r.identificacao}</span>
                  </div>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{r.ce} cm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Busca */}
        {!animal && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              🔍 Buscar Animal
            </h2>
            
            <form onSubmit={buscarAnimal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Série
                </label>
                <input
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder="Digite a Série ( CJCJ) "
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RG
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  placeholder="Digite o RG do animal"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !serie || !rg}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Buscar Animal
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Resultado */}
        {animal && (
          <div className="space-y-4">
            {/* Card Principal */}
            <div className={`rounded-2xl shadow-2xl p-5 ${
              animal.sexo?.toLowerCase().includes('macho') 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                : 'bg-gradient-to-br from-pink-600 to-purple-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={limparBusca}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium"
                >
                  ← Voltar
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  animal.situacao === 'Ativo' ? 'bg-green-500 text-white' :
                  animal.situacao === 'Vendido' ? 'bg-blue-500 text-white' :
                  animal.situacao === 'Morto' ? 'bg-red-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {animal.situacao || 'Ativo'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {animal.serie} {animal.rg}
              </h2>
              <p className="text-white/80 text-sm mb-1">
                ID: {animal.id} • {animal.raca}
              </p>
              <p className="text-white/90 text-sm font-medium">
                {animal.sexo} • {animal.meses || 0} meses
              </p>
              <p className="text-white/90 text-sm font-medium">
                Situação ABCZ: {animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'}
              </p>
              {(animal.mgte || mgtePosicao) && (
                <p className="text-white/90 text-sm font-bold mt-1">
                  🏆 MGTe: {animal.mgte || mgtePosicao?.mgte || '-'}
                  {mgtePosicao?.posicao != null && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-xs">
                      Posição {mgtePosicao.posicao} de {mgtePosicao.total}
                    </span>
                  )}
                </p>
              )}

              {/* Navegação */}
              {allAnimals.length > 0 && currentIndex >= 0 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/20">
                  <span className="text-white font-bold">
                    {currentIndex + 1} de {allAnimals.length}
                  </span>
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => navegarAnimal('primeiro')}
                      disabled={currentIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('anterior')}
                      disabled={currentIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('proximo')}
                      disabled={currentIndex === allAnimals.length - 1}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navegarAnimal('ultimo')}
                      disabled={currentIndex === allAnimals.length - 1}
                      className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custos */}
            <div
              onClick={() => router.push('/custos')}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Custo na Propriedade</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {Number(custoTotal).toFixed(2)}
                  </p>
                  {(parseFloat(animal.valor_venda || animal.valor_real || 0) || 0) > 0 && (
                    <p className="text-xs mt-1">
                      Venda: R$ {(parseFloat(animal.valor_venda || animal.valor_real || 0)).toFixed(2)}
                      {' • '}
                      <span className={((parseFloat(animal.valor_venda || animal.valor_real || 0) - custoTotal) / (custoTotal || 1) * 100) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        ROI {(((parseFloat(animal.valor_venda || animal.valor_real || 0) - custoTotal) / (custoTotal || 1)) * 100).toFixed(1)}%
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); refreshCustos() }}
                    disabled={refreshingCustos}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    title="Atualizar custos (alterações feitas no app)"
                  >
                    <ArrowPathIcon className={`h-4 w-4 text-gray-600 dark:text-gray-300 ${refreshingCustos ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Ver todos custos →</span>
                </div>
              </div>
              {custosLista.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                  {custosLista.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 truncate pr-2">
                        {c.subtipo || c.tipo || 'Custo'}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        R$ {(Number(c.valor) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {custosLista.length > 8 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      +{custosLista.length - 8} mais...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Destaque Baixas - MORTE/BAIXA */}
            {baixasResumo?.baixaPropria?.morto && !baixasResumo?.baixaPropria?.vendido && (
              <div className="bg-gradient-to-br from-gray-500/20 to-slate-600/20 dark:from-gray-900/30 dark:to-slate-900/30 rounded-xl shadow-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-2 flex items-center gap-2">
                  <span>⚠️</span> Morte/Baixa
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Causa: {baixasResumo.baixaPropria.causa || 'Não informada'}
                  {baixasResumo.baixaPropria.data_baixa && (
                    <span className="ml-2">• {new Date(baixasResumo.baixaPropria.data_baixa).toLocaleDateString('pt-BR')}</span>
                  )}
                </p>
              </div>
            )}

            {/* Destaque Baixas - Venda (NF, Data, Valor) */}
            {baixasResumo?.baixaPropria?.vendido && (
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl shadow-lg p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg mb-3 flex items-center gap-2">
                  <span>💰</span> Venda
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {baixasResumo.baixaPropria.numero_nf && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">NF</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">{baixasResumo.baixaPropria.numero_nf}</p>
                    </div>
                  )}
                  {baixasResumo.baixaPropria.data_venda && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Data</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">
                        {new Date(baixasResumo.baixaPropria.data_venda).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {baixasResumo.baixaPropria.valor != null && baixasResumo.baixaPropria.valor > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Valor</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                        R$ {Number(baixasResumo.baixaPropria.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {baixasResumo.baixaPropria.comprador && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Comprador: {baixasResumo.baixaPropria.comprador}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumo Mãe - Filhos vendidos e mortes/abates */}
            {baixasResumo?.resumoMae && (baixasResumo.resumoMae.qtdVendidos > 0 || baixasResumo.resumoMae.qtdMortesBaixas > 0) && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl shadow-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
                <h3 className="font-bold text-amber-800 dark:text-amber-200 text-lg mb-3 flex items-center gap-2">
                  <span>📊</span> Prole (Baixas)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {baixasResumo.resumoMae.qtdVendidos > 0 && (
                    <>
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Filhos vendidos</p>
                        <p className="font-bold text-amber-700 dark:text-amber-300">{baixasResumo.resumoMae.qtdVendidos}</p>
                      </div>
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Média de vendas</p>
                        <p className="font-bold text-amber-700 dark:text-amber-300">
                          R$ {Number(baixasResumo.resumoMae.mediaVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 col-span-2">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total vendas</p>
                        <p className="font-bold text-amber-700 dark:text-amber-300">
                          R$ {Number(baixasResumo.resumoMae.totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </>
                  )}
                  {baixasResumo.resumoMae.qtdMortesBaixas > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Mortes/Abates</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300">{baixasResumo.resumoMae.qtdMortesBaixas}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Histórico FIV - Doadora de Oócitos */}
            {fichaDoadora?.resumo && (
              <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl shadow-lg p-4 border border-pink-200/50 dark:border-pink-800/50">
                <h3 className="font-bold text-pink-800 dark:text-pink-200 text-lg mb-3 flex items-center gap-2">
                  <span>🧪</span> Histórico FIV (Doadora)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Coletas</p>
                    <p className="font-bold text-pink-700 dark:text-pink-300">{fichaDoadora.resumo.totalColetas}</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Oócitos (média)</p>
                    <p className="font-bold text-pink-700 dark:text-pink-300">{fichaDoadora.resumo.mediaOocitos} / coleta</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Total oócitos</p>
                    <p className="font-bold text-pink-700 dark:text-pink-300">{fichaDoadora.resumo.totalOocitos}</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Embriões (média)</p>
                    <p className="font-bold text-pink-700 dark:text-pink-300">{fichaDoadora.resumo.mediaEmbrioesProduzidos} / coleta</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Transferidos (média)</p>
                    <p className="font-bold text-pink-700 dark:text-pink-300">{fichaDoadora.resumo.totalEmbrioesTransferidos} total ({fichaDoadora.resumo.mediaEmbrioesTransferidos} / coleta)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação - Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push(`/animals/${animal.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PlusCircleIcon className="h-6 w-6" />
                <span className="text-sm">Lançar</span>
              </button>

              <button
                onClick={() => alert('Função em desenvolvimento')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PlusCircleIcon className="h-6 w-6" />
                <span className="text-sm">Lote</span>
              </button>

              <button
                onClick={() => alert('Função em desenvolvimento')}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <DocumentArrowDownIcon className="h-6 w-6" />
                <span className="text-sm">PDF</span>
              </button>

              <button
                onClick={() => router.push(`/animals/${animal.id}`)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <PencilIcon className="h-6 w-6" />
                <span className="text-sm">Editar</span>
              </button>
            </div>

            {/* Informações Detalhadas - Colapsáveis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">
                  📋 Informações
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Nome</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.nome || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Raça</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.raca || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Sexo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.sexo || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Idade</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.meses || 0} meses
                    </p>
                  </div>

                  {animal.peso && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Peso</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.peso} kg
                      </p>
                    </div>
                  )}

                  {animal.ce && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">CE</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.ce} cm
                      </p>
                    </div>
                  )}

                  {animal.data_nascimento && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Nascimento</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(animal.data_nascimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {(animal.abczg || animal.abczg === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">iABCZ</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {animal.abczg}
                      </p>
                    </div>
                  )}

                  {(animal.deca || animal.deca === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">DECA</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.deca}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">IQG</p>
                    <p className={`font-semibold ${((animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {(animal.iqg ?? animal.genetica_2) || (animal.iqg ?? animal.genetica_2) === 0 ? (animal.iqg ?? animal.genetica_2) : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Pt IQG</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {(animal.pt_iqg ?? animal.decile_2) || (animal.pt_iqg ?? animal.decile_2) === 0 ? (animal.pt_iqg ?? animal.decile_2) : '-'}
                    </p>
                  </div>

                  {(animal.mgte || animal.mgte === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">MGTe</p>
                      <p className="font-bold text-amber-600 dark:text-amber-400">
                        {animal.mgte}
                        {mgtePosicao?.posicao != null && (
                          <span className="ml-1 text-xs font-normal text-gray-600 dark:text-gray-400">
                            (pos. {mgtePosicao.posicao})
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {(animal.top || animal.top === 0) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">TOP</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.top}
                      </p>
                    </div>
                  )}

                  {animal.pai && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Pai</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {animal.pai}
                      </p>
                    </div>
                  )}

                  {animal.mae && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Mãe</p>
                      {(() => {
                        const s = animal.serie_mae || maeLink?.serie
                        const r = animal.rg_mae || maeLink?.rg
                        if (s && r) {
                          return (
                            <Link href={`/consulta-animal/${s}-${r}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                              {s} {r}
                            </Link>
                          )
                        }
                        return (
                          <>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {animal.mae}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              ⚠️ Não encontrada no cadastro (pode estar inativa)
                            </p>
                            {maeColetas?.resumo && (
                              <div className="mt-2 p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                                <p className="text-xs font-medium text-pink-800 dark:text-pink-200 mb-1">📋 Histórico de Coletas FIV</p>
                                <p className="text-xs text-pink-700 dark:text-pink-300">
                                  Coletas: {maeColetas.resumo.totalColetas} • Oócitos viáveis: {maeColetas.resumo.totalOocitos} (média {maeColetas.resumo.mediaOocitos})
                                </p>
                                <p className="text-xs text-pink-700 dark:text-pink-300">
                                  Embriões produzidos: {maeColetas.resumo.totalEmbrioesProduzidos} (média {maeColetas.resumo.mediaEmbrioesProduzidos}) • Transferidos: {maeColetas.resumo.totalEmbrioesTransferidos} (média {maeColetas.resumo.mediaEmbrioesTransferidos})
                                </p>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Receptora</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.receptora || '-'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Localização (Piquete)</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.piquete_atual || animal.piqueteAtual || animal.pasto_atual || animal.pastoAtual || 'Não informado'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Situação ABCZ</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {animal.situacao_abcz || animal.situacaoAbcz || 'Não informado'}
                    </p>
                  </div>
                </div>

                {animal.observacoes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Observações</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {animal.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botão Ver Detalhes Completos */}
            <button
              onClick={() => router.push(`/animals/${animal.id}`)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Ver Detalhes Completos
            </button>
          </div>
        )}
      </div>
    </>
  )
}
