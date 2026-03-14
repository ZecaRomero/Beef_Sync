import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  BanknotesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export default function LeilaoDashboard() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAnalysis()
  }, [])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/comercial/market-analysis')
      if (response.ok) {
        const result = await response.json()
        setAnalysis(result.data)
      } else {
        console.error('Erro ao carregar anÃ¡lise')
      }
    } catch (error) {
      console.error('Erro ao carregar anÃ¡lise:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAnalyses = () => {
    if (!analysis || !analysis.analises) return []
    switch (filter) {
      case 'aptos':
        return analysis.analises.filter(a => a.apto_venda)
      case 'recomendados':
        return analysis.analises.filter(a => a.score >= 70)
      case 'nao_recomendados':
        return analysis.analises.filter(a => !a.apto_venda)
      default:
        return analysis.analises
    }
  }

  const getRecommendationColor = (recomendacao) => {
    if (recomendacao?.includes('Altamente')) return 'text-green-600 dark:text-green-400'
    if (recomendacao?.includes('Recomendado')) return 'text-blue-600 dark:text-blue-400'
    if (recomendacao?.includes('Cautela')) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRecommendationIcon = (recomendacao) => {
    if (recomendacao?.includes('Altamente')) return CheckCircleIcon
    if (recomendacao?.includes('Recomendado')) return CheckCircleIcon
    if (recomendacao?.includes('Cautela')) return ExclamationTriangleIcon
    return XCircleIcon
  }

  // Calcular totais para resumo
  const totalCusto = analysis?.analises?.reduce((acc, a) => acc + (a.valor_atual || 0), 0) || 0
  const totalEstimado = analysis?.analises?.reduce((acc, a) => acc + (a.valor_estimado_mercado || 0), 0) || 0
  const lucroPotencial = totalEstimado - totalCusto
  const roiMedio = totalCusto > 0 ? ((lucroPotencial / totalCusto) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Analisando animais para leilÃ£o...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BanknotesIcon className="h-8 w-8 text-amber-600" />
            Dashboard LeilÃ£o
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Custo atual, sugestÃ£o de venda e ROI dos animais para leilÃ£o
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leilao/importar">
            <Button variant="outline" className="flex items-center gap-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              Importar Excel
            </Button>
          </Link>
          <Button onClick={loadAnalysis} className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de resumo financeiro */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Custo Total Hoje</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">SugestÃ£o de Venda</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <TagIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Lucro Potencial</p>
                <p className={`text-2xl font-bold ${lucroPotencial >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-600 dark:text-red-400'}`}>
                  R$ {lucroPotencial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowTrendingUpIcon className={`h-10 w-10 ${lucroPotencial >= 0 ? 'text-blue-600' : 'text-red-500'}`} />
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">ROI MÃ©dio</p>
                <p className={`text-2xl font-bold ${roiMedio >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-red-600 dark:text-red-400'}`}>
                  {roiMedio >= 0 ? '+' : ''}{roiMedio.toFixed(1)}%
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
          </Card>
        </div>
      )}

      {/* EstatÃ­sticas rÃ¡pidas */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Analisado</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{analysis.total_analisados}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Aptos para LeilÃ£o</p>
            <p className="text-xl font-bold text-green-600">{analysis.aptos_venda}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Altamente Recomendados</p>
            <p className="text-xl font-bold text-purple-600">{analysis.recomendados}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de AprovaÃ§Ã£o</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {analysis.total_analisados > 0
                ? ((analysis.aptos_venda / analysis.total_analisados) * 100).toFixed(1)
                : 0}%
            </p>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {analysis?.analises?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `Todos (${analysis.analises.length})` },
            { key: 'aptos', label: `Aptos (${analysis.aptos_venda})` },
            { key: 'recomendados', label: `Recomendados (${analysis.recomendados})` },
            { key: 'nao_recomendados', label: `NÃ£o Recomendados (${analysis.total_analisados - analysis.aptos_venda})` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de animais */}
      <div className="grid grid-cols-1 gap-4">
        {getFilteredAnalyses().map((item) => {
          const RecommendationIcon = getRecommendationIcon(item.recomendacao)
          return (
            <Card
              key={item.animal_id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-amber-500"
              onClick={() => setSelectedAnimal(selectedAnimal?.animal_id === item.animal_id ? null : item)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {item.identificacao}
                    </h3>
                    <RecommendationIcon className={`h-6 w-6 flex-shrink-0 ${getRecommendationColor(item.recomendacao)}`} />
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRecommendationColor(item.recomendacao)} bg-opacity-10`}>
                      {item.recomendacao}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      Score: {item.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Custo Hoje</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {(item.valor_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">SugestÃ£o Venda</p>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {(item.valor_estimado_mercado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ROI</p>
                      <p className={`text-lg font-semibold ${item.roi_estimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.roi_estimado >= 0 ? '+' : ''}{(item.roi_estimado || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lucro</p>
                      <p className={`text-lg font-semibold ${(item.valor_estimado_mercado - item.valor_atual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {((item.valor_estimado_mercado - item.valor_atual) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {item.fatores?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.fatores.map((fator, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs">
                          âÅ“â€œ {fator}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedAnimal?.animal_id === item.animal_id && item.justificativa?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ObservaÃ§Ãµes:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {item.justificativa.map((just, idx) => (
                          <li key={idx}>{just}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {(!analysis || !analysis.analises || analysis.analises.length === 0) && (
        <Card className="p-12 text-center">
          <BanknotesIcon className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Nenhum animal encontrado para anÃ¡lise de leilÃ£o
          </p>
          <Link href="/leilao/importar">
            <Button className="flex items-center gap-2 mx-auto">
              <DocumentArrowDownIcon className="h-5 w-5" />
              Importar dados do Excel
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
