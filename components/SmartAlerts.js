
import React, { useEffect, useState } from 'react'

import animalDataManager from '../services/animalDataManager'

export default function SmartAlerts() {
  const [alerts, setAlerts] = useState([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [animals, setAnimals] = useState([])

  useEffect(() => {
    const loadAnimals = () => {
      const currentAnimals = animalDataManager.getAllAnimals()
      setAnimals(currentAnimals)
    }

    loadAnimals()
    animalDataManager.addListener(loadAnimals)

    return () => {
      animalDataManager.removeListener(loadAnimals)
    }
  }, [])

  useEffect(() => {
    generateSmartAlerts()
  }, [animals])

  const generateSmartAlerts = () => {
    if (animals.length === 0) {
      setAlerts([])
      return
    }

    const newAlerts = []

    // Analisar cada animal para gerar alertas inteligentes
    animals.forEach(animal => {
      // Alerta de custo alto
      if (animal.custoTotal > 5000) {
        newAlerts.push({
          id: `high-cost-${animal.id}`,
          type: 'warning',
          priority: 'high',
          title: 'Custo Alto Detectado',
          message: `${animal.serie} ${animal.rg} tem custo de R$ ${(animal.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          animal: animal,
          action: 'Revisar custos',
          icon: '⚠️',
          color: 'bg-yellow-500'
        })
      }

      // Alerta de animal antigo sem venda
      if (animal.meses > 36 && animal.situacao === 'Ativo') {
        newAlerts.push({
          id: `old-animal-${animal.id}`,
          type: 'info',
          priority: 'medium',
          title: 'Animal Maduro',
          message: `${animal.serie} ${animal.rg} tem ${animal.meses} meses e ainda está ativo`,
          animal: animal,
          action: 'Considerar venda',
          icon: '🐄',
          color: 'bg-blue-500'
        })
      }

      // Alerta de ROI negativo
      if (animal.valorVenda && animal.valorVenda < animal.custoTotal) {
        const loss = animal.custoTotal - animal.valorVenda
        newAlerts.push({
          id: `negative-roi-${animal.id}`,
          type: 'error',
          priority: 'high',
          title: 'ROI Negativo',
          message: `${animal.serie} ${animal.rg} teve prejuízo de R$ ${loss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          animal: animal,
          action: 'Analisar causas',
          icon: '📉',
          color: 'bg-red-500'
        })
      }

      // Alerta de oportunidade (animal com bom ROI)
      if (animal.valorVenda && animal.valorVenda > animal.custoTotal * 1.3) {
        newAlerts.push({
          id: `good-roi-${animal.id}`,
          type: 'success',
          priority: 'low',
          title: 'Excelente Performance',
          message: `${animal.serie} ${animal.rg} teve ROI de ${(((animal.valorVenda - animal.custoTotal) / animal.custoTotal) * 100).toFixed(1)}%`,
          animal: animal,
          action: 'Replicar estratégia',
          icon: '🏆',
          color: 'bg-green-500'
        })
      }
    })

    // Alertas gerais do sistema
    const totalInvested = animals.reduce((acc, a) => acc + a.custoTotal, 0)
    const avgCost = animals.length > 0 ? totalInvested / animals.length : 0

    if (avgCost > 3000) {
      newAlerts.push({
        id: 'high-avg-cost',
        type: 'warning',
        priority: 'medium',
        title: 'Custo Médio Elevado',
        message: `Custo médio por animal: R$ ${avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        action: 'Otimizar custos',
        icon: '💰',
        color: 'bg-orange-500'
      })
    }

    // Ordenar por prioridade
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    newAlerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    setAlerts(newAlerts.slice(0, 10)) // Limitar a 10 alertas
  }

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-3 text-2xl">🚨</span>
          Alertas Inteligentes
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {alerts.length} alertas
          </span>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {showAlerts ? 'Ocultar' : 'Mostrar todos'}
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-sm">Nenhum alerta no momento</div>
          <div className="text-xs mt-1">Tudo funcionando perfeitamente!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {(showAlerts ? alerts : alerts.slice(0, 3)).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.priority)} transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-full ${alert.color} text-white flex-shrink-0`}>
                    <span className="text-sm">{alert.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    {alert.action && (
                      <div className="mt-2 flex items-center space-x-2">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          {alert.action}
                        </button>
                        {alert.animal && (
                          <button className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                            Ver animal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {!showAlerts && alerts.length > 3 && (
            <button
              onClick={() => setShowAlerts(true)}
              className="w-full p-3 text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Ver mais {alerts.length - 3} alertas
            </button>
          )}
        </div>
      )}

      {/* Estatísticas dos Alertas */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {alerts.filter(a => a.priority === 'high').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Alta Prioridade</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {alerts.filter(a => a.priority === 'medium').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Média Prioridade</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {alerts.filter(a => a.priority === 'low').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Baixa Prioridade</div>
          </div>
        </div>
      </div>
    </div>
  )
}