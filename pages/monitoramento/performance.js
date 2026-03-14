import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '../../components/ui/Icons'

export default function PerformanceMonitoring() {
  const [mounted, setMounted] = useState(false)
  const [performanceData, setPerformanceData] = useState({
    rebanhoTotal: 0,
    animaisAtivos: 0,
    crescimentoMedio: 0,
    taxaMortalidade: 0,
    eficienciaReproducao: 0,
    custoPorAnimal: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('rebanho')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    loadPerformanceData()
    const interval = setInterval(loadPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // Carregar dados do localStorage
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const births = JSON.parse(localStorage.getItem('birthData') || '[]')

      if (Array.isArray(animals) && animals.length > 0) {
        const rebanhoTotal = animals.length
        const animaisAtivos = animals.filter(a => a.situacao === 'Ativo').length
        
        // Calcular crescimento médio (simulado com variação)
        const crescimentoMedio = rebanhoTotal > 0 ? (animaisAtivos / rebanhoTotal * 100).toFixed(1) : '0.0'
        
        // Taxa de mortalidade (simulada)
        const mortos = animals.filter(a => a.situacao === 'Morto').length
        const taxaMortalidade = rebanhoTotal > 0 ? ((mortos / rebanhoTotal) * 100).toFixed(2) : '0.00'
        
        // Eficiência de reprodução
        const nascidos = births.filter(b => b.status === 'nascido').length
        const divisorReproducao = rebanhoTotal * 0.3
        const eficienciaReproducao = divisorReproducao > 0 ? (nascidos / divisorReproducao * 100).toFixed(1) : '0.0'
        
        // Custo por animal
        const custoTotal = animals.reduce((sum, a) => sum + (parseFloat(a.custoTotal || a.custo_total) || 0), 0)
        const custoPorAnimal = rebanhoTotal > 0 ? (custoTotal / rebanhoTotal).toFixed(2) : '0.00'

        setPerformanceData({
          rebanhoTotal,
          animaisAtivos,
          crescimentoMedio: Math.min(parseFloat(crescimentoMedio), 100),
          taxaMortalidade: parseFloat(taxaMortalidade),
          eficienciaReproducao: Math.min(parseFloat(eficienciaReproducao), 100),
          custoPorAnimal: parseFloat(custoPorAnimal)
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados de performance...</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      id: 'rebanho',
      title: 'Rebanho Total',
      value: performanceData.rebanhoTotal,
      unit: 'animais',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      trend: 'stable',
      description: 'Total de animais no sistema'
    },
    {
      id: 'ativos',
      title: 'Animais Ativos',
      value: performanceData.animaisAtivos,
      unit: 'animais',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      trend: 'up',
      description: 'Animais em situação ativa'
    },
    {
      id: 'crescimento',
      title: 'Taxa de Crescimento',
      value: performanceData.crescimentoMedio,
      unit: '%',
      icon: TrendingUpIcon,
      color: 'bg-emerald-500',
      trend: 'up',
      description: 'Percentual de crescimento'
    },
    {
      id: 'mortalidade',
      title: 'Taxa de Mortalidade',
      value: performanceData.taxaMortalidade,
      unit: '%',
      icon: TrendingDownIcon,
      color: 'bg-red-500',
      trend: performanceData.taxaMortalidade > 5 ? 'down' : 'stable',
      description: 'Percentual de perdas'
    },
    {
      id: 'reproducao',
      title: 'Eficiência Reprodutiva',
      value: performanceData.eficienciaReproducao,
      unit: '%',
      icon: CheckCircleIcon,
      color: 'bg-pink-500',
      trend: 'up',
      description: 'Eficiência de nascimentos'
    },
    {
      id: 'custo',
      title: 'Custo por Animal',
      value: `R$ ${performanceData.custoPorAnimal}`,
      unit: 'mensais',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      trend: 'stable',
      description: 'Custo médio operacional'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            Performance do Rebanho
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Indicadores e métricas em tempo real
          </p>
        </div>
        <Button onClick={loadPerformanceData} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon
          return (
            <Card 
              key={metric.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMetric(metric.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                    <span className="text-sm text-gray-500 ml-2">{metric.unit}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {metric.description}
                  </p>
                </div>
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Detailed View */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análise Detalhada
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saúde do Rebanho
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {100 - performanceData.taxaMortalidade}% saudável
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${100 - performanceData.taxaMortalidade}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Crescimento do Rebanho
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {performanceData.crescimentoMedio}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${performanceData.crescimentoMedio}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Eficiência Reprodutiva
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {performanceData.eficienciaReproducao}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${performanceData.eficienciaReproducao}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      <Card className="p-6 border-l-4 border-yellow-500">
        <div className="flex items-start gap-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Alertas de Performance
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {performanceData.taxaMortalidade > 5 && (
                <li>⚠️ Taxa de mortalidade acima do esperado ({performanceData.taxaMortalidade}%)</li>
              )}
              {performanceData.eficienciaReproducao < 60 && (
                <li>⚠️ Eficiência reprodutiva baixa - verificar protocolos</li>
              )}
              {performanceData.custoPorAnimal > 100 && (
                <li>⚠️ Custo por animal elevado - otimizar recursos</li>
              )}
              {performanceData.taxaMortalidade <= 5 && performanceData.eficienciaReproducao >= 60 && (
                <li>✓ Performance dentro dos padrões esperados</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
