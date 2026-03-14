
import React, { useState } from 'react'


export default function MetricsCards({ timeRange, onReportClick }) {
  const [hoveredCard, setHoveredCard] = useState(null)

  // Calcular mÃ©tricas baseadas no perÃ­odo selecionado
  const calculateMetrics = () => {
    const now = new Date()
    let filteredAnimals = mockAnimals

    // Filtrar por perÃ­odo (simulado)
    if (timeRange !== 'all') {
      // Para demonstraÃ§Ã£o, vamos usar todos os dados
      filteredAnimals = mockAnimals
    }

    const totalInvested = filteredAnimals.reduce((acc, a) => acc + (parseFloat(a.custoTotal || a.custo_total) || 0), 0)

    return {
      totalInvested,
      activeAnimals: filteredAnimals.filter(a => a.situacao === 'Ativo').length
    }
  }

  const metrics = calculateMetrics()

  const cards = [
    {
      id: 'invested',
      title: 'Total Investido',
      value: `R$ ${(parseFloat(metrics.totalInvested) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+12.5%',
      trend: 'up',
      icon: 'ðÅ¸â€™°',
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      description: 'Investimento total em todos os animais',
      details: `${mockAnimals.length} animais cadastrados`
    },
    {
      id: 'revenue',
      title: 'Receita Total',
      value: `R$ ${(parseFloat(metrics.totalRevenue) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+18.3%',
      trend: 'up',
      icon: 'ðÅ¸â€œË†',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      description: 'Receita com vendas realizadas',
      details: `${metrics.soldAnimals || 0} animais vendidos`
    },
    {
      id: 'profit',
      title: 'Lucro LÃ­quido',
      value: `R$ ${(parseFloat(metrics.totalProfit) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: (parseFloat(metrics.totalProfit) || 0) >= 0 ? '+25.7%' : '-8.2%',
      trend: (parseFloat(metrics.totalProfit) || 0) >= 0 ? 'up' : 'down',
      icon: (parseFloat(metrics.totalProfit) || 0) >= 0 ? 'ðÅ¸Å½¯' : 'ðÅ¸â€œâ€°',
      color: (parseFloat(metrics.totalProfit) || 0) >= 0 ? 'from-blue-500 to-cyan-600' : 'from-red-500 to-orange-600',
      bgColor: (parseFloat(metrics.totalProfit) || 0) >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20',
      description: 'Lucro lÃ­quido das operaÃ§Ãµes',
      details: `Margem: ${(parseFloat(metrics.totalRevenue) || 0) > 0 ? (((parseFloat(metrics.totalProfit) || 0) / (parseFloat(metrics.totalRevenue) || 1)) * 100).toFixed(1) : 0}%`
    },
    {
      id: 'roi',
      title: 'ROI MÃ©dio',
      value: `${metrics.avgROI.toFixed(1)}%`,
      change: '+5.4%',
      trend: 'up',
      icon: 'ðÅ¸â€œÅ ',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Retorno mÃ©dio sobre investimento',
      details: `Taxa de conversÃ£o: ${metrics.conversionRate.toFixed(1)}%`
    },
    {
      id: 'active',
      title: 'Animais Ativos',
      value: metrics.activeAnimals.toString(),
      change: '+3',
      trend: 'up',
      icon: 'ðÅ¸�â€ž',
      color: 'from-orange-500 to-yellow-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      description: 'Animais ativos no rebanho',
      details: `${((metrics.activeAnimals / mockAnimals.length) * 100).toFixed(1)}% do rebanho`
    },
    {
      id: 'performance',
      title: 'Performance',
      value: metrics.avgROI > 15 ? 'Excelente' : metrics.avgROI > 5 ? 'Boa' : 'Regular',
      change: 'Melhorando',
      trend: 'up',
      icon: metrics.avgROI > 15 ? 'ðÅ¸�â€ ' : metrics.avgROI > 5 ? 'â­�' : 'ðÅ¸â€œË†',
      color: 'from-teal-500 to-green-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      description: 'AvaliaÃ§Ã£o geral do desempenho',
      details: `Meta: ROI > 20%`
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={card.id}
          onClick={() => onReportClick(card.id)}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
          className={`
            relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-500 transform
            ${hoveredCard === card.id ? 'scale-105 shadow-2xl' : 'hover:scale-102 shadow-lg'}
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            hover:border-transparent
          `}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`}></div>
          
          {/* Hover Effect */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity duration-300
            ${hoveredCard === card.id ? 'opacity-10' : ''}
          `}></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className={`
                px-3 py-1 rounded-full text-xs font-semibold flex items-center
                ${card.trend === 'up' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }
              `}>
                <span className="mr-1">{card.trend === 'up' ? 'ââ€ â€”ï¸�' : 'ââ€ Ëœï¸�'}</span>
                {card.change}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {card.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {card.details}
              </p>
            </div>

            {/* Progress Bar (simulado) */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(parseFloat(card.change)) * 5)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Click Indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                <span className="text-xs">ðÅ¸â€œÅ </span>
              </div>
            </div>
          </div>

          {/* Animated Border */}
          <div className={`
            absolute inset-0 rounded-2xl border-2 border-transparent
            ${hoveredCard === card.id ? `bg-gradient-to-r ${card.color} p-[2px]` : ''}
          `}>
            {hoveredCard === card.id && (
              <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-800"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}