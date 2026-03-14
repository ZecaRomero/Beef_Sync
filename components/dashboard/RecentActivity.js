
import React, { useMemo } from 'react'

import { formatDate, formatCurrency } from '../../utils/formatters'

const RecentActivity = ({ animals, costs, sales }) => {
  const recentActivities = useMemo(() => {
    const activities = []

    // Nascimentos recentes (últimos 30 dias)
    const recentBirths = animals.filter(animal => {
      if (!animal.dataNascimento) return false
      const birthDate = new Date(animal.dataNascimento)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return birthDate >= thirtyDaysAgo
    })

    recentBirths.forEach(animal => {
      activities.push({
        type: 'birth',
        date: animal.dataNascimento,
        title: `Nascimento: ${animal.nome}`,
        description: `${animal.sexo} • ${animal.raca} • ${animal.peso}kg`,
        icon: '🐄',
        color: 'green'
      })
    })

    // Custos recentes (últimos 15 dias)
    const recentCosts = costs.filter(cost => {
      if (!cost.data) return false
      const costDate = new Date(cost.data)
      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
      return costDate >= fifteenDaysAgo
    })

    recentCosts.forEach(cost => {
      const animal = animals.find(a => a.id === cost.animalId)
      activities.push({
        type: 'cost',
        date: cost.data,
        title: `${cost.tipo}: ${formatCurrency(cost.valor)}`,
        description: `${animal?.nome || 'Animal'} • ${cost.descricao}`,
        icon: '💰',
        color: 'blue'
      })
    })

    // Vendas recentes
    sales.forEach(sale => {
      const animal = animals.find(a => a.id === sale.animalId)
      activities.push({
        type: 'sale',
        date: sale.data,
        title: `Venda: ${formatCurrency(sale.valor)}`,
        description: `${animal?.nome || 'Animal'} • ${sale.comprador}`,
        icon: '💵',
        color: 'purple'
      })
    })

    // Ordenar por data (mais recente primeiro)
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
  }, [animals, costs, sales])

  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📋 Atividades Recentes
      </h3>
      
      {recentActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-2xl">{activity.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColorClasses(activity.color)}`}>
                    {activity.type === 'birth' ? 'Nascimento' : 
                     activity.type === 'cost' ? 'Custo' : 'Venda'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDate(activity.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity