import React, { useEffect, useState } from 'react'
import { 
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { TrendingUpIcon } from '../ui/Icons'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

export default function ProductivityReport() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30') // dias
  const [error, setError] = useState(null)

  // Carregar dados de produtividade
  const loadProductivityData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados de diferentes endpoints
      const [animalsRes, birthsRes, costsRes, salesRes] = await Promise.all([
        fetch('/api/animals'),
        fetch('/api/births'),
        fetch('/api/custos'),
        fetch('/api/animals?filter=vendidos')
      ])

      if (!animalsRes.ok || !birthsRes.ok || !costsRes.ok || !salesRes.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const [animals, births, costs, sales] = await Promise.all([
        animalsRes.json(),
        birthsRes.json(),
        costsRes.json(),
        salesRes.json()
      ])

      // Calcular métricas de produtividade
      const productivity = calculateProductivityMetrics(animals, births, costs, sales, period)
      setData(productivity)

    } catch (err) {
      console.error('Erro ao carregar dados de produtividade:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular métricas de produtividade
  const calculateProductivityMetrics = (animals, births, costs, sales, periodDays) => {
    const now = new Date()
    const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    // Filtrar dados por período
    const periodBirths = births.filter(birth => 
      new Date(birth.data_nascimento) >= periodStart
    )
    
    const periodCosts = costs.filter(cost => 
      new Date(cost.data) >= periodStart
    )
    
    const periodSales = sales.filter(sale => 
      new Date(sale.data_venda) >= periodStart
    )

    // Calcular métricas
    const totalAnimals = animals.length
    const activeAnimals = animals.filter(a => a.status === 'ativo').length
    const birthRate = periodBirths.length
    const mortalityRate = animals.filter(a => a.status === 'morto').length
    
    const totalCosts = periodCosts.reduce((sum, cost) => sum + (cost.valor || 0), 0)
    const totalRevenue = periodSales.reduce((sum, sale) => sum + (sale.valor_venda || 0), 0)
    const netProfit = totalRevenue - totalCosts
    
    const avgCostPerAnimal = totalAnimals > 0 ? totalCosts / totalAnimals : 0
    const avgRevenuePerAnimal = totalAnimals > 0 ? totalRevenue / totalAnimals : 0
    const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0

    // Produtividade por categoria
    const breedProductivity = calculateBreedProductivity(animals, births, costs, sales)
    const ageGroupProductivity = calculateAgeGroupProductivity(animals, births, costs)
    const locationProductivity = calculateLocationProductivity(animals, births, costs)

    return {
      period: periodDays,
      summary: {
        totalAnimals,
        activeAnimals,
        birthRate,
        mortalityRate,
        totalCosts,
        totalRevenue,
        netProfit,
        avgCostPerAnimal,
        avgRevenuePerAnimal,
        roi
      },
      productivity: {
        birthsPerMonth: (birthRate / periodDays) * 30,
        costEfficiency: avgCostPerAnimal > 0 ? avgRevenuePerAnimal / avgCostPerAnimal : 0,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        animalTurnover: periodSales.length
      },
      breakdown: {
        byBreed: breedProductivity,
        byAgeGroup: ageGroupProductivity,
        byLocation: locationProductivity
      },
      trends: calculateTrends(births, costs, sales, periodDays)
    }
  }

  // Calcular produtividade por raça
  const calculateBreedProductivity = (animals, births, costs, sales) => {
    const breeds = [...new Set(animals.map(a => a.raca).filter(Boolean))]
    
    return breeds.map(breed => {
      const breedAnimals = animals.filter(a => a.raca === breed)
      const breedBirths = births.filter(b => 
        breedAnimals.some(a => a.id === b.animal_id)
      )
      const breedCosts = costs.filter(c => 
        breedAnimals.some(a => a.id === c.animal_id)
      )
      const breedSales = sales.filter(s => 
        breedAnimals.some(a => a.id === s.id)
      )

      const totalCost = breedCosts.reduce((sum, c) => sum + (c.valor || 0), 0)
      const totalRevenue = breedSales.reduce((sum, s) => sum + (s.valor_venda || 0), 0)

      return {
        breed,
        count: breedAnimals.length,
        births: breedBirths.length,
        costs: totalCost,
        revenue: totalRevenue,
        profit: totalRevenue - totalCost,
        roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0
      }
    })
  }

  // Calcular produtividade por faixa etária
  const calculateAgeGroupProductivity = (animals, births, costs) => {
    const ageGroups = {
      'Bezerros (0-12m)': [],
      'Novilhos (1-2a)': [],
      'Adultos (2-5a)': [],
      'Maduros (5a+)': []
    }

    animals.forEach(animal => {
      if (!animal.data_nascimento) return
      
      const age = calculateAge(animal.data_nascimento)
      if (age <= 12) ageGroups['Bezerros (0-12m)'].push(animal)
      else if (age <= 24) ageGroups['Novilhos (1-2a)'].push(animal)
      else if (age <= 60) ageGroups['Adultos (2-5a)'].push(animal)
      else ageGroups['Maduros (5a+)'].push(animal)
    })

    return Object.entries(ageGroups).map(([group, groupAnimals]) => {
      const groupCosts = costs.filter(c => 
        groupAnimals.some(a => a.id === c.animal_id)
      )
      const totalCost = groupCosts.reduce((sum, c) => sum + (c.valor || 0), 0)
      const avgCostPerAnimal = groupAnimals.length > 0 ? totalCost / groupAnimals.length : 0

      return {
        group,
        count: groupAnimals.length,
        totalCost,
        avgCostPerAnimal,
        percentage: animals.length > 0 ? (groupAnimals.length / animals.length) * 100 : 0
      }
    })
  }

  // Calcular produtividade por localização
  const calculateLocationProductivity = (animals, births, costs) => {
    const locations = [...new Set(animals.map(a => a.localizacao).filter(Boolean))]
    
    return locations.map(location => {
      const locationAnimals = animals.filter(a => a.localizacao === location)
      const locationBirths = births.filter(b => 
        locationAnimals.some(a => a.id === b.animal_id)
      )
      const locationCosts = costs.filter(c => 
        locationAnimals.some(a => a.id === c.animal_id)
      )

      const totalCost = locationCosts.reduce((sum, c) => sum + (c.valor || 0), 0)
      const avgCostPerAnimal = locationAnimals.length > 0 ? totalCost / locationAnimals.length : 0

      return {
        location,
        count: locationAnimals.length,
        births: locationBirths.length,
        totalCost,
        avgCostPerAnimal,
        birthRate: locationAnimals.length > 0 ? (locationBirths.length / locationAnimals.length) * 100 : 0
      }
    })
  }

  // Calcular tendências
  const calculateTrends = (births, costs, sales, periodDays) => {
    const intervals = Math.min(periodDays / 7, 12) // Máximo 12 intervalos
    const intervalDays = periodDays / intervals
    const now = new Date()

    const trends = []
    for (let i = 0; i < intervals; i++) {
      const intervalEnd = new Date(now.getTime() - (i * intervalDays * 24 * 60 * 60 * 1000))
      const intervalStart = new Date(intervalEnd.getTime() - (intervalDays * 24 * 60 * 60 * 1000))

      const intervalBirths = births.filter(b => {
        const date = new Date(b.data_nascimento)
        return date >= intervalStart && date < intervalEnd
      })

      const intervalCosts = costs.filter(c => {
        const date = new Date(c.data)
        return date >= intervalStart && date < intervalEnd
      })

      const intervalSales = sales.filter(s => {
        const date = new Date(s.data_venda)
        return date >= intervalStart && date < intervalEnd
      })

      trends.unshift({
        period: `${intervalStart.toLocaleDateString()} - ${intervalEnd.toLocaleDateString()}`,
        births: intervalBirths.length,
        costs: intervalCosts.reduce((sum, c) => sum + (c.valor || 0), 0),
        sales: intervalSales.reduce((sum, s) => sum + (s.valor_venda || 0), 0)
      })
    }

    return trends
  }

  // Calcular idade em meses
  const calculateAge = (birthDate) => {
    const now = new Date()
    const birth = new Date(birthDate)
    const diffTime = Math.abs(now - birth)
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // meses aproximados
  }

  // Exportar relatório
  const exportReport = () => {
    if (!data) return

    const reportData = {
      titulo: 'Relatório de Produtividade',
      periodo: `${data.period} dias`,
      gerado_em: new Date().toLocaleString(),
      resumo: data.summary,
      produtividade: data.productivity,
      detalhamento: data.breakdown,
      tendencias: data.trends
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-produtividade-${new Date().toISOString().split('T')[0]}.json`
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
    loadProductivityData()
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
        title="Erro ao carregar relatório"
        description={error}
        action={
          <Button onClick={loadProductivityData}>
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
        description="Não há dados suficientes para gerar o relatório de produtividade"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatório de Produtividade
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Análise detalhada da produtividade do rebanho
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Animais</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.summary.totalAnimals}
                </p>
                <p className="text-xs text-green-600">
                  {data.summary.activeAnimals} ativos
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.summary.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  Retorno sobre investimento
                </p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nascimentos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.summary.birthRate}
                </p>
                <p className="text-xs text-blue-600">
                  {data.productivity.birthsPerMonth.toFixed(1)}/mês
                </p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Líquido</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {data.summary.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600">
                  {data.productivity.profitMargin.toFixed(1)}% margem
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Produtividade por Raça */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Produtividade por Raça
          </h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Raça</th>
                  <th className="text-right py-2">Animais</th>
                  <th className="text-right py-2">Nascimentos</th>
                  <th className="text-right py-2">Custos</th>
                  <th className="text-right py-2">Receita</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.byBreed.map((breed, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-medium">{breed.breed}</td>
                    <td className="text-right py-2">{breed.count}</td>
                    <td className="text-right py-2">{breed.births}</td>
                    <td className="text-right py-2">
                      R$ {breed.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-2">
                      R$ {breed.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right py-2">
                      <Badge variant={breed.roi > 0 ? 'success' : 'danger'}>
                        {breed.roi.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Produtividade por Faixa Etária */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Distribuição por Faixa Etária
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {data.breakdown.byAgeGroup.map((group, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{group.group}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.count} animais ({group.percentage.toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    R$ {group.avgCostPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">custo médio/animal</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Produtividade por Localização */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Produtividade por Localização
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.breakdown.byLocation.map((location, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {location.location}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Animais:</span>
                    <span className="font-medium">{location.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nascimentos:</span>
                    <span className="font-medium">{location.births}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Taxa de Nascimento:</span>
                    <span className="font-medium">{location.birthRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Custo Médio:</span>
                    <span className="font-medium">
                      R$ {location.avgCostPerAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}