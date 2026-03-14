
import React, { useMemo, useState } from 'react'

import { formatCurrency, formatDate } from '../../utils/formatters'

const AdvancedReports = ({ animals, costs, sales = [] }) => {
  const [reportType, setReportType] = useState('financial')
  const [dateRange, setDateRange] = useState('last30days')

  const reportData = useMemo(() => {
    if (!animals || !Array.isArray(animals)) return null

    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last30days':
        startDate.setDate(now.getDate() - 30)
        break
      case 'last90days':
        startDate.setDate(now.getDate() - 90)
        break
      case 'lastyear':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Filtrar dados por perÃ­odo
    const filteredCosts = costs?.filter(cost => {
      if (!cost.data) return false
      return new Date(cost.data) >= startDate
    }) || []

    const filteredSales = sales?.filter(sale => {
      if (!sale.data) return false
      return new Date(sale.data) >= startDate
    }) || []

    // RelatÃ³rio Financeiro
    if (reportType === 'financial') {
      const totalCosts = filteredCosts.reduce((sum, cost) => sum + (parseFloat(cost.valor) || 0), 0)
      const totalRevenue = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.valor) || 0), 0)
      const profit = totalRevenue - totalCosts
      const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0

      // Custos por categoria
      const costsByCategory = filteredCosts.reduce((acc, cost) => {
        const category = cost.tipo || 'Outros'
        acc[category] = (acc[category] || 0) + (parseFloat(cost.valor) || 0)
        return acc
      }, {})

      return {
        type: 'financial',
        summary: {
          totalCosts,
          totalRevenue,
          profit,
          roi,
          transactionCount: filteredCosts.length + filteredSales.length
        },
        details: {
          costsByCategory,
          recentTransactions: [...filteredCosts, ...filteredSales]
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10)
        }
      }
    }

    // RelatÃ³rio de Produtividade
    if (reportType === 'productivity') {
      const activeAnimals = animals.filter(a => a.situacao === 'Ativo')
      const births = animals.filter(a => {
        if (!a.dataNascimento) return false
        return new Date(a.dataNascimento) >= startDate
      })

      const avgWeight = activeAnimals.length > 0 
        ? activeAnimals.reduce((sum, a) => sum + (a.peso || 0), 0) / activeAnimals.length 
        : 0

      const weightGainData = activeAnimals.map(animal => {
        return {
          id: animal.id,
          nome: animal.nome || animal.numero,
          peso: animal.peso || 0
        }
      }).sort((a, b) => (b.peso || 0) - (a.peso || 0))

      return {
        type: 'productivity',
        summary: {
          activeAnimals: activeAnimals.length,
          newBirths: births.length,
          avgWeight: avgWeight,
          birthRate: animals.length > 0 ? (births.length / animals.length) * 100 : 0
        },
        details: {
          topPerformers: weightGainData.slice(0, 5),
          breedPerformance: animals.reduce((acc, animal) => {
            const breed = animal.raca || 'NÃ£o informado'
            if (!acc[breed]) {
              acc[breed] = { count: 0, totalWeight: 0, avgWeight: 0 }
            }
            acc[breed].count++
            acc[breed].totalWeight += animal.peso || 0
            acc[breed].avgWeight = acc[breed].totalWeight / acc[breed].count
            return acc
          }, {})
        }
      }
    }

    // RelatÃ³rio de SaÃºde
    if (reportType === 'health') {
      const healthCosts = filteredCosts.filter(c => 
        c.tipo === 'Medicamentos' || c.tipo === 'VeterinÃ¡rios'
      )
      
      const totalHealthCosts = healthCosts.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0)
      const avgHealthCostPerAnimal = animals.length > 0 ? totalHealthCosts / animals.length : 0

      const healthByType = healthCosts.reduce((acc, cost) => {
        const type = cost.subtipo || cost.tipo
        acc[type] = (acc[type] || 0) + (parseFloat(cost.valor) || 0)
        return acc
      }, {})

      const mortalityRate = animals.length > 0 
        ? (animals.filter(a => a.situacao === 'Morto').length / animals.length) * 100 
        : 0

      return {
        type: 'health',
        summary: {
          totalHealthCosts,
          avgHealthCostPerAnimal,
          healthInterventions: healthCosts.length,
          mortalityRate
        },
        details: {
          healthByType,
          recentHealthEvents: healthCosts
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10)
        }
      }
    }

    return null
  }, [animals, costs, sales, reportType, dateRange])

  const exportReport = () => {
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-${reportType}-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">ðÅ¸â€œÅ </div>
        <p className="text-gray-500 dark:text-gray-400">Carregando dados do relatÃ³rio...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles do RelatÃ³rio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de RelatÃ³rio
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field"
              >
                <option value="financial">ðÅ¸â€™° Financeiro</option>
                <option value="productivity">ðÅ¸â€œË† Produtividade</option>
                <option value="health">ðÅ¸�¥ SaÃºde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PerÃ­odo
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="last7days">ÃÅ¡ltimos 7 dias</option>
                <option value="last30days">ÃÅ¡ltimos 30 dias</option>
                <option value="last90days">ÃÅ¡ltimos 90 dias</option>
                <option value="lastyear">ÃÅ¡ltimo ano</option>
              </select>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="btn-secondary flex items-center"
          >
            ðÅ¸â€œ¥ Exportar RelatÃ³rio
          </button>
        </div>
      </div>

      {/* Resumo do RelatÃ³rio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(reportData.summary).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {typeof value === 'number' && key.includes('Cost') || key.includes('Revenue') || key.includes('profit') 
                ? formatCurrency(value)
                : typeof value === 'number' && (key.includes('Rate') || key === 'roi')
                ? `${value.toFixed(1)}%`
                : typeof value === 'number' && key.includes('Weight')
                ? `${Math.round(value)}kg`
                : value
              }
            </div>
          </div>
        ))}
      </div>

      {/* Detalhes do RelatÃ³rio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detalhes do RelatÃ³rio
        </h3>
        
        {reportData.type === 'financial' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Custos por Categoria</h4>
              <div className="space-y-2">
                {Object.entries(reportData.details.costsByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportData.type === 'productivity' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Performers</h4>
              <div className="space-y-2">
                {reportData.details.topPerformers.map((animal, index) => (
                  <div key={animal.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      #{index + 1} {animal.nome}
                    </span>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{animal.peso}kg</div>
                      <div className="text-xs text-gray-500">EficiÃªncia: {animal.efficiency.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportData.type === 'health' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Gastos por Tipo de Tratamento</h4>
              <div className="space-y-2">
                {Object.entries(reportData.details.healthByType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedReports