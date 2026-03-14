import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrendingUpIcon
} from '../../components/ui/Icons'

export default function ExecutiveDashboard() {
  const [mounted, setMounted] = useState(false)
  const [businessData, setBusinessData] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    roi: 0,
    profit: 0,
    rebanhoSize: 0,
    activeAnimals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    loadExecutiveData()
    const interval = setInterval(loadExecutiveData, 60000)
    return () => clearInterval(interval)
  }, [mounted])

  const loadExecutiveData = async () => {
    try {
      setLoading(true)
      
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      
      const totalCosts = animals.reduce((sum, a) => sum + (a.custoTotal || 0), 0)
      const totalRevenue = animals.reduce((sum, a) => sum + (a.valorVenda || 0), 0)
      const profit = totalRevenue - totalCosts
      const roi = totalCosts > 0 ? ((profit / totalCosts) * 100) : 0
      const activeAnimals = animals.filter(a => a.situacao === 'Ativo').length

      setBusinessData({
        totalRevenue,
        totalCosts,
        roi,
        profit,
        rebanhoSize: animals.length,
        activeAnimals
      })
    } catch (error) {
      console.error('Erro ao carregar dados executivos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard executivo...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const kpis = [
    {
      title: 'Receita Total',
      value: formatCurrency(businessData.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      trend: 'up',
      percentage: 8.2,
      description: 'Receita gerada pelas vendas'
    },
    {
      title: 'Custos Totais',
      value: formatCurrency(businessData.totalCosts),
      icon: CurrencyDollarIcon,
      color: 'bg-orange-500',
      trend: 'down',
      percentage: -2.1,
      description: 'Despesas operacionais'
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(businessData.profit),
      icon: TrendingUpIcon,
      color: 'bg-blue-500',
      trend: businessData.profit >= 0 ? 'up' : 'down',
      percentage: businessData.profit >= 0 ? 12.5 : -5.3,
      description: 'Resultado da operação'
    },
    {
      title: 'ROI',
      value: `${businessData.roi.toFixed(1)}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      trend: businessData.roi >= 10 ? 'up' : 'down',
      percentage: 5.7,
      description: 'Retorno sobre investimento'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            Dashboard Executivo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Visão gerencial de KPIs e indicadores estratégicos
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {kpi.value}
                  </p>
                </div>
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? '↑' : '↓'} {Math.abs(kpi.percentage)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {kpi.description}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rebanho Overview */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" />
            Visão do Rebanho
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Total de Animais</span>
              <span className="text-2xl font-bold text-blue-600">{businessData.rebanhoSize}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Animais Ativos</span>
              <span className="text-2xl font-bold text-green-600">{businessData.activeAnimals}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Taxa de Atividade</span>
              <span className="text-2xl font-bold text-purple-600">
                {businessData.rebanhoSize > 0 ? ((businessData.activeAnimals / businessData.rebanhoSize) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            Resumo Financeiro
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-green-900 dark:text-green-100">Receita</span>
              <span className="font-bold text-green-700 dark:text-green-300">
                {formatCurrency(businessData.totalRevenue)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <span className="text-orange-900 dark:text-orange-100">Custos</span>
              <span className="font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(businessData.totalCosts)}
              </span>
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              businessData.profit >= 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <span className={businessData.profit >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                Lucro Líquido
              </span>
              <span className={`font-bold ${businessData.profit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatCurrency(businessData.profit)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Strategic Indicators */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Indicadores Estratégicos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">Custo por Animal</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {businessData.rebanhoSize > 0 
                ? formatCurrency(businessData.totalCosts / businessData.rebanhoSize)
                : 'R$ 0,00'
              }
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-900 dark:text-green-100 mb-2">Receita por Animal</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {businessData.rebanhoSize > 0 
                ? formatCurrency(businessData.totalRevenue / businessData.rebanhoSize)
                : 'R$ 0,00'
              }
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">Margem Operacional</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {businessData.totalRevenue > 0 
                ? ((businessData.profit / businessData.totalRevenue) * 100).toFixed(1)
                : 0
              }%
            </p>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Recomendações Executivas
        </h2>
        
        <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {businessData.roi < 10 && (
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400 font-bold mt-1">!</span>
              <span><strong>Otimizar ROI:</strong> Considere revisar estratégias de custo para melhorar o retorno sobre investimento</span>
            </li>
          )}
          
          {businessData.profit < 0 && (
            <li className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 font-bold mt-1">!</span>
              <span><strong>Análise de Viabilidade:</strong> Lucratividade negativa requer revisão urgente de custos e preços</span>
            </li>
          )}
          
          {businessData.rebanhoSize > 500 && (
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
              <span><strong>Escala Atingida:</strong> Com {businessData.rebanhoSize} animais, aproveite economias de escala</span>
            </li>
          )}
          
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold mt-1">✓</span>
            <span><strong>Monitoramento Contínuo:</strong> Acompanhe KPIs mensalmente para identificar tendências cedo</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
