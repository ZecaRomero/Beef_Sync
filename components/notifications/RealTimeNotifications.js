
import React, { useEffect, useRef, useState } from 'react'

import { BellIcon, XMarkIcon } from '../ui/Icons'
import logger from '../../utils/logger'

const NotificationItem = ({ notification, onDismiss, onMarkAsRead }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'birth':
        return '👶'
      case 'health':
        return '🏥'
      case 'cost':
        return '💰'
      case 'system':
        return '⚙️'
      case 'warning':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor()} shadow-sm transition-all duration-300 ${
      notification.read ? 'opacity-75' : 'opacity-100'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </h4>
              {!notification.read && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  Nova
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(notification.timestamp).toLocaleString('pt-BR')}
              </span>
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Marcar como lida
                </button>
              )}
              {notification.read && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Lida
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    loadNotifications()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [isOpen])

  const connectWebSocket = () => {
    try {
      // Simular WebSocket para desenvolvimento
      // Em produção, você usaria: const ws = new WebSocket('ws://localhost:3020/ws')
      logger.info('Conectando ao sistema de notificações em tempo real')
      
      // Simular recebimento de notificações
      const simulateNotification = () => {
        const notificationTypes = ['birth', 'health', 'cost', 'system', 'warning']
        const priorities = ['low', 'medium', 'high']
        
        const newNotification = {
          id: Date.now(),
          type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          title: 'Nova notificação',
          message: 'Sistema atualizado com sucesso',
          timestamp: new Date().toISOString(),
          read: false
        }
        
        addNotification(newNotification)
      }

      // Simular notificações a cada 30 segundos
      const interval = setInterval(simulateNotification, 30000)
      
      return () => clearInterval(interval)
    } catch (error) {
      logger.error('Erro ao conectar WebSocket:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data || [])
        updateUnreadCount(data || [])
      } else if (response.status !== 404) {
        // Só logar se não for 404 (rota não encontrada)
        logger.warn(`Erro ao carregar notificações: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      // Silenciar erros de rede (servidor não disponível)
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // Servidor não disponível - não logar para não poluir o console
        return
      }
      
      logger.error('Erro ao carregar notificações:', error)
      
      // Notificações de exemplo com estados consistentes (apenas se não for erro de rede)
      const sampleNotifications = [
        {
          id: 1,
          type: 'system',
          priority: 'medium',
          title: 'Sistema atualizado',
          message: 'O Beef Sync foi atualizado para a versão mais recente com melhorias visuais',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 3,
          type: 'cost',
          priority: 'low',
          title: 'Custo registrado',
          message: 'Novo custo foi adicionado ao sistema',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: 4,
          type: 'warning',
          priority: 'medium',
          title: 'Estoque baixo',
          message: 'Alguns produtos estão com estoque baixo',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          read: true
        }
      ]
      
      setNotifications(sampleNotifications)
      updateUnreadCount(sampleNotifications)
    }
  }

  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev.slice(0, 9)] // Manter apenas 10 notificações
      updateUnreadCount(newNotifications)
      return newNotifications
    })
  }

  const updateUnreadCount = (notifications) => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }

  const handleDismiss = (notificationId) => {
    setNotifications(prev => {
      const newNotifications = prev.filter(n => n.id !== notificationId)
      updateUnreadCount(newNotifications)
      return newNotifications
    })
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => {
          const newNotifications = prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
          updateUnreadCount(newNotifications)
          return newNotifications
        })
      }
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error)
      
      // Fallback local se a API falhar
      setNotifications(prev => {
        const newNotifications = prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        updateUnreadCount(newNotifications)
        return newNotifications
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => {
          const newNotifications = prev.map(n => ({ ...n, read: true }))
          updateUnreadCount(newNotifications)
          return newNotifications
        })
      }
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error)
      
      // Fallback local se a API falhar
      setNotifications(prev => {
        const newNotifications = prev.map(n => ({ ...n, read: true }))
        updateUnreadCount(newNotifications)
        return newNotifications
      })
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Panel - renderizado com position fixed */}
      {isOpen && (
        <div 
          className="fixed w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] animate-fade-in-down"
          style={{ 
            top: `${dropdownPosition.top}px`, 
            right: `${dropdownPosition.right}px` 
          }}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
            </div>
            {unreadCount > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhuma notificação</p>
                  <p className="text-xs mt-1">Você está em dia!</p>
              </div>
            ) : (
                <div className="p-2 space-y-2">
                  {notifications.map(notification => (
                    <NotificationItem
                    key={notification.id}
                      notification={notification}
                      onDismiss={handleDismiss}
                      onMarkAsRead={handleMarkAsRead}
                    />
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Total: {notifications.length} notificação{notifications.length > 1 ? 'ões' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}