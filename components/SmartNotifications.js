
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

export default function SmartNotifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    generateNotifications()
    const interval = setInterval(generateNotifications, 60000) // Atualizar a cada minuto
    return () => clearInterval(interval)
  }, [])

  const generateNotifications = () => {
    const newNotifications = []

    // Carregar dados reais do sistema
    const animals = JSON.parse(localStorage.getItem('animals') || '[]')
    const births = JSON.parse(localStorage.getItem('birthData') || '[]')
    
    // Verificar nascimentos recentes (últimas 24 horas)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)
    
    const recentBirths = births.filter(b => 
      b && b.status === 'nascido' && b.data && new Date(b.data) > last24Hours
    )
    
    if (recentBirths.length > 0) {
      newNotifications.push({
        id: 'recent-births',
        type: 'success',
        title: `${recentBirths.length} Nascimento(s) Recente(s)`,
        message: `Registrados nas últimas 24 horas - Verificar protocolos`,
        time: 'Recente',
        icon: '🐄',
        action: () => router.push('/nascimentos'),
        priority: 'high'
      })
    }
    
    // Verificar animais jovens que precisam de protocolo
    const youngAnimals = animals.filter(a => 
      a && a.situacao === 'Ativo' && typeof a.meses === 'number' && a.meses <= 7
    )
    
    if (youngAnimals.length > 0) {
      newNotifications.push({
        id: 'young-animals',
        type: 'warning',
        title: 'Protocolos Pendentes',
        message: `${youngAnimals.length} animais jovens precisam de atenção`,
        time: 'Pendente',
        icon: '💊',
        action: () => router.push('/custos'),
        priority: 'medium'
      })
    }
    
    // Verificar receptoras atrasadas
    const lateReceptoras = births.filter(b => 
      b && b.status === 'gestante_atrasada'
    )
    
    if (lateReceptoras.length > 0) {
      newNotifications.push({
        id: 'late-receptoras',
        type: 'warning',
        title: 'Receptoras Atrasadas',
        message: `${lateReceptoras.length} receptoras não pariram no prazo`,
        time: 'Urgente',
        icon: '⚠️',
        action: () => router.push('/gestacao'),
        priority: 'high'
      })
    }
    
    // Verificar animais para descarte
    const animalsToDiscard = births.filter(b => b && b.descarte === true)
    
    if (animalsToDiscard.length > 0) {
      newNotifications.push({
        id: 'animals-discard',
        type: 'warning',
        title: 'Animais para Descarte',
        message: `${animalsToDiscard.length} animais marcados para descarte`,
        time: 'Ação necessária',
        icon: '🚨',
        action: () => router.push('/nascimentos'),
        priority: 'medium'
      })
    }
    
    // Se não há notificações reais, mostrar status positivo
    if (newNotifications.length === 0) {
      newNotifications.push({
        id: 'all-good',
        type: 'success',
        title: 'Sistema em Ordem',
        message: 'Não há alertas ou tarefas pendentes no momento',
        time: 'Atualizado',
        icon: '✅',
        action: () => router.push('/'),
        priority: 'low'
      })
    }

    setNotifications(newNotifications)
  }

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200'
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200'
      case 'error':
        return 'text-red-800 dark:text-red-200'
      default:
        return 'text-blue-800 dark:text-blue-200'
    }
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3">✅</div>
          <div>
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              Tudo em Ordem
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Não há notificações pendentes no momento
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          🔔 Notificações Inteligentes
          <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
            {notifications.length}
          </span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            {isExpanded ? 'Recolher' : 'Ver Todas'}
          </button>
          <button
            onClick={generateNotifications}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-xs"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(isExpanded ? notifications : notifications.slice(0, 2)).map((notification, index) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${getNotificationStyle(notification.type)}`}
            onClick={notification.action}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-2xl flex-shrink-0">
                  {notification.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold ${getTextColor(notification.type)}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {notification.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">
                          Urgente
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissNotification(notification.id)
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm ${getTextColor(notification.type)} opacity-90 mb-2`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.time}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                      Clique para ver →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isExpanded && notifications.length > 2 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-300"
        >
          Ver mais {notifications.length - 2} notificações
        </button>
      )}

      {/* Resumo de prioridades */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {notifications.filter(n => n.priority === 'high').length} urgentes
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {notifications.filter(n => n.priority === 'medium').length} médias
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {notifications.filter(n => n.priority === 'low').length} informativas
              </span>
            </div>
          </div>
          <button
            onClick={() => setNotifications([])}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Limpar todas
          </button>
        </div>
      </div>
    </div>
  )
}