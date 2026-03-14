import React from 'react'
import { cn } from '../../lib/utils.js'

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  className = '',
  onClick,
  ...props
}) {
  const colors = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-900 dark:text-blue-100'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-900 dark:text-green-100'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-900 dark:text-purple-100'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-900 dark:text-orange-100'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-900 dark:text-red-100'
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-500 to-pink-600',
      icon: 'text-pink-600 dark:text-pink-400',
      text: 'text-pink-900 dark:text-pink-100'
    }
  }

  const colorScheme = colors[color] || colors.blue

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Background gradient */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl',
        colorScheme.bg
      )}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            'p-3 rounded-lg',
            colorScheme.bg,
            'bg-opacity-10 dark:bg-opacity-20'
          )}>
            {Icon && <Icon className={cn('h-6 w-6', colorScheme.icon)} />}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center text-sm font-medium',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {trend === 'up' && <span>↑</span>}
              {trend === 'down' && <span>↓</span>}
              {trendValue && <span className="ml-1">{trendValue}</span>}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
