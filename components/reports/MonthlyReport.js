import React, { useEffect, useState, useMemo } from 'react'
import { apiAll } from '../../lib/apiClient'
import logger from '../../utils/logger'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [viewType, setViewType] = useState('summary')
  const [realData, setRealData] = useState(null)
  const [loading, setLoading] = useState(true)

  const requests = useMemo(() => [
    { key: 'animals', url: '/api/animals' },
    { key: 'births', url: '/api/births' }
  ], [])

  const [rawAnimals, setRawAnimals] = useState([])
  const [rawBirths, setRawBirths] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const result = await apiAll(requests)
        if (cancelled) return

        setRawAnimals(result.data?.animals ?? [])
        setRawBirths(result.data?.births ?? [])
      } catch (error) {
        if (!cancelled) {
          logger.error('Erro ao carregar dados mensais:', error)
          setRawAnimals([])
          setRawBirths([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [requests])

  useEffect(() => {
    if (rawAnimals.length === 0 && rawBirths.length === 0 && !loading) {
      setRealData(getEmptyMonthlyData())
      return
    }
    setRealData(calculateMonthlyData(rawAnimals, rawBirths, selectedYear))
  }, [rawAnimals, rawBirths, selectedYear, loading])

  const getEmptyMonthlyData = () => {
    const data = {}
    for (let month = 1; month <= 12; month++) {
      data[month] = {
        costs: 0,
        revenue: 0,
        profit: 0,
        animals: { born: 0, sold: 0, died: 0 },
        events: []
      }
    }
    return data
  }

  const calculateMonthlyData = (animals, births, year) => {
    const monthlyData = getEmptyMonthlyData()
    
    // Processar nascimentos
    births.forEach(birth => {
      const birthDate = birth.nascimento || birth.data || ''
      const match = birthDate.match(/(\d{2})\/(\d{2})/)
      if (match) {
        const month = parseInt(match[1])
        const birthYear = parseInt(`20${match[2]}`)
        
        if (birthYear === year && month >= 1 && month <= 12) {
          monthlyData[month].animals.born++
          if (birth.custoDNA || birth.custo_dna) {
            monthlyData[month].costs += parseFloat(birth.custoDNA || birth.custo_dna || 0)
          }
        }
      }
    })

    // Processar vendas e custos dos animais
    animals.forEach(animal => {
      const dataNascimento = new Date(animal.dataNascimento || animal.data_nascimento)
      const dataVenda = animal.situacao === 'Vendido' ? new Date(animal.updated_at) : null
      
      // Adicionar custo total distribuÃ­do
      if (animal.custoTotal || animal.custo_total) {
        const custoTotal = parseFloat(animal.custoTotal || animal.custo_total || 0)
        const monthlyShare = custoTotal / 12
        for (let m = 1; m <= 12; m++) {
          monthlyData[m].costs += monthlyShare
        }
      }

      // Adicionar receita de vendas
      if (dataVenda && dataVenda.getFullYear() === year) {
        const month = dataVenda.getMonth() + 1
        const valorVenda = parseFloat(animal.precoVenda || animal.valor_venda || 0)
        monthlyData[month].revenue += valorVenda
        monthlyData[month].animals.sold++
        
        if (!monthlyData[month].events.includes('Vendas realizadas')) {
        monthlyData[month].events.push('Vendas realizadas')
      }
    }

      // Contar mortos
      if (animal.situacao === 'Morto') {
        const dataMorte = new Date(animal.updated_at)
        if (dataMorte.getFullYear() === year) {
          const month = dataMorte.getMonth() + 1
          monthlyData[month].animals.died++
        }
      }
    })

    // Calcular lucros
    Object.keys(monthlyData).forEach(month => {
      const data = monthlyData[month]
      data.profit = data.revenue - data.costs
    })

    return monthlyData
  }

  if (loading || !realData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">â�³</div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do relatÃ³rio...</p>
        </div>
      </div>
    )
  }

  const monthlyData = realData ?? getEmptyMonthlyData()
  const currentMonthData = monthlyData[selectedMonth]

  // Calcular totais anuais
  const yearlyTotals = Object.values(monthlyData).reduce((acc, month) => ({
    costs: acc.costs + month.costs,
    revenue: acc.revenue + month.revenue,
    profit: acc.profit + month.profit,
    animalsBorn: acc.animalsBorn + month.animals.born,
    animalsSold: acc.animalsSold + month.animals.sold,
    animalsDied: acc.animalsDied + month.animals.died
  }), { costs: 0, revenue: 0, profit: 0, animalsBorn: 0, animalsSold: 0, animalsDied: 0 })

  const renderSummaryView = () => (
    <div className="space-y-6">
      {/* MÃ©tricas do MÃªs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Custos</h3>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                R$ {currentMonthData.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-3xl">ðÅ¸â€™°</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Receitas</h3>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                R$ {currentMonthData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-3xl">ðÅ¸â€œË†</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Lucro</h3>
              <p className={`text-2xl font-bold ${currentMonthData.profit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                R$ {currentMonthData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-3xl">{currentMonthData.profit >= 0 ? 'ðÅ¸Å½¯' : 'ðÅ¸â€œâ€°'}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Margem</h3>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {currentMonthData.revenue > 0 ? ((currentMonthData.profit / currentMonthData.revenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-3xl">ðÅ¸â€œÅ </div>
          </div>
        </div>
      </div>

      {/* MovimentaÃ§Ã£o de Animais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">ðÅ¸�â€ž</span>
          MovimentaÃ§Ã£o de Animais - {MONTHS[selectedMonth - 1]}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl mb-2">ðÅ¸�â€ž</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {currentMonthData.animals.born}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nascimentos</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl mb-2">ðÅ¸â€™°</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currentMonthData.animals.sold}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vendas</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl mb-2">ðÅ¸â€™â€�</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {currentMonthData.animals.died}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ãâ€œbitos</div>
          </div>
        </div>
      </div>

      {/* Eventos do MÃªs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">ðÅ¸â€œâ€¦</span>
          Eventos e Atividades
        </h3>
        
        {currentMonthData.events.length > 0 ? (
          <div className="space-y-3">
            {currentMonthData.events.map((event, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-900 dark:text-white">{event}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhum evento registrado para este mÃªs
          </p>
        )}
      </div>
    </div>
  )

  const renderChartView = () => (
    <div className="space-y-6">
      {/* GrÃ¡fico de Linha - EvoluÃ§Ã£o Mensal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-2">ðÅ¸â€œË†</span>
          EvoluÃ§Ã£o Mensal - {selectedYear}
        </h3>
        
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 800 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="50"
                y1={i * 40 + 20}
                x2="750"
                y2={i * 40 + 20}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-300 dark:text-gray-600"
              />
            ))}

            {/* Linha de Custos */}
            <polyline
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              points={Object.entries(monthlyData).map(([month, data], index) => {
                const x = 50 + (index * 60)
                const y = 180 - (data.costs / Math.max(...Object.values(monthlyData).map(d => d.costs)) * 140)
                return `${x},${y}`
              }).join(' ')}
            />

            {/* Linha de Receitas */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              points={Object.entries(monthlyData).map(([month, data], index) => {
                const x = 50 + (index * 60)
                const maxRevenue = Math.max(...Object.values(monthlyData).map(d => d.revenue))
                const y = maxRevenue > 0 ? 180 - (data.revenue / maxRevenue * 140) : 180
                return `${x},${y}`
              }).join(' ')}
            />

            {/* Labels dos meses */}
            {MONTHS.map((month, index) => (
              <text
                key={index}
                x={50 + (index * 60)}
                y={195}
                textAnchor="middle"
                className="text-xs fill-current text-gray-500"
              >
                {month.substring(0, 3)}
              </text>
            ))}
          </svg>
        </div>

        {/* Legenda */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Custos</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Receitas</span>
          </div>
        </div>
      </div>

      {/* Comparativo Mensal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-2">ðÅ¸â€œÅ </span>
          Comparativo Mensal
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">MÃªs</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Custos</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Receitas</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Lucro</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Margem</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-white">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, index) => {
                const data = monthlyData[index + 1]
                const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0
                
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index + 1 === selectedMonth ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{month}</td>
                    <td className="p-3 text-center text-red-600 dark:text-red-400">
                      R$ {data.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-green-600 dark:text-green-400">
                      R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-center font-bold ${data.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R$ {data.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                      {margin.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                      {data.animals.sold}
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              ðÅ¸â€œâ€¦ RelatÃ³rio Mensal
              <span className="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
            </h1>
            <p className="text-purple-100 text-lg">
              AnÃ¡lise detalhada da performance mensal do rebanho
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              R$ {yearlyTotals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-purple-200">Lucro Anual</div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MÃªs
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {MONTHS.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewType('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'summary'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ðÅ¸â€œÅ  Resumo
            </button>
            <button
              onClick={() => setViewType('chart')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'chart'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ðÅ¸â€œË† GrÃ¡ficos
            </button>
          </div>
        </div>
      </div>

      {/* ConteÃºdo */}
      {viewType === 'summary' ? renderSummaryView() : renderChartView()}

      {/* Resumo Anual */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="mr-3">ðÅ¸â€œË†</span>
          Resumo Anual {selectedYear}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              R$ {yearlyTotals.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Custos Totais</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              R$ {yearlyTotals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Receitas Totais</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className={`text-lg font-bold ${yearlyTotals.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              R$ {yearlyTotals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lucro Total</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {yearlyTotals.animalsBorn}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nascimentos</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {yearlyTotals.animalsSold}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vendas</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
              {yearlyTotals.revenue > 0 ? ((yearlyTotals.profit / yearlyTotals.revenue) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Margem Anual</div>
          </div>
        </div>
      </div>
    </div>
  )
}