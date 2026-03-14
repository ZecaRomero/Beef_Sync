

// Sistema de notificaÃ§Ãµes inteligentes para Beef Sync
import React, { useCallback, useEffect, useState } from 'react'

export default function useSmartNotifications() {
  const [notifications, setNotifications] = useState([])
  const [isEnabled, setIsEnabled] = useState(true)

  // Tipos de notificaÃ§Ãµes disponÃ­veis
  const notificationTypes = {
    BIRTH: {
      icon: 'ðÅ¸�£',
      color: 'green',
      priority: 'high',
      title: 'Novo Nascimento'
    },
    PROTOCOL: {
      icon: 'ðÅ¸â€™Å ',
      color: 'blue',
      priority: 'medium',
      title: 'Protocolo Pendente'
    },
    COST: {
      icon: 'ðÅ¸â€™°',
      color: 'yellow',
      priority: 'medium',
      title: 'Custo Alto'
    },
    HEALTH: {
      icon: 'âÅ¡ ï¸�',
      color: 'red',
      priority: 'high',
      title: 'Alerta de SaÃºde'
    },
    MARKET: {
      icon: 'ðÅ¸â€œË†',
      color: 'purple',
      priority: 'low',
      title: 'Oportunidade de Mercado'
    },
    SYSTEM: {
      icon: 'ðÅ¸â€�§',
      color: 'gray',
      priority: 'low',
      title: 'Sistema'
    }
  }

  // Adicionar notificaÃ§Ã£o
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

    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // MÃ¡ximo 50 notificaÃ§Ãµes

    // Auto-remover notificaÃ§Ãµes de baixa prioridade apÃ³s 5 minutos
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5 * 60 * 1000)
    }
  }, [isEnabled])

  // Remover notificaÃ§Ã£o
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

  // Limpar notificaÃ§Ãµes lidas
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read))
  }, [])

  // Limpar todas as notificaÃ§Ãµes
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // NotificaÃ§Ãµes especÃ­ficas do sistema
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
    addNotification('HEALTH', `Alerta de saÃºde: ${alert} para ${animalData.serie}${animalData.rg}`, { animalData, alert })
  }, [addNotification])

  const notifyMarketOpportunity = useCallback((message, data) => {
    addNotification('MARKET', message, data)
  }, [addNotification])

  const notifySystem = useCallback((message, data) => {
    addNotification('SYSTEM', message, data)
  }, [addNotification])

  // EstatÃ­sticas das notificaÃ§Ãµes
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

  // Auto-detecÃ§Ã£o de eventos (simulado)
  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      // Simular eventos aleatÃ³rios para demonstraÃ§Ã£o
      const random = Math.random()
      
      if (random < 0.1) { // 10% chance
        notifySystem('Sistema funcionando normalmente', { type: 'status' })
      } else if (random < 0.15) { // 5% chance
        notifyMarketOpportunity('PreÃ§o do boi gordo subiu 2%', { price: 180.50 })
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
    // MÃ©todos especÃ­ficos
    notifyBirth,
    notifyProtocol,
    notifyHighCost,
    notifyHealthAlert,
    notifyMarketOpportunity,
    notifySystem
  }
}
