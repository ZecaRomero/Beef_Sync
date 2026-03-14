
import React, { useMemo } from 'react'

import { formatCurrency } from '../../utils/formatters'

const EnhancedDashboard = ({ animals, costs, sales = [] }) => {
  const stats = useMemo(() => {
    if (!animals || !Array.isArray(animals)) {
      return {
        totalAnimals: 0,
        activeAnimals: 0,
        totalCosts: 0,
        totalRevenue: 0,
        avgCostPerAnimal: 0,
        roi: 0,
        breedDistribution: {},
        ageDistribution: {},
        recentBirths: 0
      }
    }

    // Estatísticas básicas
    const totalAnimals = animals.length
    const activeAnimals = animals.filter(a => a.situacao === 'Ativo').length
    const totalCosts = costs?.reduce((sum, cost) => sum + (parseFloat(cost.valor) || 0), 0) || 0
    const totalRevenue = sales?.reduce((sum, sale) => sum + (parseFloat(sale.valor) || 0), 0) || 0
    const avgCostPerAnimal = totalAnimals > 0 ? totalCosts / totalAnimals : 0
    const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0

    // Distribuição por raça
    const breedDistribution = animals.reduce((acc, animal) => {
      const breed = animal.raca || 'Não informado'
      acc[breed] = (acc[breed] || 0) + 1
      return acc
    }, {})

    // Distribuição por idade (ERA)
    const ageDistribution = animals.reduce((acc, animal) => {
      // Calcular idade em meses baseado na data de nascimento
      if (animal.dataNascimento) {
        const birthDate = new Date(animal.dataNascimento)
        const now = new Date()
        const ageInMonths = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30))
        
        let ageGroup = 'Adulto'
        if (ageInMonths <= 3) ageGroup = '0-3 meses'
        else if (ageInMonths <= 8) ageGroup = '4-8 meses'
        else if (ageInMonths <= 12) ageGroup = '9-12 meses'
        else if (ageInMonths <= 24) ageGroup = '1-2 anos'
        else if (ageInMonths <= 36) ageGroup = '2-3 anos'
        
        acc[ageGroup] = (acc[ageGroup] || 0) + 1
      }
      return acc
    }, {})

    // Nascimentos recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentBirths = animals.filter(animal => {
      if (!animal.dataNascimento) return false
      const birthDate = new Date(animal.dataNascimento)
      return birthDate >= thirtyDaysAgo
    }).length

    return {
      totalAnimals,
      activeAnimals,
      totalCosts,
      totalRevenue,
      avgCostPerAnimal,
      roi,
      breedDistribution,
      ageDistribution,
      recentBirths
    }
  }, [animals, costs, sales])

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-lg">🐄</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Animais</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAnimals}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 dark:text-green-400">
              {stats.activeAnimals} ativos
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-lg">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Investido</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalCosts)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(stats.avgCostPerAnimal)} por animal
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-lg">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ROI</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.roi.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm ${stats.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(stats.totalRevenue)} em vendas
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-lg">🍼</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nascimentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.recentBirths}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Últimos 30 dias
            </span>
          </div>
        </div>
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Raça */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Distribuição por Raça
          </h3>
          {Object.keys(stats.breedDistribution).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.breedDistribution).map(([breed, count]) => (
                <div key={breed} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {breed}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.totalAnimals) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribuição por Idade */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📅 Distribuição por Idade
          </h3>
          {Object.keys(stats.ageDistribution).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.ageDistribution).map(([age, count]) => (
                <div key={age} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {age}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.totalAnimals) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard