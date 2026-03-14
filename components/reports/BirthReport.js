
import React, { useEffect, useState } from 'react'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function BirthReport() {
  const [births, setBirths] = useState([])
  const [stats, setStats] = useState({})
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    loadBirths()
  }, [])

  const loadBirths = () => {
    const savedBirths = localStorage.getItem('birthData')
    if (savedBirths) {
      const birthData = JSON.parse(savedBirths)
      setBirths(birthData)
      calculateStats(birthData)
    }
  }

  const calculateStats = (birthData) => {
    // Filtrar por período se necessário
    let filteredData = birthData
    if (selectedPeriod !== 'all') {
      const now = new Date()
      const monthsAgo = selectedPeriod === '6m' ? 6 : selectedPeriod === '3m' ? 3 : 1
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
      
      filteredData = birthData.filter(b => {
        if (!b.data) return true
        return new Date(b.data) >= cutoffDate
      })
    }

    const total = filteredData.length
    const nascidos = filteredData.filter(b => b.status === 'nascido').length
    const machos = filteredData.filter(b => b.sexo === 'M' && b.status === 'nascido').length
    const femeas = filteredData.filter(b => b.sexo === 'F' && b.status === 'nascido').length
    const mortos = filteredData.filter(b => b.status === 'morto').length
    const abortos = filteredData.filter(b => b.status === 'aborto').length
    const gestantes = filteredData.filter(b => b.status === 'gestante').length
    const atrasadas = filteredData.filter(b => b.status === 'gestante_atrasada').length

    // Estatísticas por touro
    const statsByTouro = filteredData.reduce((acc, birth) => {
      if (!acc[birth.touro]) {
        acc[birth.touro] = { total: 0, nascidos: 0, machos: 0, femeas: 0, mortos: 0, abortos: 0 }
      }
      acc[birth.touro].total++
      if (birth.status === 'nascido') {
        acc[birth.touro].nascidos++
        if (birth.sexo === 'M') acc[birth.touro].machos++
        if (birth.sexo === 'F') acc[birth.touro].femeas++
      }
      if (birth.status === 'morto') acc[birth.touro].mortos++
      if (birth.status === 'aborto') acc[birth.touro].abortos++
      return acc
    }, {})

    // Nascimentos por mês
    const nascimentosPorMes = filteredData
      .filter(b => b.data)
      .reduce((acc, birth) => {
        const mes = new Date(birth.data).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        acc[mes] = (acc[mes] || 0) + 1
        return acc
      }, {})

    setStats({
      total,
      nascidos,
      machos,
      femeas,
      mortos,
      abortos,
      gestantes,
      atrasadas,
      statsByTouro,
      nascimentosPorMes,
      taxaSucesso: total > 0 ? (nascidos / total * 100) : 0,
      taxaMortalidade: total > 0 ? ((mortos + abortos) / total * 100) : 0
    })
  }

  useEffect(() => {
    if (births.length > 0) {
      calculateStats(births)
    }
  }, [selectedPeriod, births])

  // Dados para gráfico de barras (nascimentos por touro)
  const barChartData = {
    labels: Object.keys(stats.statsByTouro || {}).map(touro => 
      touro.length > 20 ? touro.substring(0, 20) + '...' : touro
    ),
    datasets: [
      {
        label: 'Nascidos',
        data: Object.values(stats.statsByTouro || {}).map(s => s.nascidos),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'Mortos/Abortos',
        data: Object.values(stats.statsByTouro || {}).map(s => s.mortos + s.abortos),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  }

  // Dados para gráfico de pizza (distribuição por sexo)
  const pieChartData = {
    labels: ['Machos', 'Fêmeas'],
    datasets: [
      {
        data: [stats.machos || 0, stats.femeas || 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Nascimentos por Touro'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribuição por Sexo'
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Relatório de Nascimentos
        </h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">Todos os períodos</option>
          <option value="1m">Último mês</option>
          <option value="3m">Últimos 3 meses</option>
          <option value="6m">Últimos 6 meses</option>
        </select>
      </div>

      {births.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🐄</div>
          <h3 className="text-lg font-medium mb-2">Nenhum nascimento registrado</h3>
          <p className="text-sm">Comece registrando nascimentos para ver relatórios detalhados</p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.nascidos || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Nascidos</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.machos || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Machos</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {stats.femeas || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fêmeas</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {(stats.mortos || 0) + (stats.abortos || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mortos</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.gestantes || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gestantes</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(stats.taxaSucesso || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sucesso</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {(stats.taxaMortalidade || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mortalidade</div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <Bar data={barChartData} options={chartOptions} />
            </div>
            <div className="card p-6">
              <Doughnut data={pieChartData} options={pieOptions} />
            </div>
          </div>

          {/* Tabela Detalhada por Touro */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Desempenho por Touro
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Touro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Nascidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Machos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fêmeas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Mortos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Taxa Sucesso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(stats.statsByTouro || {})
                    .sort(([,a], [,b]) => (b.nascidos / Math.max(b.total, 1)) - (a.nascidos / Math.max(a.total, 1)))
                    .map(([touro, tourosStats]) => {
                      const taxa = tourosStats.total > 0 ? (tourosStats.nascidos / tourosStats.total * 100) : 0
                      return (
                        <tr key={touro} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {touro.length > 40 ? touro.substring(0, 40) + '...' : touro}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {tourosStats.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                            {tourosStats.nascidos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                            {tourosStats.machos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-600 dark:text-pink-400">
                            {tourosStats.femeas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                            {tourosStats.mortos + tourosStats.abortos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              taxa >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              taxa >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {taxa.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights e Recomendações */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 Insights e Recomendações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.taxaSucesso >= 80 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-green-800 dark:text-green-200 font-semibold mb-2">
                    🎉 Excelente Performance
                  </div>
                  <div className="text-green-700 dark:text-green-300 text-sm">
                    Taxa de sucesso de {stats.taxaSucesso.toFixed(1)}% está acima da média. Continue com a estratégia atual.
                  </div>
                </div>
              )}
              
              {stats.taxaMortalidade > 20 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-red-800 dark:text-red-200 font-semibold mb-2">
                    ⚠️ Alta Mortalidade
                  </div>
                  <div className="text-red-700 dark:text-red-300 text-sm">
                    Taxa de mortalidade de {stats.taxaMortalidade.toFixed(1)}% requer atenção. Revisar protocolos veterinários.
                  </div>
                </div>
              )}

              {stats.atrasadas > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                    ⏰ Partos Atrasados
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                    {stats.atrasadas} receptoras com parto atrasado. Verificar e acompanhar de perto.
                  </div>
                </div>
              )}

              {Object.keys(stats.statsByTouro || {}).length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
                    📊 Análise de Touros
                  </div>
                  <div className="text-blue-700 dark:text-blue-300 text-sm">
                    {Object.keys(stats.statsByTouro).length} touros em uso. Considere focar nos de melhor performance.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}