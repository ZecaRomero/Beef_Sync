import React, { useState, useEffect } from 'react'
import { 
  HeartIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card.js'
import Button from '../ui/Button.js'
import Badge from '../ui/Badge.js'

export default function CoverageTypeCard() {
  const [data, setData] = useState({
    totalIA: 0,
    totalFIV: 0,
    monthlyData: [],
    recentCoverages: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    loadCoverageData()
  }, [selectedPeriod, selectedType])

  const loadCoverageData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/reports/coverage-types?period=${selectedPeriod}&type=${selectedType}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de cobertura')
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao carregar dados de cobertura:', error)
      // Dados de exemplo para demonstração
      setData({
        totalIA: 122,
        totalFIV: 45,
        monthlyData: [
          { month: '2025-09', ia: 21, fiv: 8, total: 29 },
          { month: '2025-10', ia: 18, fiv: 12, total: 30 },
          { month: '2025-11', ia: 30, fiv: 15, total: 45 },
          { month: '2025-12', ia: 25, fiv: 10, total: 35 },
          { month: '2026-01', ia: 28, fiv: 0, total: 28 }
        ],
        recentCoverages: [
          {
            id: 1,
            type: 'IA',
            animal: 'CJCJ 15639',
            bull: 'JAMBU FIV DA GAROUPA',
            date: '2025-12-05',
            status: 'Prenha',
            location: 'PIQ 1'
          },
          {
            id: 2,
            type: 'IA',
            animal: 'CJCJ 16235',
            bull: 'JAMBU FIV DA GAROUPA',
            date: '2025-11-13',
            status: 'Prenha',
            location: 'PIQ 13'
          },
          {
            id: 3,
            type: 'FIV',
            animal: 'CJCA 6',
            bull: 'B7661 FIV DA EAO',
            date: '2025-03-08',
            status: 'Prenha',
            location: 'PIQ 11'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'IA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'FIV':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Prenha':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Não Prenha':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const totalCoverages = data.totalIA + data.totalFIV
  const iaPercentage = totalCoverages > 0 ? ((data.totalIA / totalCoverages) * 100).toFixed(1) : 0
  const fivPercentage = totalCoverages > 0 ? ((data.totalFIV / totalCoverages) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando dados de cobertura...</p>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
              <HeartIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🧬 Coberturas por Tipo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                IA vs FIV - Análise temporal
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os Tipos</option>
              <option value="IA">Apenas IA</option>
              <option value="FIV">Apenas FIV</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.totalIA}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Inseminação Artificial
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {iaPercentage}% do total
            </div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.totalFIV}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Fertilização In Vitro
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {fivPercentage}% do total
            </div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {totalCoverages}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Total de Coberturas
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Período selecionado
            </div>
          </div>
        </div>

        {/* Gráfico Temporal */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Evolução Mensal
          </h4>
          
          <div className="space-y-3">
            {data.monthlyData.map((monthData, index) => {
              const maxValue = Math.max(...data.monthlyData.map(d => d.total))
              const iaWidth = maxValue > 0 ? (monthData.ia / maxValue) * 100 : 0
              const fivWidth = maxValue > 0 ? (monthData.fiv / maxValue) * 100 : 0
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {formatMonth(monthData.month)}
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="flex h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 transition-all duration-300"
                        style={{ width: `${iaWidth}%` }}
                        title={`IA: ${monthData.ia}`}
                      />
                      <div 
                        className="bg-purple-500 transition-all duration-300"
                        style={{ width: `${fivWidth}%` }}
                        title={`FIV: ${monthData.fiv}`}
                      />
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white mix-blend-difference">
                        {monthData.total}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      {monthData.ia}
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                      {monthData.fiv}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Coberturas Recentes */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Coberturas Recentes
          </h4>
          
          <div className="space-y-2">
            {data.recentCoverages.map((coverage) => (
              <div
                key={coverage.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Badge className={getTypeColor(coverage.type)} size="sm">
                    {coverage.type}
                  </Badge>
                  
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {coverage.animal}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {coverage.bull} • {coverage.location}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(coverage.status)} size="sm">
                    {coverage.status}
                  </Badge>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(coverage.date).toLocaleDateString('pt-BR')}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Ver detalhes"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {data.recentCoverages.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <HeartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma cobertura encontrada no período selecionado</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FunnelIcon className="h-4 w-4" />}
              >
                Filtros Avançados
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowTrendingUpIcon className="h-4 w-4" />}
              >
                Análise Detalhada
              </Button>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ChartBarIcon className="h-4 w-4" />}
            >
              Gerar Relatório
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}