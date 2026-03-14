
import React, { useState } from 'react'


export default function BreedAnalysis() {
  const [selectedBreed, setSelectedBreed] = useState('all')
  const [sortBy, setSortBy] = useState('roi')

  // AnÃ¡lise por raÃ§a
  const analyzeByBreed = () => {
    const breedStats = {}
    
    mockAnimals.forEach(animal => {
      if (!breedStats[animal.raca]) {
        breedStats[animal.raca] = {
          count: 0,
          totalInvested: 0,
          totalRevenue: 0,
          totalProfit: 0,
          soldCount: 0,
          activeCount: 0,
          avgAge: 0,
          animals: []
        }
      }
      
      const stats = breedStats[animal.raca]
      stats.count++
      stats.totalInvested += animal.custoTotal
      stats.avgAge += animal.meses
      stats.animals.push(animal)
      
      if (animal.valorVenda) {
        stats.totalRevenue += animal.valorVenda
        stats.totalProfit += (animal.valorVenda - animal.custoTotal)
        stats.soldCount++
      } else if (animal.situacao === 'Ativo') {
        stats.activeCount++
      }
    })

    // Calcular mÃ©dias e ROI
    Object.keys(breedStats).forEach(breed => {
      const stats = breedStats[breed]
      stats.avgAge = stats.avgAge / stats.count
      stats.avgInvestment = stats.totalInvested / stats.count
      stats.avgRevenue = stats.soldCount > 0 ? stats.totalRevenue / stats.soldCount : 0
      stats.roi = stats.totalInvested > 0 ? (stats.totalProfit / stats.totalInvested * 100) : 0
      stats.conversionRate = (stats.soldCount / stats.count * 100)
      stats.profitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue * 100) : 0
    })

    return breedStats
  }

  const breedData = analyzeByBreed()
  const breeds = Object.keys(breedData)

  const getBreedIcon = (breed) => {
    const icons = {
      'Nelore': 'ðÅ¸�â€š',
      'Brahman': 'ðÅ¸�â€ž',
      'Gir': 'ðÅ¸�®',
      'Receptora': 'ðÅ¸�â€ž',
      'Angus': 'âÅ¡«',
      'Senepol': 'ðÅ¸â€�´'
    }
    return icons[breed] || 'ðÅ¸�â€ž'
  }

  const getPerformanceLevel = (roi) => {
    if (roi >= 30) return { level: 'Excelente', color: 'text-green-600 bg-green-100', icon: 'ðÅ¸�â€ ' }
    if (roi >= 15) return { level: 'Boa', color: 'text-blue-600 bg-blue-100', icon: 'â­�' }
    if (roi >= 5) return { level: 'Regular', color: 'text-yellow-600 bg-yellow-100', icon: 'ðÅ¸â€œÅ ' }
    if (roi >= 0) return { level: 'Baixa', color: 'text-orange-600 bg-orange-100', icon: 'ðÅ¸â€œâ€°' }
    return { level: 'PrejuÃ­zo', color: 'text-red-600 bg-red-100', icon: 'â�Å’' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              ðÅ¸�â€ž AnÃ¡lise por RaÃ§a
              <span className="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                Detalhado
              </span>
            </h1>
            <p className="text-green-100 text-lg">
              Performance comparativa entre diferentes raÃ§as do rebanho
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{breeds.length}</div>
            <div className="text-green-200">RaÃ§as Diferentes</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBreed('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedBreed === 'all'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Todas as RaÃ§as
            </button>
            {breeds.map(breed => (
              <button
                key={breed}
                onClick={() => setSelectedBreed(breed)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center ${
                  selectedBreed === breed
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="mr-2">{getBreedIcon(breed)}</span>
                {breed}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="roi">ROI</option>
            <option value="profit">Lucro Total</option>
            <option value="revenue">Receita</option>
            <option value="count">Quantidade</option>
            <option value="conversion">Taxa ConversÃ£o</option>
          </select>
        </div>
      </div>

      {/* Cards de RaÃ§as */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(breedData)
          .filter(([breed]) => selectedBreed === 'all' || selectedBreed === breed)
          .sort(([,a], [,b]) => {
            switch (sortBy) {
              case 'roi': return b.roi - a.roi
              case 'profit': return b.totalProfit - a.totalProfit
              case 'revenue': return b.totalRevenue - a.totalRevenue
              case 'count': return b.count - a.count
              case 'conversion': return b.conversionRate - a.conversionRate
              default: return 0
            }
          })
          .map(([breed, stats]) => {
            const performance = getPerformanceLevel(stats.roi)
            
            return (
              <div
                key={breed}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{getBreedIcon(breed)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {breed}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stats.count} animais
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${performance.color}`}>
                    <span className="mr-1">{performance.icon}</span>
                    {performance.level}
                  </div>
                </div>

                {/* MÃ©tricas Principais */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Investido</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Receita</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className={`text-lg font-bold ${stats.roi >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stats.roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">ROI</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {stats.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">ConversÃ£o</div>
                  </div>
                </div>

                {/* EstatÃ­sticas Detalhadas */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vendidos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats.soldCount} de {stats.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ativos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stats.activeCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Idade MÃ©dia:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(parseFloat(stats.avgAge) || 0).toFixed(1)} meses
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Investimento MÃ©dio:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      R$ {(parseFloat(stats.avgInvestment) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {(parseFloat(stats.avgRevenue) || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Receita MÃ©dia:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        R$ {(parseFloat(stats.avgRevenue) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Barra de Progresso ROI */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Performance ROI</span>
                    <span>{stats.roi.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        stats.roi >= 20 ? 'bg-green-500' :
                        stats.roi >= 10 ? 'bg-yellow-500' :
                        stats.roi >= 0 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (stats.roi + 20) * 2))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Comparativo Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-3">ðÅ¸â€œÅ </span>
          Comparativo Geral
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">RaÃ§a</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Qtd</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">ROI</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Lucro</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">ConversÃ£o</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Performance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(breedData)
                .sort(([,a], [,b]) => b.roi - a.roi)
                .map(([breed, stats], index) => {
                  const performance = getPerformanceLevel(stats.roi)
                  return (
                    <tr key={breed} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getBreedIcon(breed)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breed}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">{stats.count}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        {stats.conversionRate.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${performance.color}`}>
                          {performance.icon} {performance.level}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}