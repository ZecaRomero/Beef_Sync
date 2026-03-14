
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { 
  ChartBarIcon, 
  ClockIcon, 
  CpuChipIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function PerformanceOptimizations() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    apiResponseTime: 0
  })
  const [optimizations, setOptimizations] = useState({
    lazyLoading: true,
    imageOptimization: true,
    codeSplitting: true,
    caching: true,
    compression: true,
    virtualScrolling: false,
    memoization: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformanceMetrics()
    loadOptimizationSettings()
  }, [])

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true)
      
      // Simular coleta de métricas de performance
      const metrics = {
        loadTime: Math.random() * 2000 + 500, // 500-2500ms
        renderTime: Math.random() * 100 + 50, // 50-150ms
        memoryUsage: Math.random() * 50 + 10, // 10-60MB
        cacheHitRate: Math.random() * 30 + 70, // 70-100%
        apiResponseTime: Math.random() * 500 + 100 // 100-600ms
      }
      
      setPerformanceMetrics(metrics)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOptimizationSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('beefsync_performance') || '{}')
      setOptimizations({ ...optimizations, ...saved })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const saveOptimizationSettings = (newSettings) => {
    try {
      localStorage.setItem('beefsync_performance', JSON.stringify(newSettings))
      setOptimizations(newSettings)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const handleOptimizationChange = (key, value) => {
    const newSettings = { ...optimizations, [key]: value }
    saveOptimizationSettings(newSettings)
  }

  const getPerformanceScore = useMemo(() => {
    const { loadTime, renderTime, memoryUsage, cacheHitRate, apiResponseTime } = performanceMetrics
    
    // Calcular score baseado nas métricas (0-100)
    const loadScore = Math.max(0, 100 - (loadTime / 25)) // Penaliza tempos > 2.5s
    const renderScore = Math.max(0, 100 - (renderTime / 1.5)) // Penaliza tempos > 150ms
    const memoryScore = Math.max(0, 100 - (memoryUsage / 0.6)) // Penaliza uso > 60MB
    const cacheScore = cacheHitRate // Cache hit rate já é uma porcentagem
    const apiScore = Math.max(0, 100 - (apiResponseTime / 6)) // Penaliza tempos > 600ms
    
    const averageScore = (loadScore + renderScore + memoryScore + cacheScore + apiScore) / 5
    return Math.round(averageScore)
  }, [performanceMetrics])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return CheckCircleIcon
    if (score >= 60) return ExclamationTriangleIcon
    return ExclamationTriangleIcon
  }

  const formatMetric = (value, type) => {
    switch (type) {
      case 'time':
        return `${value.toFixed(0)}ms`
      case 'memory':
        return `${value.toFixed(1)}MB`
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toString()
    }
  }

  const PerformanceCard = ({ title, value, type, icon: Icon, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="h-6 w-6 text-gray-500" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatMetric(value, type)}
          </p>
        </div>
      </div>
    </div>
  )

  const OptimizationToggle = ({ key, title, description, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(key, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const ScoreIcon = getScoreIcon(getPerformanceScore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⚡ Otimizações de Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitore e otimize a performance do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <ScoreIcon className={`h-8 w-8 ${getScoreColor(getPerformanceScore)}`} />
          <div className="text-right">
            <p className={`text-3xl font-bold ${getScoreColor(getPerformanceScore)}`}>
              {getPerformanceScore}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
          </div>
        </div>
      </div>

      {/* Métricas de Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Métricas Atuais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PerformanceCard
            title="Tempo de Carregamento"
            value={performanceMetrics.loadTime}
            type="time"
            icon={ClockIcon}
            description="Tempo para carregar a página"
          />
          <PerformanceCard
            title="Tempo de Renderização"
            value={performanceMetrics.renderTime}
            type="time"
            icon={ChartBarIcon}
            description="Tempo para renderizar componentes"
          />
          <PerformanceCard
            title="Uso de Memória"
            value={performanceMetrics.memoryUsage}
            type="memory"
            icon={CpuChipIcon}
            description="Memória utilizada pelo sistema"
          />
          <PerformanceCard
            title="Taxa de Cache"
            value={performanceMetrics.cacheHitRate}
            type="percentage"
            icon={BoltIcon}
            description="Eficiência do cache"
          />
          <PerformanceCard
            title="Tempo de API"
            value={performanceMetrics.apiResponseTime}
            type="time"
            icon={ChartBarIcon}
            description="Tempo de resposta das APIs"
          />
        </div>
      </div>

      {/* Otimizações */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configurações de Otimização
        </h3>
        <div className="space-y-3">
          <OptimizationToggle
            key="lazyLoading"
            title="Carregamento Preguiçoso"
            description="Carrega componentes apenas quando necessário"
            enabled={optimizations.lazyLoading}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="imageOptimization"
            title="Otimização de Imagens"
            description="Comprime e otimiza imagens automaticamente"
            enabled={optimizations.imageOptimization}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="codeSplitting"
            title="Divisão de Código"
            description="Divide o código em chunks menores"
            enabled={optimizations.codeSplitting}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="caching"
            title="Sistema de Cache"
            description="Armazena dados em cache para acesso rápido"
            enabled={optimizations.caching}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="compression"
            title="Compressão"
            description="Comprime dados para reduzir tamanho"
            enabled={optimizations.compression}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="virtualScrolling"
            title="Scroll Virtual"
            description="Renderiza apenas itens visíveis em listas grandes"
            enabled={optimizations.virtualScrolling}
            onChange={handleOptimizationChange}
          />
          <OptimizationToggle
            key="memoization"
            title="Memoização"
            description="Cache de resultados de funções computacionalmente caras"
            enabled={optimizations.memoization}
            onChange={handleOptimizationChange}
          />
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💡 Recomendações de Performance
        </h3>
        <div className="space-y-3">
          {getPerformanceScore < 60 && (
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Performance baixa detectada. Considere habilitar mais otimizações.
              </p>
            </div>
          )}
          {performanceMetrics.loadTime > 2000 && (
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tempo de carregamento alto. Ative compressão e cache.
              </p>
            </div>
          )}
          {performanceMetrics.memoryUsage > 50 && (
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Alto uso de memória. Considere scroll virtual para listas grandes.
              </p>
            </div>
          )}
          {getPerformanceScore >= 80 && (
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Excelente performance! O sistema está otimizado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between items-center">
        <button
          onClick={loadPerformanceMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Atualizar Métricas
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
