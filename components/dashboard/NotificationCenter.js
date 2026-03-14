
import React, { useEffect, useMemo, useState } from 'react'

import { 
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Badge from '../ui/Badge'

/**
 * Central de notificações inteligente
 * Analisa dados e gera notificações automáticas úteis
 */
export default function NotificationCenter({ animals = [], births = [], semen = [], costs = [] }) {
  const [showPanel, setShowPanel] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissedNotifications')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const notifications = useMemo(() => {
    const items = []
    const now = new Date()

    // 1. Alertas de Estoque de Sêmen
    const lowStockSemen = semen.filter(s => 
      s.doses_disponiveis > 0 && s.doses_disponiveis < 5 && s.status === 'disponivel'
    )
    if (lowStockSemen.length > 0) {
      items.push({
        id: 'low-semen-stock',
        type: 'warning',
        icon: ExclamationTriangleIcon,
        title: 'Estoque Baixo de Sêmen',
        message: `${lowStockSemen.length} touro(s) com menos de 5 doses disponíveis`,
        priority: 'high',
        action: { label: 'Ver Estoque', link: '/estoque-semen' }
      })
    }

    // 2. Sêmen Esgotado
    const outOfStockSemen = semen.filter(s => s.doses_disponiveis === 0)
    if (outOfStockSemen.length > 0) {
      items.push({
        id: 'out-of-stock-semen',
        type: 'error',
        icon: ExclamationTriangleIcon,
        title: 'Sêmen Esgotado',
        message: `${outOfStockSemen.length} touro(s) sem doses disponíveis`,
        priority: 'critical',
        action: { label: 'Reabastecer', link: '/estoque-semen' }
      })
    }

    // 3. Nascimentos Recentes (últimos 7 dias)
    const recentBirths = births.filter(b => {
      if (!b.data_nascimento) return false
      const birthDate = new Date(b.data_nascimento)
      const diffDays = (now - birthDate) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    })
    if (recentBirths.length > 0) {
      items.push({
        id: 'recent-births',
        type: 'success',
        icon: CheckCircleIcon,
        title: 'Nascimentos Recentes',
        message: `${recentBirths.length} nascimento(s) nos últimos 7 dias`,
        priority: 'low',
        action: { label: 'Ver Nascimentos', link: '/nascimentos' }
      })
    }

    // 4. Animais sem Custos Registrados
    const animalsWithoutCosts = animals.filter(a => 
      !a.custo_total || parseFloat(a.custo_total) === 0
    )
    if (animalsWithoutCosts.length > 5) {
      items.push({
        id: 'animals-without-costs',
        type: 'info',
        icon: InformationCircleIcon,
        title: 'Custos não Registrados',
        message: `${animalsWithoutCosts.length} animais sem custos cadastrados`,
        priority: 'medium',
        action: { label: 'Cadastrar Custos', link: '/custos' }
      })
    }

    // 5. Performance Financeira
    const soldAnimals = animals.filter(a => a.situacao === 'Vendido')
    const profitableAnimals = soldAnimals.filter(a => 
      a.valor_venda && a.custo_total && parseFloat(a.valor_venda) > parseFloat(a.custo_total)
    )
    if (soldAnimals.length >= 5 && profitableAnimals.length / soldAnimals.length >= 0.8) {
      items.push({
        id: 'good-profit-margin',
        type: 'success',
        icon: CheckCircleIcon,
        title: 'Ótima Performance!',
        message: `${((profitableAnimals.length / soldAnimals.length) * 100).toFixed(0)}% dos animais vendidos geraram lucro`,
        priority: 'low',
        action: { label: 'Ver Relatório', link: '/reports' }
      })
    }

    // 6. Custos Altos Recentes
    const recentHighCosts = costs.filter(c => {
      if (!c.data_registro || !c.valor) return false
      const costDate = new Date(c.data_registro)
      const diffDays = (now - costDate) / (1000 * 60 * 60 * 24)
      return diffDays <= 30 && parseFloat(c.valor) > 1000
    })
    if (recentHighCosts.length > 0) {
      const total = recentHighCosts.reduce((sum, c) => sum + parseFloat(c.valor), 0)
      items.push({
        id: 'high-costs-alert',
        type: 'warning',
        icon: ExclamationTriangleIcon,
        title: 'Custos Elevados',
        message: `R$ ${total.toFixed(2)} em custos altos nos últimos 30 dias`,
        priority: 'medium',
        action: { label: 'Analisar', link: '/custos' }
      })
    }

    // Filtrar notificações já dispensadas
    return items.filter(item => !dismissed.includes(item.id))
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }, [animals, births, semen, costs, dismissed])

  const dismissNotification = (id) => {
    const newDismissed = [...dismissed, id]
    setDismissed(newDismissed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed))
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    }
    return colors[type] || colors.info
  }

  const getIconColor = (type) => {
    const colors = {
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      success: 'text-green-600 dark:text-green-400',
      info: 'text-blue-600 dark:text-blue-400'
    }
    return colors[type] || colors.info
  }

  return (
    <div className="relative z-[9999]">
      {/* Botão de Notificações */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {/* Overlay para fechar ao clicar fora */}
      {showPanel && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Painel de Notificações */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] max-h-[600px] overflow-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              <Badge variant="primary">{notifications.length}</Badge>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Tudo certo! Nenhuma notificação pendente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map(notification => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(notification.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        {notification.action && (
                          <a
                            href={notification.action.link}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                          >
                            {notification.action.label} →
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

