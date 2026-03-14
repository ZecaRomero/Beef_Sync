
import React, { useMemo } from 'react'

import { formatCurrency } from '../../utils/formatters'

const AdvancedStats = ({ animals, costs, sales }) => {
  const stats = useMemo(() => {
    // Estatísticas por raça
    const racaStats = animals.reduce((acc, animal) => {
      if (!acc[animal.raca]) {
        acc[animal.raca] = { count: 0, totalWeight: 0, totalCost: 0 }
      }
      acc[animal.raca].count++
      acc[animal.raca].totalWeight += animal.peso || 0
      acc[animal.raca].totalCost += animal.custoTotal || 0
      return acc
    }, {})

    // Estatísticas por ERA
    const eraStats = animals.reduce((acc, animal) => {
      if (!acc[animal.era]) {
        acc[animal.era] = { count: 0, avgWeight: 0, totalCost: 0 }
      }
      acc[animal.era].count++
      acc[animal.era].totalCost += animal.custoTotal || 0
      return acc
    }, {})

    // Calcular médias de peso por ERA
    Object.keys(eraStats).forEach(era => {
      const animalsInEra = animals.filter(a => a.era === era)
      const totalWeight = animalsInEra.reduce((sum, a) => sum + (a.peso || 0), 0)
      eraStats[era].avgWeight = animalsInEra.length > 0 ? totalWeight / animalsInEra.length : 0
    })

    // ROI médio
    const totalInvestment = costs.reduce((sum, cost) => sum + (cost.valor || 0), 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.valor || 0), 0)
    const avgROI = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0

    // Custo médio por animal
    const avgCostPerAnimal = animals.length > 0 ? totalInvestment / animals.length : 0

    // Peso médio do rebanho
    const totalWeight = animals.reduce((sum, animal) => sum + (animal.peso || 0), 0)
    const avgWeight = animals.length > 0 ? totalWeight / animals.length : 0

    return {
      racaStats,
      eraStats,
      avgROI,
      avgCostPerAnimal,
      avgWeight,
      totalInvestment,
      totalRevenue
    }
  }, [animals, costs, sales])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Estatísticas por Raça */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Distribuição por Raça
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.racaStats).map(([raca, data]) => (
            <div key={raca} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{raca}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {data.count} animais • Peso médio: {Math.round(data.totalWeight / data.count)}kg
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  custo total
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas por ERA */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 Distribuição por ERA
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.eraStats).map(([era, data]) => (
            <div key={era} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{era}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {data.count} animais • {Math.round(data.avgWeight)}kg médio
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  investido
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas Financeiras */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💰 Métricas Financeiras
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.avgROI.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ROI Médio</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(stats.avgCostPerAnimal)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Custo/Animal</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.totalInvestment)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Investido</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(stats.avgWeight)}kg
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Peso Médio</div>
          </div>
        </div>
      </div>

      {/* Performance do Rebanho */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Performance do Rebanho
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Taxa de Mortalidade</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {((animals.filter(a => a.situacao === 'Morto').length / animals.length) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Animais Ativos</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {animals.filter(a => a.situacao === 'Ativo').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Animais Vendidos</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {animals.filter(a => a.situacao === 'Vendido').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Receita Total</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalRevenue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedStats