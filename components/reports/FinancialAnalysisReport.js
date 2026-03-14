import React, { useEffect, useState } from 'react'
import { 
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
  CalculatorIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '../ui/Icons'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

export default function FinancialAnalysisReport() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState(null)

  // Carregar dados financeiros
  const loadFinancialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todos os dados necessários
      const [animalsRes, costsRes, salesRes, birthsRes] = await Promise.all([
        fetch('/api/animals'),
        fetch('/api/custos'),
        fetch('/api/animals?filter=vendidos'),
        fetch('/api/births')
      ])

      if (!animalsRes.ok || !costsRes.ok) {
        throw new Error('Erro ao carregar dados financeiros')
      }

      const [animals, costs, sales, births] = await Promise.all([
        animalsRes.json(),
        costsRes.json(),
        salesRes.ok ? salesRes.json() : [],
        birthsRes.ok ? birthsRes.json() : []
      ])

      // Analisar dados financeiros
      const periodDays = Math.ceil((new Date(period.endDate) - new Date(period.startDate)) / (1000 * 60 * 60 * 24))
      const analysis = performFinancialAnalysis(animals, costs, sales, births, periodDays)
      setData(analysis)

    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Realizar análise financeira completa
  const performFinancialAnalysis = (animals, costs, sales, births, periodDays) => {
    const now = new Date()
    const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    // Filtrar dados por período
    const periodCosts = costs.filter(cost => 
      new Date(cost.data) >= periodStart
    )
    
    const periodSales = sales.filter(sale => 
      new Date(sale.data_venda || sale.data) >= periodStart
    )

    const periodBirths = births.filter(birth => 
      new Date(birth.data_nascimento) >= periodStart
    )

    // Calcular métricas básicas
    const totalRevenue = periodSales.reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)
    const totalCosts = periodCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
    const grossProfit = totalRevenue - totalCosts
    const netProfit = grossProfit // Simplificado - pode incluir impostos, depreciação, etc.

    // Métricas de rentabilidade
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0

    // Análise de fluxo de caixa
    const cashFlow = analyzeCashFlow(periodCosts, periodSales, periodDays)
    
    // Análise de rentabilidade por animal
    const animalProfitability = analyzeAnimalProfitability(animals, costs, sales)
    
    // Projeções financeiras
    const projections = calculateProjections(totalRevenue, totalCosts, periodDays)
    
    // Análise de break-even
    const breakEven = calculateBreakEven(costs, sales, animals)
    
    // Indicadores de performance
    const kpis = calculateKPIs(animals, costs, sales, births, periodDays)
    
    // Comparação com período anterior
    const comparison = compareWithPreviousPeriod(costs, sales, periodDays)

    return {
      period: periodDays,
      summary: {
        totalRevenue,
        totalCosts,
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
        roi,
        transactionCount: periodCosts.length + periodSales.length
      },
      cashFlow,
      profitability: animalProfitability,
      projections,
      breakEven,
      kpis,
      comparison,
      trends: analyzeTrends(costs, sales, periodDays)
    }
  }

  // Analisar fluxo de caixa
  const analyzeCashFlow = (costs, sales, periodDays) => {
    const intervals = Math.min(periodDays / 7, 12)
    const intervalDays = periodDays / intervals
    const now = new Date()

    const cashFlowData = []
    let cumulativeFlow = 0

    for (let i = 0; i < intervals; i++) {
      const intervalEnd = new Date(now.getTime() - (i * intervalDays * 24 * 60 * 60 * 1000))
      const intervalStart = new Date(intervalEnd.getTime() - (intervalDays * 24 * 60 * 60 * 1000))

      const intervalCosts = costs.filter(cost => {
        const date = new Date(cost.data)
        return date >= intervalStart && date < intervalEnd
      })

      const intervalSales = sales.filter(sale => {
        const date = new Date(sale.data_venda || sale.data)
        return date >= intervalStart && date < intervalEnd
      })

      const inflow = intervalSales.reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)
      const outflow = intervalCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
      const netFlow = inflow - outflow
      cumulativeFlow += netFlow

      cashFlowData.unshift({
        period: `${intervalStart.toLocaleDateString()} - ${intervalEnd.toLocaleDateString()}`,
        inflow,
        outflow,
        netFlow,
        cumulativeFlow
      })
    }

    return {
      data: cashFlowData,
      totalInflow: cashFlowData.reduce((sum, item) => sum + item.inflow, 0),
      totalOutflow: cashFlowData.reduce((sum, item) => sum + item.outflow, 0),
      finalBalance: cumulativeFlow
    }
  }

  // Analisar rentabilidade por animal
  const analyzeAnimalProfitability = (animals, costs, sales) => {
    const animalData = animals.map(animal => {
      const animalCosts = costs.filter(cost => cost.animal_id === animal.id)
      const animalSale = sales.find(sale => sale.id === animal.id || sale.animal_id === animal.id)
      
      const totalCost = animalCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
      const revenue = animalSale ? (animalSale.valor_venda || animalSale.valor || 0) : 0
      const profit = revenue - totalCost
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      return {
        animal,
        totalCost,
        revenue,
        profit,
        margin,
        costPerDay: animal.data_nascimento ? 
          totalCost / Math.max(1, Math.floor((new Date() - new Date(animal.data_nascimento)) / (1000 * 60 * 60 * 24))) : 0
      }
    })

    return {
      all: animalData,
      profitable: animalData.filter(a => a.profit > 0),
      unprofitable: animalData.filter(a => a.profit < 0),
      topPerformers: animalData.sort((a, b) => b.profit - a.profit).slice(0, 10),
      worstPerformers: animalData.sort((a, b) => a.profit - b.profit).slice(0, 10)
    }
  }

  // Calcular projeções financeiras
  const calculateProjections = (revenue, costs, periodDays) => {
    const dailyRevenue = revenue / periodDays
    const dailyCosts = costs / periodDays
    const dailyProfit = dailyRevenue - dailyCosts

    return {
      monthly: {
        revenue: dailyRevenue * 30,
        costs: dailyCosts * 30,
        profit: dailyProfit * 30
      },
      quarterly: {
        revenue: dailyRevenue * 90,
        costs: dailyCosts * 90,
        profit: dailyProfit * 90
      },
      yearly: {
        revenue: dailyRevenue * 365,
        costs: dailyCosts * 365,
        profit: dailyProfit * 365
      }
    }
  }

  // Calcular ponto de equilíbrio
  const calculateBreakEven = (costs, sales, animals) => {
    const totalCosts = costs.reduce((sum, cost) => sum + (cost.valor || 0), 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)
    const soldAnimals = sales.length
    
    if (soldAnimals === 0) return null

    const avgRevenuePerAnimal = totalRevenue / soldAnimals
    const avgCostPerAnimal = totalCosts / animals.length
    const contributionMargin = avgRevenuePerAnimal - avgCostPerAnimal

    if (contributionMargin <= 0) return null

    const breakEvenUnits = Math.ceil(totalCosts / contributionMargin)
    const breakEvenRevenue = breakEvenUnits * avgRevenuePerAnimal

    return {
      units: breakEvenUnits,
      revenue: breakEvenRevenue,
      avgRevenuePerAnimal,
      avgCostPerAnimal,
      contributionMargin,
      currentUnits: soldAnimals,
      unitsToBreakEven: Math.max(0, breakEvenUnits - soldAnimals)
    }
  }

  // Calcular KPIs
  const calculateKPIs = (animals, costs, sales, births, periodDays) => {
    const activeAnimals = animals.filter(a => a.status === 'ativo').length
    const totalAnimals = animals.length
    const totalCosts = costs.reduce((sum, cost) => sum + (parseFloat(cost.valor) || 0), 0)
    const totalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.valor_venda || sale.valor) || 0), 0)

    return {
      revenuePerAnimal: totalAnimals > 0 ? totalRevenue / totalAnimals : 0,
      costPerAnimal: totalAnimals > 0 ? totalCosts / totalAnimals : 0,
      profitPerAnimal: totalAnimals > 0 ? (totalRevenue - totalCosts) / totalAnimals : 0,
      birthRate: activeAnimals > 0 ? (births.length / activeAnimals) * 100 : 0,
      salesRate: totalAnimals > 0 ? (sales.length / totalAnimals) * 100 : 0,
      costEfficiency: totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0,
      assetTurnover: totalAnimals > 0 ? totalRevenue / totalAnimals : 0,
      operatingMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0
    }
  }

  // Comparar com período anterior
  const compareWithPreviousPeriod = (allCosts, allSales, periodDays) => {
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    const currentCosts = allCosts.filter(cost => {
      const date = new Date(cost.data)
      return date >= currentPeriodStart
    }).reduce((sum, cost) => sum + (cost.valor || 0), 0)

    const previousCosts = allCosts.filter(cost => {
      const date = new Date(cost.data)
      return date >= previousPeriodStart && date < currentPeriodStart
    }).reduce((sum, cost) => sum + (cost.valor || 0), 0)

    const currentRevenue = allSales.filter(sale => {
      const date = new Date(sale.data_venda || sale.data)
      return date >= currentPeriodStart
    }).reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)

    const previousRevenue = allSales.filter(sale => {
      const date = new Date(sale.data_venda || sale.data)
      return date >= previousPeriodStart && date < currentPeriodStart
    }).reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)

    const currentProfit = currentRevenue - currentCosts
    const previousProfit = previousRevenue - previousCosts

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      },
      costs: {
        current: currentCosts,
        previous: previousCosts,
        change: previousCosts > 0 ? ((currentCosts - previousCosts) / previousCosts) * 100 : 0
      },
      profit: {
        current: currentProfit,
        previous: previousProfit,
        change: previousProfit !== 0 ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0
      }
    }
  }

  // Analisar tendências
  const analyzeTrends = (costs, sales, periodDays) => {
    const intervals = Math.min(periodDays / 7, 8)
    const intervalDays = periodDays / intervals
    const now = new Date()

    const trends = []
    for (let i = 0; i < intervals; i++) {
      const intervalEnd = new Date(now.getTime() - (i * intervalDays * 24 * 60 * 60 * 1000))
      const intervalStart = new Date(intervalEnd.getTime() - (intervalDays * 24 * 60 * 60 * 1000))

      const intervalCosts = costs.filter(cost => {
        const date = new Date(cost.data)
        return date >= intervalStart && date < intervalEnd
      }).reduce((sum, cost) => sum + (cost.valor || 0), 0)

      const intervalSales = sales.filter(sale => {
        const date = new Date(sale.data_venda || sale.data)
        return date >= intervalStart && date < intervalEnd
      }).reduce((sum, sale) => sum + (sale.valor_venda || sale.valor || 0), 0)

      trends.unshift({
        period: `${intervalStart.toLocaleDateString()}`,
        revenue: intervalSales,
        costs: intervalCosts,
        profit: intervalSales - intervalCosts
      })
    }

    return trends
  }

  // Exportar relatório
  const exportReport = () => {
    if (!data) return

    const reportData = {
      titulo: 'Análise Financeira Completa',
      periodo: `${data.period} dias`,
      gerado_em: new Date().toLocaleString(),
      resumo: data.summary,
      fluxo_caixa: data.cashFlow,
      rentabilidade: data.profitability,
      projecoes: data.projections,
      ponto_equilibrio: data.breakEven,
      kpis: data.kpis,
      comparacao: data.comparison,
      tendencias: data.trends
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analise-financeira-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Imprimir relatório
  const printReport = () => {
    window.print()
  }

  useEffect(() => {
    loadFinancialData()
  }, [period])

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
        icon={ChartBarIcon}
        title="Erro ao carregar análise financeira"
        description={error}
        action={
          <Button onClick={loadFinancialData}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={ChartBarIcon}
        title="Nenhum dado encontrado"
        description="Não há dados suficientes para gerar a análise financeira"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análise Financeira Completa
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Análise detalhada da performance financeira do negócio
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
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

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {data.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-1">
                  {data.comparison.revenue.change > 0 ? (
                    <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${data.comparison.revenue.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(data.comparison.revenue.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <BanknotesIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Custos Totais</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {data.summary.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-1">
                  {data.comparison.costs.change > 0 ? (
                    <ArrowUpIcon className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${data.comparison.costs.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(data.comparison.costs.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${data.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {data.summary.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-1">
                  {data.comparison.profit.change > 0 ? (
                    <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${data.comparison.profit.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(data.comparison.profit.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <CalculatorIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p className={`text-2xl font-bold ${data.summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  Margem: {data.summary.netMargin.toFixed(1)}%
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* KPIs Principais */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Indicadores de Performance (KPIs)
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita/Animal</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                R$ {data.kpis.revenuePerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Custo/Animal</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                R$ {data.kpis.costPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Lucro/Animal</p>
              <p className={`text-xl font-bold ${data.kpis.profitPerAnimal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {data.kpis.profitPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Nascimento</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {data.kpis.birthRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Ponto de Equilíbrio */}
      {data.breakEven && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Análise de Ponto de Equilíbrio
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Animais para Equilibrar</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.breakEven.units}
                </p>
                <p className="text-xs text-gray-500">
                  Faltam {data.breakEven.unitsToBreakEven} animais
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Receita de Equilíbrio</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {data.breakEven.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Margem de Contribuição</p>
                <p className="text-3xl font-bold text-purple-600">
                  R$ {data.breakEven.contributionMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">por animal</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Projeções Financeiras */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projeções Financeiras
          </h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Período</th>
                  <th className="text-right py-2">Receita Projetada</th>
                  <th className="text-right py-2">Custos Projetados</th>
                  <th className="text-right py-2">Lucro Projetado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">Mensal</td>
                  <td className="text-right py-2 text-green-600">
                    R$ {data.projections.monthly.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-2 text-red-600">
                    R$ {data.projections.monthly.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right py-2 font-medium ${data.projections.monthly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {data.projections.monthly.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">Trimestral</td>
                  <td className="text-right py-2 text-green-600">
                    R$ {data.projections.quarterly.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-2 text-red-600">
                    R$ {data.projections.quarterly.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right py-2 font-medium ${data.projections.quarterly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {data.projections.quarterly.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">Anual</td>
                  <td className="text-right py-2 text-green-600">
                    R$ {data.projections.yearly.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-2 text-red-600">
                    R$ {data.projections.yearly.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right py-2 font-medium ${data.projections.yearly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {data.projections.yearly.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Animais Mais Rentáveis
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.profitability.topPerformers.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.animal.nome || `Animal #${item.animal.id}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.animal.raca} - {item.animal.sexo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {item.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.margin.toFixed(1)}% margem
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Animais com Maior Custo
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.profitability.worstPerformers.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.animal.nome || `Animal #${item.animal.id}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.animal.raca} - {item.animal.sexo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      R$ {Math.abs(item.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      prejuízo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}