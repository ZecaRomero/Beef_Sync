
import React, { memo } from 'react'

import Button from '../ui/Button'

// Ícones temáticos para pecuária
const CattleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21c0-1.66 1.34-3 3-3s3 1.34 3 3" />
  </svg>
)

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const StarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const QuickActions = memo(({ onQuickAction, onTestNotifications }) => {
  const actions = [
    {
      id: 'novo-animal',
      label: 'Novo Animal',
      icon: CattleIcon,
      color: 'blue',
      onClick: () => onQuickAction('novo-animal')
    },
    {
      id: 'nascimento',
      label: 'Nascimento',
      color: 'green',
      onClick: () => onQuickAction('nascimento')
    },
    {
      id: 'boletim-contabil',
      label: 'Boletim Contábil',
      color: 'indigo',
      onClick: () => onQuickAction('boletim-contabil')
    },
    {
      id: 'estoque',
      label: 'Estoque',
      color: 'purple',
      onClick: () => onQuickAction('estoque')
    },
    {
      id: 'relatorio',
      label: 'Relatório',
      icon: ChartBarIcon,
      color: 'orange',
      onClick: () => onQuickAction('relatorio')
    },
    {
      id: 'test-notifications',
      label: 'Testar Notif.',
      color: 'pink',
      onClick: onTestNotifications
    }
  ]

  return (
    <div className="relative animate-scale-in">
      {/* Efeito de brilho de fundo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-75"></div>
      
      <div className="relative card-glass p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gradient-primary flex items-center gap-2">
            <StarIcon className="h-6 w-6 text-yellow-500 animate-pulse" />
            Ações Rápidas Premium
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Acesso rápido às principais funcionalidades do sistema
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            const colorClasses = {
              blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 border-blue-200 dark:border-blue-700',
              green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 border-green-200 dark:border-green-700',
              indigo: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30 border-indigo-200 dark:border-indigo-700',
              purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 border-purple-200 dark:border-purple-700',
              orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30 border-orange-200 dark:border-orange-700',
              pink: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-800/30 dark:hover:to-pink-700/30 border-pink-200 dark:border-pink-700'
            }

            const iconColors = {
              blue: 'text-blue-600',
              green: 'text-green-600',
              indigo: 'text-indigo-600',
              purple: 'text-purple-600',
              orange: 'text-orange-600',
              pink: 'text-pink-600'
            }

            return (
              <div key={action.id} className="hover-lift group">
                <Button 
                  variant="secondary" 
                  className={`h-24 w-full flex-col gap-3 bg-gradient-to-br ${colorClasses[action.color]} relative overflow-hidden`}
                  onClick={action.onClick}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
                  {Icon ? (
                    <Icon className={`h-8 w-8 ${iconColors[action.color]} transform transition-transform group-hover:scale-110 group-hover:rotate-6 relative z-10`} />
                  ) : action.id === 'boletim-contabil' ? (
                    <span className="text-2xl relative z-10">📊</span>
                  ) : (
                    <span className="text-2xl relative z-10">🧪</span>
                  )}
                  <span className="text-sm font-medium relative z-10">{action.label}</span>
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

QuickActions.displayName = 'QuickActions'

export default QuickActions