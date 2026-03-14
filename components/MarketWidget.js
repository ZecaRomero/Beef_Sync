

import React, { useEffect, useState } from 'react'

export default function MarketWidget() {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    loadMarketData()
    const interval = setInterval(loadMarketData, 15000) // Atualizar a cada 15 segundos para simular tempo real
    return () => clearInterval(interval)
  }, [])

  const loadMarketData = () => {
    try {
      // Simular dados de mercado
      const data = {
        prices: {
          boi_gordo: {
            price: 270 + (Math.random() - 0.5) * 20,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5,
            icon: '🐂',
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          vaca_gorda: {
            price: 250 + (Math.random() - 0.5) * 15,
            change: (Math.random() - 0.5) * 8,
            changePercent: (Math.random() - 0.5) * 4,
            icon: '🐄',
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          novilha: {
            price: 258 + (Math.random() - 0.5) * 12,
            change: (Math.random() - 0.5) * 6,
            changePercent: (Math.random() - 0.5) * 3,
            icon: '🐮',
            trend: Math.random() > 0.5 ? 'up' : 'down'
          },
          garrote: {
            price: 277 + (Math.random() - 0.5) * 18,
            change: (Math.random() - 0.5) * 12,
            changePercent: (Math.random() - 0.5) * 6,
            icon: '🐃',
            trend: Math.random() > 0.5 ? 'up' : 'down'
          }
        },
        indices: {
          dolar: {
            value: 5.63 + (Math.random() - 0.5) * 0.5,
            change: (Math.random() - 0.5) * 0.2,
            changePercent: (Math.random() - 0.5) * 2,
            icon: '💵'
          },
          boi_futuro: {
            value: 280 + (Math.random() - 0.5) * 25,
            change: (Math.random() - 0.5) * 15,
            changePercent: (Math.random() - 0.5) * 5,
            icon: '📊'
          }
        },
        marketStatus: {
          session: {
            status: 'open',
            label: 'Mercado Aberto'
          }
        }
      }
      
      setMarketData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados do mercado:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      default: return '➡️'
    }
  }

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin text-2xl mb-2">📊</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Carregando preços...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
          📈 Preços Hoje
        </h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Ao vivo</span>
        </div>
      </div>



      {/* Preços Principais - Resumido */}
      {marketData && (
        <div className="space-y-2">
          {Object.entries(marketData.prices)
            .filter(([key]) => ['boi_gordo', 'vaca_gorda', 'novilha', 'garrote'].includes(key))
            .map(([key, data]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{data.icon}</span>
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {key === 'boi_gordo' ? 'Boi Gordo' :
                   key === 'vaca_gorda' ? 'Vaca Gorda' :
                   key === 'novilha' ? 'Novilha' : 'Garrote'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  R$ {data.price.toFixed(0)}
                </div>
                <div className={`text-xs ${getTrendColor(data.change)}`}>
                  {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Índices Resumidos */}
      {marketData && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-medium text-blue-600 dark:text-blue-400">
                $ {marketData.indices.dolar.value.toFixed(2)}
              </div>
              <div className={`text-xs ${getTrendColor(marketData.indices.dolar.change)}`}>
                {marketData.indices.dolar.changePercent > 0 ? '+' : ''}{marketData.indices.dolar.changePercent.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="font-medium text-orange-600 dark:text-orange-400">
                R$ {marketData.indices.boi_futuro.value.toFixed(0)}
              </div>
              <div className={`text-xs ${getTrendColor(marketData.indices.boi_futuro.change)}`}>
                Futuro {marketData.indices.boi_futuro.changePercent > 0 ? '+' : ''}{marketData.indices.boi_futuro.changePercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status do Mercado */}
      {marketData && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                marketData.marketStatus.session.status === 'open' ? 'bg-green-500 animate-pulse' :
                marketData.marketStatus.session.status === 'closing' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                {marketData.marketStatus.session.label}
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}