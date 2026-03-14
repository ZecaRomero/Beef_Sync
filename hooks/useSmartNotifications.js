

// Sistema de notificações inteligentes para Beef Sync
import React, { useCallback, useEffect, useState } from 'react'

export default function useSmartNotifications() {
  const [notifications, setNotifications] = useState([])
  const [isEnabled, setIsEnabled] = useState(true)

  // Tipos de notificações disponíveis
  const notificationTypes = {
    BIRTH: {
      icon: '🐣',
      color: 'green',
      priority: 'high',
      title: 'Novo Nascimento'
    },
    PROTOCOL: {
      icon: '💊',
      color: 'blue',
      priority: 'medium',
      title: 'Protocolo Pendente'
    },
    COST: {
      icon: '💰',
      color: 'yellow',
      priority: 'medium',
      title: 'Custo Alto'
    },
    HEALTH: {
      icon: '⚠️',
      color: 'red',
      priority: 'high',
      title: 'Alerta de Saúde'
    },
    MARKET: {
      icon: '📈',
      color: 'purple',
      priority: 'low',
      title: 'Oportunidade de Mercado'
    },
    SYSTEM: {
      icon: '🔧',
      color: 'gray',
      priority: 'low',
      title: 'Sistema'
    }
  }

  // Adicionar notificação
  const addNotification = useCallback((type, message, data = {}) => {
    if (!isEnabled) return

    const notification = {
      id: Date.now() + Math.random(),
      type,
      message,
      data,
      timestamp: new Date(),
      read: false,
      ...notificationTypes[type]
    }

    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Máximo 50 notificações

    // Auto-remover notificações de baixa prioridade após 5 minutos
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5 * 60 * 1000)
    }
  }, [isEnabled])

  // Remover notificação
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Marcar como lida
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Limpar notificações lidas
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read))
  }, [])

  // Limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Notificações específicas do sistema
  const notifyBirth = useCallback((animalData) => {
    addNotification('BIRTH', `Novo nascimento: ${animalData.serie}${animalData.rg}`, animalData)
  }, [addNotification])

  const notifyProtocol = useCallback((animalData, protocol) => {
    addNotification('PROTOCOL', `Protocolo ${protocol} pendente para ${animalData.serie}${animalData.rg}`, { animalData, protocol })
  }, [addNotification])

  const notifyHighCost = useCallback((animalData, cost) => {
    addNotification('COST', `Custo alto detectado: R$ ${cost} para ${animalData.serie}${animalData.rg}`, { animalData, cost })
  }, [addNotification])

  const notifyHealthAlert = useCallback((animalData, alert) => {
    addNotification('HEALTH', `Alerta de saúde: ${alert} para ${animalData.serie}${animalData.rg}`, { animalData, alert })
  }, [addNotification])

  const notifyMarketOpportunity = useCallback((message, data) => {
    addNotification('MARKET', message, data)
  }, [addNotification])

  const notifySystem = useCallback((message, data) => {
    addNotification('SYSTEM', message, data)
  }, [addNotification])

  // Estatísticas das notificações
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byPriority: {
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length
    },
    byType: Object.keys(notificationTypes).reduce((acc, type) => {
      acc[type] = notifications.filter(n => n.type === type).length
      return acc
    }, {})
  }

  // Auto-detecção de eventos (simulado)
  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      // Simular eventos aleatórios para demonstração
      const random = Math.random()
      
      if (random < 0.1) { // 10% chance
        notifySystem('Sistema funcionando normalmente', { type: 'status' })
      } else if (random < 0.15) { // 5% chance
        notifyMarketOpportunity('Preço do boi gordo subiu 2%', { price: 180.50 })
      }
    }, 30000) // A cada 30 segundos

    return () => clearInterval(interval)
  }, [isEnabled, notifySystem, notifyMarketOpportunity])

  return {
    notifications,
    stats,
    isEnabled,
    setIsEnabled,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearRead,
    clearAll,
    // Métodos específicos
    notifyBirth,
    notifyProtocol,
    notifyHighCost,
    notifyHealthAlert,
    notifyMarketOpportunity,
    notifySystem
  }
}
