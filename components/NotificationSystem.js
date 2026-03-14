

import React, { useEffect, useState } from 'react'

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Gerar notificações reais baseadas nos dados de nascimento
  useEffect(() => {
    const generateRealNotifications = () => {
      if (typeof window === 'undefined') return;
      const savedBirths = localStorage.getItem('birthData')
      const realNotifications = []

      if (savedBirths) {
        const births = JSON.parse(savedBirths)
        
        // Receptoras atrasadas (171, 294, 653)
        const atrasadas = births.filter(b => b.status === 'gestante_atrasada')
        if (atrasadas.length > 0) {
          realNotifications.push({
            id: 'receptoras-atrasadas',
            type: 'warning',
            icon: '⚠️',
            title: 'Receptoras Atrasadas',
            message: `${atrasadas.length} receptoras não pariram: ${atrasadas.map(b => `RPT ${b.receptora.split(' ')[1]}`).join(', ')}`,
            timestamp: new Date(),
            read: false,
            color: 'bg-yellow-500',
            priority: 'high'
          })
        }

        // Animais para descarte
        const descartes = births.filter(b => b.descarte === true)
        if (descartes.length > 0) {
          realNotifications.push({
            id: 'animais-descarte',
            type: 'alert',
            icon: '🚨',
            title: 'Animais para Descarte',
            message: `${descartes.length} animal(is) com defeitos: 17144 (RABO BRANCO FIV nelore)`,
            timestamp: new Date(),
            read: false,
            color: 'bg-orange-500',
            priority: 'high'
          })
        }

        // Nascimentos recentes (últimos 7 dias)
        const nascimentosRecentes = births.filter(b => {
          if (!b.data || b.status !== 'nascido') return false
          const nascimento = new Date(b.data)
          const agora = new Date()
          const diffDays = Math.ceil((agora - nascimento) / (1000 * 60 * 60 * 24))
          return diffDays <= 7
        })

        if (nascimentosRecentes.length > 0) {
          realNotifications.push({
            id: 'nascimentos-recentes',
            type: 'success',
            icon: '🐄',
            title: 'Nascimentos Recentes',
            message: `${nascimentosRecentes.length} nascimento(s) nos últimos 7 dias`,
            timestamp: new Date(),
            read: false,
            color: 'bg-green-500',
            priority: 'medium'
          })
        }

        // Perdas (mortos, abortos)
        const perdas = births.filter(b => ['morto', 'aborto'].includes(b.status))
        if (perdas.length > 0) {
          realNotifications.push({
            id: 'perdas-registradas',
            type: 'error',
            icon: '💔',
            title: 'Perdas Registradas',
            message: `${perdas.length} perda(s) registrada(s) - verificar causas`,
            timestamp: new Date(),
            read: false,
            color: 'bg-red-500',
            priority: 'high'
          })
        }

        // Custos de DNA acumulados
        const custoTotalDNA = births.reduce((acc, b) => acc + (b.custoDNA || 0), 0)
        if (custoTotalDNA > 0) {
          realNotifications.push({
            id: 'custos-dna',
            type: 'info',
            icon: '💰',
            title: 'Custos de DNA',
            message: `R$ ${custoTotalDNA.toFixed(2)} em custos de DNA acumulados`,
            timestamp: new Date(),
            read: false,
            color: 'bg-blue-500',
            priority: 'low'
          })
        }
      }

      // Ordenar por prioridade
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      realNotifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

      setNotifications(realNotifications)
    }

    // Gerar notificações iniciais
    generateRealNotifications()

    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(generateRealNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative z-[9999]">
      {/* Botão de Notificações */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <div className="text-2xl">🔔</div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Overlay para fechar ao clicar fora */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Painel de Notificações */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount} não lidas
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Limpar todas
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm">Nenhuma notificação</div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${notification.color} text-white flex-shrink-0`}>
                      <span className="text-sm">{notification.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {notification.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}