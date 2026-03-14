
import React, { useEffect, useMemo, useState } from 'react'

import { formatDate, formatCurrency } from '../../utils/formatters'

const SmartNotifications = ({ animals, costs }) => {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, high, medium, low

  const intelligentAlerts = useMemo(() => {
    if (!animals || !Array.isArray(animals) || !costs || !Array.isArray(costs)) {
      return []
    }

    const alerts = []
    const now = new Date()

    animals.forEach(animal => {
      if (animal.situacao !== 'Ativo') return

      // Calcular idade em meses
      const birthDate = new Date(animal.dataNascimento)
      const ageInMonths = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30))

      // Custos do animal
      const animalCosts = costs.filter(c => c.animalId === animal.id)
      const totalCost = animalCosts.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0)

      // 1. Alertas de Vacinação
      const hasRecentVaccination = animalCosts.some(cost => {
        if (cost.tipo !== 'Medicamentos' || cost.subtipo !== 'Vacinas Obrigatórias') return false
        const costDate = new Date(cost.data)
        const daysSince = (now - costDate) / (1000 * 60 * 60 * 24)
        return daysSince <= 365 // Vacinação nos últimos 12 meses
      })

      if (ageInMonths >= 4 && !hasRecentVaccination) {
        alerts.push({
          id: `vaccination-${animal.id}`,
          type: 'vaccination',
          priority: 'high',
          title: 'Vacinação Pendente',
          message: `${animal.nome || animal.numero} precisa de vacinação obrigatória`,
          animal: animal.nome || animal.numero,
          animalId: animal.id,
          action: 'Agendar vacinação',
          icon: '💉',
          color: 'red',
          createdAt: now.toISOString()
        })
      }

      // 2. Alertas de Peso
      const expectedWeights = {
        'Macho': { 6: 180, 12: 300, 18: 420, 24: 520, 36: 650 },
        'Fêmea': { 6: 150, 12: 250, 18: 350, 24: 420, 36: 500 }
      }

      const weights = expectedWeights[animal.sexo] || expectedWeights['Macho']
      const expectedWeight = getExpectedWeight(weights, ageInMonths)
      
      if (animal.peso && expectedWeight && animal.peso < expectedWeight * 0.8) {
        alerts.push({
          id: `weight-${animal.id}`,
          type: 'weight',
          priority: 'medium',
          title: 'Peso Abaixo do Esperado',
          message: `${animal.nome || animal.numero} está com ${animal.peso}kg (esperado: ${expectedWeight}kg)`,
          animal: animal.nome || animal.numero,
          animalId: animal.id,
          action: 'Revisar manejo',
          icon: '⚖️',
          color: 'yellow',
          createdAt: now.toISOString()
        })
      }

      // 3. Alertas de Custo Alto
      const avgCostPerAnimal = costs.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0) / animals.length
      if (totalCost > avgCostPerAnimal * 1.5) {
        alerts.push({
          id: `cost-${animal.id}`,
          type: 'cost',
          priority: 'low',
          title: 'Custo Elevado',
          message: `${animal.nome || animal.numero} tem custos de ${formatCurrency(totalCost)} (média: ${formatCurrency(avgCostPerAnimal)})`,
          animal: animal.nome || animal.numero,
          animalId: animal.id,
          action: 'Revisar custos',
          icon: '💸',
          color: 'orange',
          createdAt: now.toISOString()
        })
      }

      // 4. Alertas Reprodutivos
      if (animal.sexo === 'Macho' && ageInMonths >= 24) {
        const hasAndrologico = animalCosts.some(cost => 
          cost.tipo === 'Veterinários' && cost.subtipo === 'Andrológico'
        )
        
        if (!hasAndrologico) {
          alerts.push({
            id: `reproductive-${animal.id}`,
            type: 'reproductive',
            priority: 'medium',
            title: 'Exame Reprodutivo Pendente',
            message: `${animal.nome || animal.numero} precisa de exame andrológico`,
            animal: animal.nome || animal.numero,
            animalId: animal.id,
            action: 'Agendar exame',
            icon: '🔬',
            color: 'blue',
            createdAt: now.toISOString()
          })
        }
      }

      // 5. Alertas de Idade Avançada
      if (ageInMonths >= 120) { // 10 anos
        alerts.push({
          id: `age-${animal.id}`,
          type: 'age',
          priority: 'low',
          title: 'Animal Idoso',
          message: `${animal.nome || animal.numero} tem ${Math.floor(ageInMonths/12)} anos - considere aposentadoria`,
          animal: animal.nome || animal.numero,
          animalId: animal.id,
          action: 'Avaliar aposentadoria',
          icon: '👴',
          color: 'gray',
          createdAt: now.toISOString()
        })
      }
    })

    // Ordenar por prioridade e data
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return alerts.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [animals, costs])

  const getExpectedWeight = (weights, ageInMonths) => {
    const ages = Object.keys(weights).map(Number).sort((a, b) => a - b)
    
    for (let i = 0; i < ages.length; i++) {
      if (ageInMonths <= ages[i]) {
        return weights[ages[i]]
      }
    }
    
    return weights[ages[ages.length - 1]]
  }

  const filteredNotifications = intelligentAlerts.filter(notification => {
    if (filter === 'all') return true
    return notification.priority === filter
  })

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
    }
    return colors[color] || colors.blue
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
    const labels = { high: 'Alta', medium: 'Média', low: 'Baixa' }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[priority]}`}>
        {labels[priority]}
      </span>
    )
  }

  const dismissNotification = (notificationId) => {
    // Em um sistema real, isso seria salvo no banco de dados
    console.log('Dismissing notification:', notificationId)
  }

  const priorityCounts = intelligentAlerts.reduce((acc, notification) => {
    acc[notification.priority] = (acc[notification.priority] || 0) + 1
    return acc
  }, {})

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔔 Notificações Inteligentes
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            Todas ({intelligentAlerts.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              filter === 'high' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            Alta ({priorityCounts.high || 0})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              filter === 'medium' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            Média ({priorityCounts.medium || 0})
          </button>
        </div>
      </div>
      
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 dark:text-green-500 text-4xl mb-2">✅</div>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'Nenhuma notificação no momento' : `Nenhuma notificação de prioridade ${filter}`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Seu rebanho está em dia!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className={`border rounded-lg p-4 ${getColorClasses(notification.color)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-xl">{notification.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4">
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {notification.action}
                      </button>
                      <button 
                        onClick={() => dismissNotification(notification.id)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SmartNotifications