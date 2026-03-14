
import React, { useEffect, useState } from 'react'

import { ExclamationTriangleIcon, ClockIcon, HeartIcon } from './ui/Icons'

export default function BirthAlerts() {
  const [births, setBirths] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    loadBirths()
  }, [])

  const loadBirths = () => {
    const savedBirths = localStorage.getItem('birthData')
    if (savedBirths) {
      const birthData = JSON.parse(savedBirths)
      setBirths(birthData)
      generateAlerts(birthData)
    }
  }

  const generateAlerts = (birthData) => {
    const newAlerts = []
    const today = new Date()

    // Receptoras com parto atrasado
    const atrasadas = birthData.filter(b => b.status === 'gestante_atrasada')
    if (atrasadas.length > 0) {
      newAlerts.push({
        id: 'receptoras-atrasadas',
        type: 'warning',
        priority: 'high',
        title: `${atrasadas.length} Receptoras com Parto Atrasado`,
        message: `Receptoras que deveriam ter parido: ${atrasadas.map(b => b.receptora).join(', ')}`,
        icon: ExclamationTriangleIcon,
        color: 'bg-yellow-500',
        count: atrasadas.length,
        action: 'Verificar receptoras'
      })
    }

    // Gestantes próximas do parto (próximos 7 dias)
    const gestantesProximas = birthData.filter(b => {
      if (b.status !== 'gestante' || !b.nascimento) return false
      
      // Simular data baseada no campo nascimento (formato MM/YY)
      const [mes, ano] = b.nascimento.split('/')
      const dataPrevisao = new Date(2000 + parseInt(ano), parseInt(mes) - 1, 15)
      const diffDays = Math.ceil((dataPrevisao - today) / (1000 * 60 * 60 * 24))
      
      return diffDays >= 0 && diffDays <= 7
    })

    if (gestantesProximas.length > 0) {
      newAlerts.push({
        id: 'partos-proximos',
        type: 'info',
        priority: 'medium',
        title: `${gestantesProximas.length} Partos Previstos nos Próximos 7 Dias`,
        message: `Receptoras próximas do parto: ${gestantesProximas.map(b => b.receptora).join(', ')}`,
        icon: ClockIcon,
        color: 'bg-blue-500',
        count: gestantesProximas.length,
        action: 'Preparar para partos'
      })
    }

    // Taxa de mortalidade alta (mais de 20%)
    const totalNascimentos = birthData.filter(b => ['nascido', 'morto', 'aborto'].includes(b.status)).length
    const mortos = birthData.filter(b => ['morto', 'aborto'].includes(b.status)).length
    const taxaMortalidade = totalNascimentos > 0 ? (mortos / totalNascimentos) * 100 : 0

    if (taxaMortalidade > 20 && totalNascimentos >= 5) {
      newAlerts.push({
        id: 'alta-mortalidade',
        type: 'error',
        priority: 'high',
        title: `Taxa de Mortalidade Alta: ${taxaMortalidade.toFixed(1)}%`,
        message: `${mortos} mortes em ${totalNascimentos} nascimentos. Investigar causas.`,
        icon: HeartIcon,
        color: 'bg-red-500',
        count: mortos,
        action: 'Analisar causas'
      })
    }

    // Sucesso: Boa taxa de nascimentos
    const nascidos = birthData.filter(b => b.status === 'nascido').length
    if (nascidos >= 10 && taxaMortalidade < 10) {
      newAlerts.push({
        id: 'bons-resultados',
        type: 'success',
        priority: 'low',
        title: `Excelentes Resultados: ${nascidos} Nascimentos`,
        message: `Taxa de sucesso de ${(100 - taxaMortalidade).toFixed(1)}%. Parabéns!`,
        icon: HeartIcon,
        color: 'bg-green-500',
        count: nascidos,
        action: 'Manter estratégia'
      })
    }

    setAlerts(newAlerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }))
  }

  const getAlertBgColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  const getAlertTextColor = (type) => {
    switch (type) {
      case 'warning': return 'text-yellow-800 dark:text-yellow-200'
      case 'error': return 'text-red-800 dark:text-red-200'
      case 'info': return 'text-blue-800 dark:text-blue-200'
      case 'success': return 'text-green-800 dark:text-green-200'
      default: return 'text-gray-800 dark:text-gray-200'
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          🐄 Alertas de Nascimentos
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-sm">Nenhum alerta de nascimento</div>
          <div className="text-xs mt-1">Tudo sob controle!</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          🐄 Alertas de Nascimentos
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {alerts.length} alertas
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertBgColor(alert.type)} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-full ${alert.color} text-white flex-shrink-0`}>
                  <alert.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-semibold ${getAlertTextColor(alert.type)}`}>
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
                  <p className={`text-sm ${getAlertTextColor(alert.type)} opacity-90 mb-2`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <button className={`text-xs hover:underline ${getAlertTextColor(alert.type)} font-medium`}>
                      {alert.action}
                    </button>
                    <div className={`text-xs ${getAlertTextColor(alert.type)} opacity-75`}>
                      {alert.count} {alert.count === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo rápido */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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