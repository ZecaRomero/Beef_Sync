
import React, { useState } from 'react'

const mockAnimals = []

export default function AdvancedCharts({ timeRange }) {
  const [selectedChart, setSelectedChart] = useState('costs')

  // Preparar dados para gráficos
  const prepareChartData = () => {
    const custosPorTipo = mockAnimals.reduce((acc, animal) => {
      animal.custos?.forEach(custo => {
        if (custo.valor > 0) {
          acc[custo.tipo] = (acc[custo.tipo] || 0) + custo.valor
        }
      })
      return acc
    }, {})

    const animaisPorRaca = mockAnimals.reduce((acc, animal) => {
      acc[animal.raca] = (acc[animal.raca] || 0) + 1
      return acc
    }, {})

    const roiPorMes = {
      'Jan': 15.2, 'Fev': 18.7, 'Mar': 22.1, 'Abr': 19.8,
      'Mai': 25.3, 'Jun': 28.9, 'Jul': 31.2, 'Ago': 29.5,
      'Set': 33.1, 'Out': 35.7, 'Nov': 38.2, 'Dez': 41.5
    }

    const custosTemporais = {
      'Jan': 12500, 'Fev': 15800, 'Mar': 18200, 'Abr': 16900,
      'Mai': 21300, 'Jun': 24700, 'Jul': 27100, 'Ago': 25800,
      'Set': 29400, 'Out': 32100, 'Nov': 34600, 'Dez': 37200
    }

    return { custosPorTipo, animaisPorRaca, roiPorMes, custosTemporais }
  }

  const { custosPorTipo, animaisPorRaca, roiPorMes, custosTemporais } = prepareChartData()

  const chartTypes = [
    { id: 'costs', label: '💰 Custos por Tipo', data: custosPorTipo },
    { id: 'breeds', label: '🐄 Animais por Raça', data: animaisPorRaca },
    { id: 'roi', label: '📈 ROI Mensal', data: roiPorMes },
    { id: 'timeline', label: '📊 Custos Temporais', data: custosTemporais }
  ]

  const renderBarChart = (data, type) => {
    const maxValue = Math.max(...Object.values(data))
    const total = Object.values(data).reduce((acc, val) => acc + val, 0)
    
    const categoryColors = {
      'Nascimento': 'from-green-400 to-green-600',
      'DNA': 'from-purple-400 to-purple-600',
      'Medicamentos': 'from-red-400 to-red-600',
      'Veterinários': 'from-blue-400 to-blue-600',
      'Aquisição': 'from-indigo-400 to-indigo-600',
      'Nelore': 'from-blue-400 to-blue-600',
      'Brahman': 'from-red-400 to-red-600',
      'Gir': 'from-green-400 to-green-600',
      'Receptora': 'from-purple-400 to-purple-600'
    }

    const sortedData = Object.entries(data).sort(([,a], [,b]) => b - a)

    return (
      <div className="space-y-4">
        {/* Header com total */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === 'costs' || type === 'timeline' 
              ? `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : total.toString()
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {type === 'costs' && 'Total de Custos'}
            {type === 'breeds' && 'Total de Animais'}
            {type === 'roi' && 'ROI Médio Anual'}
            {type === 'timeline' && 'Custos Acumulados'}
          </div>
        </div>

        {/* Gráfico */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedData.map(([key, value], index) => {
            const percentage = ((value / maxValue) * 100)
            const colors = categoryColors[key] || 'from-gray-400 to-gray-600'
            
            return (
              <div
                key={key}
                className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {key}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {type === 'costs' || type === 'timeline'
                        ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : type === 'roi'
                        ? `${value}%`
                        : value.toString()
                      }
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`bg-gradient-to-r ${colors} h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute -top-6 right-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderLineChart = (data) => {
    const entries = Object.entries(data)
    const maxValue = Math.max(...Object.values(data))
    const minValue = Math.min(...Object.values(data))
    
    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedChart === 'roi' ? `${(Object.values(data).reduce((a, b) => a + b, 0) / entries.length).toFixed(1)}%` : 'Tendência'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedChart === 'roi' ? 'ROI Médio Anual' : 'Evolução Temporal'}
          </div>
        </div>

        <div className="relative h-64 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="400"
                y2={i * 40}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-300 dark:text-gray-600"
              />
            ))}

            {/* Data line */}
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              points={entries.map(([, value], index) => {
                const x = (index / (entries.length - 1)) * 400
                const y = 200 - ((value - minValue) / (maxValue - minValue)) * 180
                return `${x},${y}`
              }).join(' ')}
            />

            {/* Data points */}
            {entries.map(([label, value], index) => {
              const x = (index / (entries.length - 1)) * 400
              const y = 200 - ((value - minValue) / (maxValue - minValue)) * 180
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="url(#gradient)"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-xs fill-current text-gray-600 dark:text-gray-400"
                  >
                    {selectedChart === 'roi' ? `${value}%` : `R$ ${(value/1000).toFixed(0)}k`}
                  </text>
                  <text
                    x={x}
                    y={190}
                    textAnchor="middle"
                    className="text-xs fill-current text-gray-500 dark:text-gray-500"
                  >
                    {label}
                  </text>
                </g>
              )
            })}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-3 text-2xl">📊</span>
          Análises Avançadas
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Período: {timeRange}
        </div>
      </div>

      {/* Seletor de Gráficos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {chartTypes.map(chart => (
          <button
            key={chart.id}
            onClick={() => setSelectedChart(chart.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedChart === chart.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {chart.label}
          </button>
        ))}
      </div>

      {/* Renderizar Gráfico */}
      <div className="min-h-96">
        {(selectedChart === 'roi' || selectedChart === 'timeline') 
          ? renderLineChart(chartTypes.find(c => c.id === selectedChart)?.data)
          : renderBarChart(chartTypes.find(c => c.id === selectedChart)?.data, selectedChart)
        }
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Insights Inteligentes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {selectedChart === 'costs' && (
            <>
              <div>📈 Custos operacionais sob controle</div>
              <div>🎯 Mantenha o foco na eficiência</div>
            </>
          )}
          {selectedChart === 'breeds' && (
            <>
              <div>🐄 Nelore é a raça predominante no rebanho</div>
              <div>📊 Diversificação racial está equilibrada</div>
            </>
          )}
          {selectedChart === 'roi' && (
            <>
              <div>📈 ROI mostra tendência crescente no ano</div>
              <div>🎯 Meta de 20% de ROI está sendo atingida</div>
            </>
          )}
          {selectedChart === 'timeline' && (
            <>
              <div>📊 Custos crescem consistentemente</div>
              <div>⚡ Pico de custos no final do ano</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}