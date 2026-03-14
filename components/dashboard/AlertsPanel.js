
import React, { useMemo } from 'react'

import { formatDate } from '../../utils/formatters'
import { useExamesAndrologicosAlerts } from '../../hooks/useExamesAndrologicosAlerts'

const AlertsPanel = ({ animals, costs }) => {
  const { alerts: examesAlerts, loading: examesLoading } = useExamesAndrologicosAlerts()
  const alerts = useMemo(() => {
    const alertsList = []

    // Alertas de vacinação pendente
    animals.forEach(animal => {
      if (animal.situacao !== 'Ativo') return
      
      const birthDate = new Date(animal.dataNascimento)
      const now = new Date()
      const ageInMonths = (now - birthDate) / (1000 * 60 * 60 * 24 * 30)

      // Verificar se precisa de vacinação baseado na ERA
      if (ageInMonths >= 4 && ageInMonths <= 8) {
        const hasVaccination = costs.some(cost => 
          cost.animalId === animal.id && 
          cost.tipo === 'Medicamentos' && 
          cost.subtipo === 'Vacinas Obrigatórias'
        )
        
        if (!hasVaccination) {
          alertsList.push({
            type: 'vaccination',
            priority: 'high',
            title: 'Vacinação Pendente',
            message: `${animal.nome} precisa de vacinação obrigatória`,
            animal: animal.nome,
            action: 'Agendar vacinação',
            icon: '💉',
            color: 'red'
          })
        }
      }

      // Alertas de peso baixo para a idade
      const expectedWeight = getExpectedWeight(animal.sexo, ageInMonths)
      if (animal.peso < expectedWeight * 0.8) {
        alertsList.push({
          type: 'weight',
          priority: 'medium',
          title: 'Peso Abaixo do Esperado',
          message: `${animal.nome} está com peso baixo para a idade`,
          animal: animal.nome,
          action: 'Revisar manejo',
          icon: '⚖️',
          color: 'yellow'
        })
      }

      // Alertas de exame reprodutivo
      if (animal.sexo === 'Macho' && ageInMonths >= 24) {
        const hasAndrologico = costs.some(cost => 
          cost.animalId === animal.id && 
          cost.tipo === 'Veterinários' && 
          cost.subtipo === 'Andrológico'
        )
        
        if (!hasAndrologico) {
          alertsList.push({
            type: 'reproductive',
            priority: 'medium',
            title: 'Exame Andrológico Pendente',
            message: `${animal.nome} precisa de exame reprodutivo`,
            animal: animal.nome,
            action: 'Agendar exame',
            icon: '🔬',
            color: 'blue'
          })
        }
      }
    })

    // Alertas de custos altos
    const avgCostPerAnimal = costs.reduce((sum, cost) => sum + cost.valor, 0) / animals.length
    animals.forEach(animal => {
      const animalCosts = costs.filter(c => c.animalId === animal.id)
      const totalCost = animalCosts.reduce((sum, cost) => sum + cost.valor, 0)
      
      if (totalCost > avgCostPerAnimal * 1.5) {
        alertsList.push({
          type: 'cost',
          priority: 'low',
          title: 'Custo Elevado',
          message: `${animal.nome} tem custos acima da média`,
          animal: animal.nome,
          action: 'Revisar custos',
          icon: '💸',
          color: 'orange'
        })
      }
    })

    // Adicionar alertas de exames andrológicos
    if (!examesLoading && examesAlerts.length > 0) {
      alertsList.push(...examesAlerts)
    }

    // Ordenar por prioridade
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return alertsList.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }, [animals, costs, examesAlerts, examesLoading])

  const getExpectedWeight = (sexo, ageInMonths) => {
    const weights = {
      'Macho': { 3: 120, 6: 180, 9: 240, 12: 300, 18: 420, 24: 520, 36: 650 },
      'Fêmea': { 3: 100, 6: 150, 9: 200, 12: 250, 18: 350, 24: 420, 36: 500 }
    }
    
    const animalWeights = weights[sexo] || weights['Macho']
    const ages = Object.keys(animalWeights).map(Number).sort((a, b) => a - b)
    
    for (let i = 0; i < ages.length; i++) {
      if (ageInMonths <= ages[i]) {
        return animalWeights[ages[i]]
      }
    }
    
    return animalWeights[ages[ages.length - 1]]
  }

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🚨 Alertas e Notificações
      </h3>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 dark:text-green-500 text-4xl mb-2">✅</div>
          <p className="text-gray-500 dark:text-gray-400">Nenhum alerta no momento</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Seu rebanho está em dia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 8).map((alert, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getColorClasses(alert.color)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{alert.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {alert.message}
                    </p>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">
                      {alert.action}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {alerts.length > 8 && (
            <div className="text-center pt-4">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Ver todos os {alerts.length} alertas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AlertsPanel