import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function AnaliseMercado() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [filter, setFilter] = useState('all') // all, aptos, recomendados, nao_recomendados

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
        console.error('Erro ao carregar análise')
      }
    } catch (error) {
      console.error('Erro ao carregar análise:', error)
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
    if (recomendacao.includes('Altamente')) return 'text-green-600 dark:text-green-400'
    if (recomendacao.includes('Recomendado')) return 'text-blue-600 dark:text-blue-400'
    if (recomendacao.includes('Cautela')) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRecommendationIcon = (recomendacao) => {
    if (recomendacao.includes('Altamente')) return CheckCircleIcon
    if (recomendacao.includes('Recomendado')) return CheckCircleIcon
    if (recomendacao.includes('Cautela')) return ExclamationTriangleIcon
    return XCircleIcon
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Analisando mercado...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-purple-600" />
            Análise de Mercado e ROI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise inteligente de animais aptos para venda conforme condições de mercado
          </p>
        </div>
        <Button onClick={loadAnalysis} className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5" />
          Atualizar Análise
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Analisado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.total_analisados}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aptos para Venda</p>
                <p className="text-2xl font-bold text-green-600">
                  {analysis.aptos_venda}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Altamente Recomendados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analysis.recomendados}
                </p>
              </div>
              <SparklesIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.total_analisados > 0 
                    ? ((analysis.aptos_venda / analysis.total_analisados) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Todos ({analysis?.analises?.length || 0})
        </button>
        <button
          onClick={() => setFilter('aptos')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'aptos'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Aptos ({analysis?.aptos_venda || 0})
        </button>
        <button
          onClick={() => setFilter('recomendados')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'recomendados'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Recomendados ({analysis?.recomendados || 0})
        </button>
        <button
          onClick={() => setFilter('nao_recomendados')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'nao_recomendados'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Não Recomendados ({(analysis?.total_analisados || 0) - (analysis?.aptos_venda || 0)})
        </button>
      </div>

      {/* Lista de Análises */}
      <div className="grid grid-cols-1 gap-4">
        {getFilteredAnalyses().map((item) => {
          const RecommendationIcon = getRecommendationIcon(item.recomendacao)
          return (
            <Card 
              key={item.animal_id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedAnimal(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {item.identificacao}
                    </h3>
                    <RecommendationIcon 
                      className={`h-6 w-6 ${getRecommendationColor(item.recomendacao)}`} 
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRecommendationColor(item.recomendacao)} bg-opacity-10`}>
                      {item.recomendacao}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      Score: {item.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valor Atual</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {(item.valor_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Valor Estimado Mercado</p>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {(item.valor_estimado_mercado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ROI Estimado</p>
                      <p className={`text-lg font-semibold ${item.roi_estimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.roi_estimado >= 0 ? '+' : ''}{item.roi_estimado.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Potencial</p>
                      <p className={`text-lg font-semibold ${(item.valor_estimado_mercado - item.valor_atual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {((item.valor_estimado_mercado - item.valor_atual) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {item.fatores.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fatores Positivos:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.fatores.map((fator, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs"
                          >
                            ✓ {fator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.justificativa.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Observações:
                      </p>
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
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum animal encontrado para análise
          </p>
        </Card>
      )}
    </div>
  )
}
