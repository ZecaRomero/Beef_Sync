

import React, { useEffect, useState } from 'react'

export default function LiveStats({ data }) {
  const [animatedValues, setAnimatedValues] = useState({
    totalAnimals: 0,
    activeAnimals: 0,
    totalInvested: 0,
    totalRevenue: 0
  })

  // Animar valores quando os dados mudam
  useEffect(() => {
    const animateValue = (start, end, duration, key) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const current = start + (end - start) * progress
        
        setAnimatedValues(prev => ({
          ...prev,
          [key]: Math.floor(current)
        }))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }

    animateValue(animatedValues.totalAnimals, data.totalAnimals, 1000, 'totalAnimals')
    animateValue(animatedValues.activeAnimals, data.activeAnimals, 1000, 'activeAnimals')
    animateValue(animatedValues.totalInvested, data.totalInvested, 1500, 'totalInvested')
    animateValue(animatedValues.totalRevenue, data.totalRevenue, 1500, 'totalRevenue')
  }, [data])

  const stats = [
    {
      label: 'Animais Totais',
      value: animatedValues.totalAnimals,
      icon: '🐄',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Ativos',
      value: animatedValues.activeAnimals,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Investido',
      value: `R$ ${(animatedValues.totalInvested / 1000).toFixed(0)}k`,
      icon: '💰',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      label: 'Receita',
      value: `R$ ${(animatedValues.totalRevenue / 1000).toFixed(0)}k`,
      icon: '📈',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'ROI Médio',
      value: `${data.avgROI?.toFixed(1) || 0}%`,
      icon: '📊',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-3 text-2xl">⚡</span>
          Stats em Tempo Real
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Ao vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`
              p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer
              ${stat.bgColor} border border-gray-200 dark:border-gray-600
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Performer */}
      {data.topPerformer && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                🏆 Top Performer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.topPerformer.serie} {data.topPerformer.rg}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {(((data.topPerformer.valorVenda - data.topPerformer.custoTotal) / data.topPerformer.custoTotal) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">ROI</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}