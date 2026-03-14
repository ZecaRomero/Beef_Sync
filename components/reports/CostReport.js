import React, { useEffect, useState } from 'react'
import { 
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { ChartPieIcon, CalendarDaysIcon, TrendingUpIcon, TrendingDownIcon } from '../ui/Icons'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

export default function CostReport() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30')
  const [costType, setCostType] = useState('all')
  const [error, setError] = useState(null)

  // Carregar dados de custos
  const loadCostData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados de custos e animais
      const [costsRes, animalsRes, medicamentosRes] = await Promise.all([
        fetch('/api/custos'),
        fetch('/api/animals'),
        fetch('/api/medicamentos')
      ])

      if (!costsRes.ok || !animalsRes.ok) {
        throw new Error('Erro ao carregar dados de custos')
      }

      const [costs, animals, medicamentos] = await Promise.all([
        costsRes.json(),
        animalsRes.json(),
        medicamentosRes.ok ? medicamentosRes.json() : []
      ])

      // Processar dados de custos
      const costAnalysis = analyzeCosts(costs, animals, medicamentos, period, costType)
      setData(costAnalysis)

    } catch (err) {
      console.error('Erro ao carregar dados de custos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Analisar custos
  const analyzeCosts = (costs, animals, medicamentos, periodDays, filterType) => {
    const now = new Date()
    const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    // Filtrar custos por perÃ­odo
    let filteredCosts = costs.filter(cost => 
      new Date(cost.data) >= periodStart
    )

    // Filtrar por tipo se especificado
    if (filterType !== 'all') {
      filteredCosts = filteredCosts.filter(cost => 
        cost.tipo?.toLowerCase().includes(filterType.toLowerCase()) ||
        cost.categoria?.toLowerCase().includes(filterType.toLowerCase())
      )
    }

    // Calcular totais
    const totalCosts = filteredCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
    const avgCostPerDay = periodDays > 0 ? totalCosts / periodDays : 0
    const avgCostPerAnimal = animals.length > 0 ? totalCosts / animals.length : 0

    // Categorizar custos
    const costsByCategory = categorizeCosts(filteredCosts)
    const costsByAnimal = analyzeCostsByAnimal(filteredCosts, animals)
    const costsByMonth = analyzeCostsByMonth(filteredCosts, periodDays)
    const costTrends = analyzeCostTrends(costs, periodDays)

    // Identificar maiores gastos
    const topExpenses = filteredCosts
      .sort((a, b) => (b.valor || 0) - (a.valor || 0))
      .slice(0, 10)

    // AnÃ¡lise de eficiÃªncia
    const efficiency = analyzeCostEfficiency(filteredCosts, animals, medicamentos)

    return {
      period: periodDays,
      filterType,
      summary: {
        totalCosts,
        avgCostPerDay,
        avgCostPerAnimal,
        totalTransactions: filteredCosts.length,
        costGrowth: calculateCostGrowth(costs, periodDays)
      },
      breakdown: {
        byCategory: costsByCategory,
        byAnimal: costsByAnimal,
        byMonth: costsByMonth,
        topExpenses
      },
      trends: costTrends,
      efficiency,
      alerts: generateCostAlerts(filteredCosts, animals, avgCostPerAnimal)
    }
  }

  // Categorizar custos
  const categorizeCosts = (costs) => {
    const categories = {}
    
    costs.forEach(cost => {
      const category = cost.categoria || cost.tipo || 'Outros'
      if (!categories[category]) {
        categories[category] = {
          name: category,
          total: 0,
          count: 0,
          items: []
        }
      }
      categories[category].total += cost.valor || 0
      categories[category].count += 1
      categories[category].items.push(cost)
    })

    return Object.values(categories)
      .sort((a, b) => b.total - a.total)
      .map(cat => ({
        ...cat,
        percentage: costs.length > 0 ? (cat.count / costs.length) * 100 : 0,
        avgCost: cat.count > 0 ? cat.total / cat.count : 0
      }))
  }

  // Analisar custos por animal
  const analyzeCostsByAnimal = (costs, animals) => {
    const animalCosts = {}
    
    costs.forEach(cost => {
      const animalId = cost.animal_id
      if (!animalId) return
      
      if (!animalCosts[animalId]) {
        const animal = animals.find(a => a.id === animalId)
        animalCosts[animalId] = {
          animal,
          total: 0,
          count: 0,
          costs: []
        }
      }
      animalCosts[animalId].total += cost.valor || 0
      animalCosts[animalId].count += 1
      animalCosts[animalId].costs.push(cost)
    })

    return Object.values(animalCosts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20) // Top 20 animais com maior custo
  }

  // Analisar custos por mÃªs
  const analyzeCostsByMonth = (costs, periodDays) => {
    const months = {}
    
    costs.forEach(cost => {
      const date = new Date(cost.data)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0,
          avgPerDay: 0
        }
      }
      months[monthKey].total += cost.valor || 0
      months[monthKey].count += 1
    })

    // Calcular mÃ©dia por dia para cada mÃªs
    Object.values(months).forEach(month => {
      const daysInMonth = new Date(
        parseInt(month.month.split('-')[0]),
        parseInt(month.month.split('-')[1]),
        0
      ).getDate()
      month.avgPerDay = month.total / daysInMonth
    })

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }

  // Analisar tendÃªncias de custos
  const analyzeCostTrends = (allCosts, periodDays) => {
    const intervals = Math.min(periodDays / 7, 12) // MÃ¡ximo 12 intervalos
    const intervalDays = periodDays / intervals
    const now = new Date()

    const trends = []
    for (let i = 0; i < intervals; i++) {
      const intervalEnd = new Date(now.getTime() - (i * intervalDays * 24 * 60 * 60 * 1000))
      const intervalStart = new Date(intervalEnd.getTime() - (intervalDays * 24 * 60 * 60 * 1000))

      const intervalCosts = allCosts.filter(cost => {
        const date = new Date(cost.data)
        return date >= intervalStart && date < intervalEnd
      })

      const total = intervalCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
      
      trends.unshift({
        period: `${intervalStart.toLocaleDateString()} - ${intervalEnd.toLocaleDateString()}`,
        total,
        count: intervalCosts.length,
        avgPerDay: intervalDays > 0 ? total / intervalDays : 0
      })
    }

    return trends
  }

  // Calcular crescimento de custos
  const calculateCostGrowth = (allCosts, periodDays) => {
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    const currentPeriodCosts = allCosts.filter(cost => {
      const date = new Date(cost.data)
      return date >= currentPeriodStart
    }).reduce((sum, cost) => sum + (cost.valor || 0), 0)

    const previousPeriodCosts = allCosts.filter(cost => {
      const date = new Date(cost.data)
      return date >= previousPeriodStart && date < currentPeriodStart
    }).reduce((sum, cost) => sum + (cost.valor || 0), 0)

    if (previousPeriodCosts === 0) return 0
    return ((currentPeriodCosts - previousPeriodCosts) / previousPeriodCosts) * 100
  }

  // Analisar eficiÃªncia de custos
  const analyzeCostEfficiency = (costs, animals, medicamentos) => {
    const medicamentoCosts = costs.filter(c => 
      c.categoria?.toLowerCase().includes('medicamento') ||
      c.tipo?.toLowerCase().includes('medicamento')
    )
    
    const totalMedicamento = medicamentoCosts.reduce((sum, c) => sum + (c.valor || 0), 0)

    return {
      medicamentoCostPerAnimal: animals.length > 0 ? totalMedicamento / animals.length : 0,
      medicamentoEfficiency: medicamentos.length > 0 ? totalMedicamento / medicamentos.length : 0,
      costDistribution: {
        medicamento: totalMedicamento,
        outros: costs.reduce((sum, c) => sum + (c.valor || 0), 0) - totalMedicamento
      }
    }
  }

  // Gerar alertas de custos
  const generateCostAlerts = (costs, animals, avgCostPerAnimal) => {
    const alerts = []

    // Alerta de custo alto por animal
    const highCostThreshold = avgCostPerAnimal * 1.5
    const highCostAnimals = costs.filter(c => c.valor > highCostThreshold)
    if (highCostAnimals.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Custos Elevados Detectados',
        message: `${highCostAnimals.length} transaÃ§Ãµes com custos acima da mÃ©dia (R$ ${highCostThreshold.toFixed(2)})`
      })
    }

    // Alerta de crescimento de custos
    const totalCosts = costs.reduce((sum, c) => sum + (c.valor || 0), 0)
    if (totalCosts > 0) {
      const avgMonthly = totalCosts / (costs.length > 0 ? 1 : 1)
      if (avgMonthly > 1000) {
        alerts.push({
          type: 'info',
          title: 'AnÃ¡lise de Custos',
          message: `Custo mÃ©dio mensal de R$ ${avgMonthly.toFixed(2)} por transaÃ§Ã£o`
        })
      }
    }

    return alerts
  }

  // Exportar relatÃ³rio
  const exportReport = () => {
    if (!data) return

    const reportData = {
      titulo: 'RelatÃ³rio de Custos',
      periodo: `${data.period} dias`,
      filtro: data.filterType,
      gerado_em: new Date().toLocaleString(),
      resumo: data.summary,
      detalhamento: data.breakdown,
      tendencias: data.trends,
      eficiencia: data.efficiency,
      alertas: data.alerts
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-custos-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Imprimir relatÃ³rio
  const printReport = () => {
    window.print()
  }

  useEffect(() => {
    loadCostData()
  }, [period, costType])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={CurrencyDollarIcon}
        title="Erro ao carregar relatÃ³rio"
        description={error}
        action={
          <Button onClick={loadCostData}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={CurrencyDollarIcon}
        title="Nenhum dado encontrado"
        description="NÃ£o hÃ¡ dados de custos para o perÃ­odo selecionado"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* CabeÃ§alho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            RelatÃ³rio de Custos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AnÃ¡lise detalhada dos custos operacionais
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">ÃÅ¡ltimos 7 dias</option>
            <option value="30">ÃÅ¡ltimos 30 dias</option>
            <option value="90">ÃÅ¡ltimos 90 dias</option>
            <option value="365">ÃÅ¡ltimo ano</option>
          </select>
          <select
            value={costType}
            onChange={(e) => setCostType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos os custos</option>
            <option value="medicamento">Medicamentos</option>
            <option value="veterinario">VeterinÃ¡rio</option>
            <option value="manutenÃ§Ã£o">ManutenÃ§Ã£o</option>
          </select>
          <Button variant="outline" onClick={exportReport}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={printReport}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
                  : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
              }`}
            >
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custo Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {data.summary.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {data.summary.totalTransactions} transaÃ§Ãµes
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custo por Dia</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {data.summary.avgCostPerDay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  MÃ©dia diÃ¡ria
                </p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custo por Animal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {data.summary.avgCostPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  MÃ©dia por cabeÃ§a
                </p>
              </div>
              <ChartPieIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crescimento</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.summary.costGrowth > 0 ? '+' : ''}{data.summary.costGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  vs perÃ­odo anterior
                </p>
              </div>
              {data.summary.costGrowth > 0 ? (
                <TrendingUpIcon className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDownIcon className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Custos por Categoria */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Custos por Categoria
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {data.breakdown.byCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h4>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{category.count} transaÃ§Ãµes ({category.percentage.toFixed(1)}%)</span>
                    <span>MÃ©dia: R$ {category.avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Top 10 Maiores Gastos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maiores Gastos
          </h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">DescriÃ§Ã£o</th>
                  <th className="text-left py-2">Categoria</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.topExpenses.map((expense, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2">
                      {new Date(expense.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2">{expense.descricao || 'N/A'}</td>
                    <td className="py-2">
                      <Badge variant="outline">
                        {expense.categoria || expense.tipo || 'Outros'}
                      </Badge>
                    </td>
                    <td className="text-right py-2 font-medium">
                      R$ {(expense.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* AnÃ¡lise de EficiÃªncia */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AnÃ¡lise de EficiÃªncia
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Medicamento/Animal</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                R$ {data.efficiency.medicamentoCostPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Medicamentos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                R$ {data.efficiency.costDistribution.medicamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
