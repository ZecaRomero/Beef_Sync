

import React, { useEffect, useState } from 'react'

export default function AnimalPerformance() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('roi')
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnimals()
  }, [])

  const loadAnimals = async () => {
    try {
      const response = await fetch('/api/animals')
      if (response.ok) {
        const result = await response.json()
        // A API retorna { success: true, data: [...], message: "..." }
        const data = result.success ? result.data : []
        const performanceData = calculatePerformance(Array.isArray(data) ? data : [])
        setAnimals(performanceData)
      } else {
        setAnimals([])
      }
    } catch (error) {
      console.error('Erro ao carregar animais:', error)
      setAnimals([])
    } finally {
      setLoading(false)
    }
  }

  // Calcular performance dos animais
  const calculatePerformance = (animalsList) => {
    return animalsList.map(animal => {
      const valorVenda = parseFloat(animal.precoVenda || animal.valor_venda) || 0
      const custoTotal = parseFloat(animal.custoTotal || animal.custo_total) || 0
      
      const roi = custoTotal > 0 && valorVenda > 0
        ? ((valorVenda - custoTotal) / custoTotal * 100)
        : 0
      
      const profit = valorVenda > 0 ? (valorVenda - custoTotal) : 0
      
      const performance = roi > 30 ? 'Excelente' : 
                         roi > 15 ? 'Boa' : 
                         roi > 0 ? 'Regular' : 
                         valorVenda ? 'Ruim' : 'Em Andamento'
      
      const riskLevel = custoTotal > 5000 ? 'Alto' :
                       custoTotal > 2000 ? 'Médio' : 'Baixo'

      return {
        ...animal,
        valorVenda,
        custoTotal,
        roi,
        profit,
        performance,
        riskLevel,
        costPerMonth: (parseFloat(animal.meses) || 0) > 0 ? custoTotal / (parseFloat(animal.meses) || 1) : 0
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Carregando performance...</p>
        </div>
      </div>
    )
  }

  // Filtrar animais
  const filteredAnimals = (Array.isArray(animals) ? animals : []).filter(animal => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'sold') return animal.valorVenda
    if (selectedFilter === 'active') return animal.situacao === 'Ativo'
    if (selectedFilter === 'profitable') return animal.roi > 0
    if (selectedFilter === 'high-risk') return animal.riskLevel === 'Alto'
    return true
  })

  // Ordenar animais
  const sortedAnimals = filteredAnimals.sort((a, b) => {
    switch (sortBy) {
      case 'roi': return b.roi - a.roi
      case 'profit': return b.profit - a.profit
      case 'cost': return b.custoTotal - a.custoTotal
      case 'age': return b.meses - a.meses
      default: return 0
    }
  })

  const animalsArray = Array.isArray(animals) ? animals : []
  const filters = [
    { id: 'all', label: 'Todos', count: animalsArray.length },
    { id: 'sold', label: 'Vendidos', count: animalsArray.filter(a => a.valorVenda).length },
    { id: 'active', label: 'Ativos', count: animalsArray.filter(a => a.situacao === 'Ativo').length },
    { id: 'profitable', label: 'Lucrativos', count: animalsArray.filter(a => a.roi > 0).length },
    { id: 'high-risk', label: 'Alto Risco', count: animalsArray.filter(a => a.riskLevel === 'Alto').length }
  ]

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excelente': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'Boa': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'Regular': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Ruim': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Alto': return 'text-red-600 bg-red-100'
      case 'Médio': return 'text-yellow-600 bg-yellow-100'
      case 'Baixo': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="mr-3 text-2xl">🏆</span>
          Performance dos Animais
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="roi">ROI</option>
            <option value="profit">Lucro</option>
            <option value="cost">Custo</option>
            <option value="age">Idade</option>
          </select>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              selectedFilter === filter.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Lista de Animais */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedAnimals.slice(0, 10).map((animal, index) => (
          <div
            key={animal.id}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {animal.serie} {animal.rg}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {animal.raca} • {animal.sexo} • {animal.meses} meses
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPerformanceColor(animal.performance)}`}>
                  {animal.performance}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRiskColor(animal.riskLevel)}`}>
                  {animal.riskLevel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Investido</div>
                <div className="font-bold text-red-600 dark:text-red-400">
                  R$ {(animal.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {animal.valorVenda ? (
                <>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">ROI</div>
                    <div className={`font-bold ${animal.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {animal.roi.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Receita</div>
                    <div className="font-bold text-green-600 dark:text-green-400">
                      R$ {(animal.valorVenda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Lucro</div>
                    <div className={`font-bold ${animal.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      R$ {animal.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Status</div>
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {animal.situacao}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Custo/Mês</div>
                    <div className="font-bold text-orange-600 dark:text-orange-400">
                      R$ {animal.costPerMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Potencial</div>
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      {animal.custoTotal > 3000 ? 'Alto' : animal.custoTotal > 1500 ? 'Médio' : 'Baixo'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Barra de Progresso do ROI */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>ROI Progress</span>
                <span>{animal.roi.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    animal.roi >= 20 ? 'bg-green-500' :
                    animal.roi >= 10 ? 'bg-yellow-500' :
                    animal.roi >= 0 ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, animal.roi + 50))}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Estatístico */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {animals.filter(a => a.performance === 'Excelente').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Excelentes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {animals.filter(a => a.roi > 0).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Lucrativos</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {animals.filter(a => a.riskLevel === 'Alto').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Alto Risco</div>
          </div>
        </div>
      </div>
    </div>
  )
}