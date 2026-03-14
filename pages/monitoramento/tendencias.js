import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import {
  ChartBarIcon,
  TrendingUpIcon as ArrowTrendingUpIcon,
  TrendingDownIcon as ArrowTrendingDownIcon,
  CalendarIcon
} from '../../components/ui/Icons'

export default function TrendAnalysis() {
  const [mounted, setMounted] = useState(false)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    loadTrendData()
  }, [mounted])

  const loadTrendData = async () => {
    try {
      setLoading(true)

      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // Carregar dados reais do sistema
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const pesagens = JSON.parse(localStorage.getItem('pesagens') || '[]')
      const custos = JSON.parse(localStorage.getItem('custosNutricionais') || '[]')
      const nascimentos = JSON.parse(localStorage.getItem('birthData') || '[]')
      
      // Calcular métricas reais
      const totalAnimais = animals.length
      const animaisSaudaveis = animals.filter(a => a.situacao === 'Ativo').length
      const indiceSaude = totalAnimais > 0 ? Math.round((animaisSaudaveis / totalAnimais) * 100) : 0
      
      const custoTotal = custos.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0)
      
      const femeasGestantes = animals.filter(a => a.sexo === 'Fêmea' && a.situacao === 'Ativo').length
      const totalNascimentos = nascimentos.length
      const eficienciaReprodutiva = femeasGestantes > 0 ? Math.round((totalNascimentos / femeasGestantes) * 100) : 0

      const trendData = [
        {
          id: 'crescimento',
          title: 'Crescimento do Rebanho',
          current: totalAnimais,
          trend: totalAnimais > 0 ? 'up' : 'neutral',
          percentage: 0, // Seria necessário dados históricos para calcular
          description: 'Número total de animais cadastrados'
        },
        {
          id: 'saude',
          title: 'Índice de Saúde',
          current: indiceSaude,
          unit: '%',
          trend: indiceSaude >= 90 ? 'up' : indiceSaude >= 70 ? 'neutral' : 'down',
          percentage: 0, // Seria necessário dados históricos para calcular
          description: 'Percentual de animais ativos/saudáveis'
        },
        {
          id: 'reproducao',
          title: 'Eficiência Reprodutiva',
          current: eficienciaReprodutiva,
          unit: '%',
          trend: eficienciaReprodutiva >= 80 ? 'up' : eficienciaReprodutiva >= 60 ? 'neutral' : 'down',
          percentage: 0, // Seria necessário dados históricos para calcular
          description: 'Nascimentos registrados por fêmea'
        },
        {
          id: 'custos',
          title: 'Custos Operacionais',
          current: Math.round(custoTotal),
          unit: 'R$',
          trend: custoTotal > 0 ? 'neutral' : 'up',
          percentage: 0, // Seria necessário dados históricos para calcular
          description: 'Custos operacionais registrados'
        }
      ]

      setTrends(trendData)
    } catch (error) {
      console.error('Erro ao carregar tendências:', error)
      setTrends([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando análise de tendências...</p>
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
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            Análise de Tendências
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Previsões e análises preditivas do seu rebanho
          </p>
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trends.map((trend) => (
          <Card key={trend.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {trend.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {trend.current}
                  <span className="text-sm text-gray-500 ml-2">{trend.unit || ''}</span>
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                trend.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20' : 
                trend.trend === 'down' ? 'bg-red-100 dark:bg-red-900/20' : 
                'bg-gray-100 dark:bg-gray-700'
              }`}>
                {trend.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                ) : trend.trend === 'down' ? (
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                ) : (
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className={`text-sm font-medium ${
                trend.trend === 'up' ? 'text-green-600' : 
                trend.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trend.percentage !== 0 ? (
                  `${trend.trend === 'up' ? '+' : ''}${trend.percentage}%`
                ) : (
                  'Dados atuais'
                )}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trend.description}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Predictions Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Previsões para os Próximos 30 Dias
        </h2>

        <div className="space-y-4">
          {trends.length > 0 ? (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📈 Crescimento do Rebanho
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {trends.find(t => t.id === 'crescimento')?.current > 0 
                    ? `Rebanho atual: ${trends.find(t => t.id === 'crescimento')?.current} animais. Continue registrando nascimentos para acompanhar o crescimento.`
                    : 'Cadastre animais no sistema para começar a acompanhar o crescimento do rebanho.'
                  }
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Saúde do Rebanho
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {trends.find(t => t.id === 'saude')?.current > 0
                    ? `Índice atual: ${trends.find(t => t.id === 'saude')?.current}%. Mantenha protocolos sanitários para preservar a saúde.`
                    : 'Registre o status dos animais para monitorar a saúde do rebanho.'
                  }
                </p>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  📊 Custos Operacionais
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {trends.find(t => t.id === 'custos')?.current > 0
                    ? `Custos registrados: R$ ${trends.find(t => t.id === 'custos')?.current.toLocaleString('pt-BR')}. Continue registrando para análise de tendências.`
                    : 'Registre custos operacionais para acompanhar os gastos.'
                  }
                </p>
              </div>

              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">
                  🐄 Eficiência Reprodutiva
                </h3>
                <p className="text-sm text-pink-800 dark:text-pink-200">
                  {trends.find(t => t.id === 'reproducao')?.current > 0
                    ? `Eficiência atual: ${trends.find(t => t.id === 'reproducao')?.current}%. Continue registrando nascimentos para melhor análise.`
                    : 'Registre nascimentos e dados reprodutivos para calcular a eficiência.'
                  }
                </p>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Dados Insuficientes para Previsões
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Cadastre animais, registre nascimentos e custos para gerar análises preditivas.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💡 Insights e Recomendações
        </h2>

        <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">→</span>
            <span>Registre dados consistentemente para obter análises mais precisas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">→</span>
            <span>Mantenha protocolos sanitários atualizados para preservar a saúde do rebanho</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">→</span>
            <span>Monitore custos operacionais regularmente para otimizar gastos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">→</span>
            <span>Acompanhe indicadores reprodutivos para maximizar a eficiência</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">→</span>
            <span>Use relatórios para tomar decisões baseadas em dados reais</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
