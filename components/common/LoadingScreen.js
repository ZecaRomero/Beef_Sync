

import React, { useEffect, useState } from 'react'

export default function LoadingScreen({ message = 'Carregando...', fullScreen = true }) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    : 'flex items-center justify-center py-12'

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Logo Animado */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-45 animate-spin-slow shadow-2xl"></div>
            <div className="absolute text-4xl animate-pulse">🐄</div>
          </div>
        </div>

        {/* Texto de Loading */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gradient-primary">
            Beef Sync
          </h2>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            {message}{dots}
          </p>
          
          {/* Barra de Progresso Indeterminada */}
          <div className="w-64 mx-auto mt-6">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-shimmer" 
                   style={{ width: '50%', backgroundSize: '200% 100%' }}></div>
            </div>
          </div>
        </div>

        {/* Estatísticas de Loading (opcional) */}
        {fullScreen && (
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Conectando ao banco de dados</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Skeleton Screens para diferentes tipos de conteúdo
export function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        </div>
      ))}
    </div>
  )
}

