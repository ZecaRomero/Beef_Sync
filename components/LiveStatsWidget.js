
import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

export default function LiveStatsWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    totalAnimals: 0,
    activeAnimals: 0,
    totalInvested: 0,
    totalRevenue: 0,
    roi: 0,
    recentBirths: 0,
    pendingTasks: 0,
    avgCostPerAnimal: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  // Marcar componente como montado
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    loadStats()
    const interval = setInterval(loadStats, 15000) // Atualizar a cada 15 segundos
    return () => clearInterval(interval)
  }, [mounted])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      // Carregar dados reais do sistema
      const animals = JSON.parse(localStorage.getItem('animals') || '[]')
      const births = JSON.parse(localStorage.getItem('birthData') || '[]')
      
      // Calcular estatísticas reais
      const totalAnimals = animals.length
      const activeAnimals = animals.filter(a => a.situacao === 'Ativo').length
      
      // Calcular investimento total (custos dos animais)
      const totalInvested = animals.reduce((total, animal) => {
        return total + (animal.custoTotal || 0)
      }, 0)
      
      // Calcular receita total (vendas)
      const totalRevenue = animals.reduce((total, animal) => {
        return total + (animal.valorVenda || 0)
      }, 0)
      
      // Nascimentos recentes (últimos 7 dias)
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      const recentBirths = births.filter(b => {
        return b && 
               b.status === 'nascido' && 
               b.data && 
               new Date(b.data) > lastWeek
      }).length
      
      // Tarefas pendentes (animais jovens que precisam de protocolo)
      const pendingTasks = animals.filter(a => {
        return a && 
               typeof a.meses === 'number' && 
               a.meses <= 7 && 
               a.situacao === 'Ativo'
      }).length
      
      const baseStats = {
        totalAnimals,
        activeAnimals,
        totalInvested,
        totalRevenue,
        recentBirths,
        pendingTasks
      }
      
      baseStats.roi = totalInvested > 0 ? 
        ((totalRevenue - totalInvested) / totalInvested * 100) : 0
      baseStats.avgCostPerAnimal = totalAnimals > 0 ? 
        totalInvested / totalAnimals : 0

      setStats(baseStats)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.warn('Erro ao carregar estatísticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      id: 'animals',
      title: 'Rebanho Total',
      value: stats.totalAnimals,
      subtitle: `${stats.activeAnimals} ativos`,
      icon: '🐄',
      color: 'from-green-500 to-emerald-600',
      change: '+2',
      trend: 'up',
      onClick: () => router.push('/animals')
    },
    {
      id: 'invested',
      title: 'Total Investido',
      value: `R$ ${(stats.totalInvested / 1000).toFixed(0)}k`,
      subtitle: `R$ ${stats.avgCostPerAnimal.toFixed(0)} por animal`,
      icon: '💰',
      color: 'from-red-500 to-pink-600',
      change: '+5.2%',
      trend: 'up',
      onClick: () => router.push('/custos')
    },
    {
      id: 'revenue',
      title: 'Receita Total',
      value: `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`,
      subtitle: 'Vendas realizadas',
      icon: '📈',
      color: 'from-blue-500 to-indigo-600',
      change: '+8.1%',
      trend: 'up',
      onClick: () => router.push('/reports')
    },
    {
      id: 'roi',
      title: 'ROI Médio',
      value: `${stats.roi.toFixed(1)}%`,
      subtitle: stats.roi >= 0 ? 'Lucro' : 'Prejuízo',
      icon: stats.roi >= 0 ? '📊' : '📉',
      color: stats.roi >= 0 ? 'from-purple-500 to-violet-600' : 'from-orange-500 to-red-600',
      change: stats.roi >= 0 ? '+3.4%' : '-1.2%',
      trend: stats.roi >= 0 ? 'up' : 'down',
      onClick: () => router.push('/reports')
    },
    {
      id: 'births',
      title: 'Nascimentos',
      value: stats.recentBirths,
      subtitle: 'Últimos 7 dias',
      icon: '🐄',
      color: 'from-yellow-500 to-orange-600',
      change: stats.recentBirths > 0 ? `+${stats.recentBirths}` : '0',
      trend: stats.recentBirths > 0 ? 'up' : 'neutral',
      onClick: () => router.push('/nascimentos')
    },
    {
      id: 'tasks',
      title: 'Tarefas',
      value: stats.pendingTasks,
      subtitle: 'Pendentes',
      icon: stats.pendingTasks > 5 ? '⚠️' : '✅',
      color: stats.pendingTasks > 5 ? 'from-orange-500 to-red-600' : 'from-teal-500 to-cyan-600',
      change: stats.pendingTasks > 5 ? 'Alto' : 'OK',
      trend: stats.pendingTasks > 5 ? 'down' : 'up',
      onClick: () => router.push('/custos')
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            📊 Estatísticas em Tempo Real
            {isLoading && (
              <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Última atualização: {lastUpdate}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm flex items-center"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className="cursor-pointer group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-200 dark:border-gray-600"
          >
            {/* Fundo gradiente */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              {/* Ícone e valor */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">{card.icon}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  card.trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  card.trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {card.change}
                </div>
              </div>

              {/* Título */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {card.title}
              </div>

              {/* Valor principal */}
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {card.value}
              </div>

              {/* Subtítulo */}
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {card.subtitle}
              </div>

              {/* Indicador de tendência */}
              <div className="absolute top-2 right-2">
                {card.trend === 'up' && <div className="text-green-500 text-xs">↗</div>}
                {card.trend === 'down' && <div className="text-red-500 text-xs">↘</div>}
                {card.trend === 'neutral' && <div className="text-gray-500 text-xs">→</div>}
              </div>
            </div>

            {/* Efeito hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 rounded-lg transition-colors duration-300"></div>
          </div>
        ))}
      </div>

      {/* Resumo rápido */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-400">
              💡 Dica: Clique nos cards para navegar
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 dark:text-green-400 text-xs">
              Sistema ativo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}