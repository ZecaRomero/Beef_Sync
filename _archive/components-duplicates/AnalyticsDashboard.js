
import React, { useEffect, useState } from 'react'

import { 
  ChartBarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon
} from '../ui/Icons'

// Ícones adicionais que não estão no arquivo Icons.js
const ArrowUpIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
)

const ArrowDownIcon = ({ className = "h-6 w-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
)

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    animais: { total: 0, ativos: 0, vendidos: 0, mortos: 0 },
    financeiro: { receita: 0, custos: 0, lucro: 0, roi: 0 },
    reprodutivo: { gestacoes: 0, nascimentos: 0, taxa_concepcao: 0 },
    estoque: { semen_total: 0, semen_usado: 0, semen_disponivel: 0 },
    tendencias: { crescimento_rebanho: 0, eficiencia_reprodutiva: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30dias')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Carregar dados reais do sistema
      const animais = JSON.parse(localStorage.getItem('animals') || '[]')
      const nascimentos = JSON.parse(localStorage.getItem('birthData') || '[]')
      const custos = JSON.parse(localStorage.getItem('custos') || '[]')
      const semen = JSON.parse(localStorage.getItem('estoqueSemen') || '[]')
      const notasFiscais = JSON.parse(localStorage.getItem('notasFiscais') || '[]')

      // Calcular métricas de animais
      const totalAnimais = (animais || []).length
      const animaisAtivos = (animais || []).filter(a => a.situacao === 'Ativo').length
      const animaisVendidos = (animais || []).filter(a => a.situacao === 'Vendido').length
      const animaisMortos = (animais || []).filter(a => a.situacao === 'Morto').length

      // Calcular métricas financeiras
      const receitaTotal = (animais || []).reduce((sum, animal) => sum + (parseFloat(animal.valorVenda) || 0), 0)
      const custosTotal = (custos || []).reduce((sum, custo) => sum + (parseFloat(custo.valor) || 0), 0)
      const lucro = receitaTotal - custosTotal
      const roi = custosTotal > 0 ? ((lucro / custosTotal) * 100) : 0

      // Calcular métricas reprodutivas
      const gestacoesAtivas = (nascimentos || []).filter(n => n.status === 'gestacao').length
      const nascimentosConfirmados = (nascimentos || []).filter(n => n.status === 'nascido').length
      const taxaConcepcao = gestacoesAtivas > 0 ? (nascimentosConfirmados / gestacoesAtivas) * 100 : 0

      // Calcular métricas de estoque
      const semenTotal = (semen || []).reduce((sum, s) => sum + (parseInt(s.quantidadeDoses) || 0), 0)
      const semenUsado = (semen || []).reduce((sum, s) => sum + (parseInt(s.dosesUsadas) || 0), 0)
      const semenDisponivel = semenTotal - semenUsado

      // Calcular tendências
      const crescimentoRebanho = calcularCrescimentoRebanho(animais, timeRange)
      const eficienciaReprodutiva = calcularEficienciaReprodutiva(nascimentos, timeRange)

      setAnalytics({
        animais: { total: totalAnimais, ativos: animaisAtivos, vendidos: animaisVendidos, mortos: animaisMortos },
        financeiro: { receita: receitaTotal, custos: custosTotal, lucro: lucro, roi: roi },
        reprodutivo: { gestacoes: gestacoesAtivas, nascimentos: nascimentosConfirmados, taxa_concepcao: taxaConcepcao },
        estoque: { semen_total: semenTotal, semen_usado: semenUsado, semen_disponivel: semenDisponivel },
        tendencias: { crescimento_rebanho: crescimentoRebanho, eficiencia_reprodutiva: eficienciaReprodutiva }
      })

    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularCrescimentoRebanho = (animais, periodo) => {
    // Calcular crescimento baseado em nascimentos vs vendas no período
    const agora = new Date()
    const inicioPeriodo = new Date()
    
    switch (periodo) {
      case '7dias':
        inicioPeriodo.setDate(agora.getDate() - 7)
        break
      case '30dias':
        inicioPeriodo.setDate(agora.getDate() - 30)
        break
      case '90dias':
        inicioPeriodo.setDate(agora.getDate() - 90)
        break
      default:
        inicioPeriodo.setDate(agora.getDate() - 30)
    }

    const animaisRecentes = Array.isArray(animais) ? animais.filter(a => {
      const dataEntrada = new Date(a.dataEntrada || a.created_at)
      return dataEntrada >= inicioPeriodo
    }) : []

    return animaisRecentes.length
  }

  const calcularEficienciaReprodutiva = (nascimentos, periodo) => {
    const agora = new Date()
    const inicioPeriodo = new Date()
    
    switch (periodo) {
      case '7dias':
        inicioPeriodo.setDate(agora.getDate() - 7)
        break
      case '30dias':
        inicioPeriodo.setDate(agora.getDate() - 30)
        break
      case '90dias':
        inicioPeriodo.setDate(agora.getDate() - 90)
        break
      default:
        inicioPeriodo.setDate(agora.getDate() - 30)
    }

    const nascimentosPeriodo = Array.isArray(nascimentos) ? nascimentos.filter(n => {
      const dataNascimento = new Date(n.data || n.created_at)
      return dataNascimento >= inicioPeriodo && n.status === 'nascido'
    }) : []

    return nascimentosPeriodo.length
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Analytics Avançados
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise detalhada baseada nos seus dados reais
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
            <option value="ano">Último ano</option>
          </select>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Animais */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Animais</p>
              <p className="text-3xl font-bold">{analytics.animais.total}</p>
              <p className="text-blue-100 text-xs mt-1">
                {analytics.animais.ativos} ativos
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-200 opacity-80" />
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Receita Total</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.financeiro.receita)}</p>
              <p className="text-green-100 text-xs mt-1">
                ROI: {formatPercentage(analytics.financeiro.roi)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-green-200 opacity-80" />
          </div>
        </div>

        {/* Lucro */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Lucro Líquido</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.financeiro.lucro)}</p>
              <p className="text-purple-100 text-xs mt-1">
                Custos: {formatCurrency(analytics.financeiro.custos)}
              </p>
            </div>
            <TrendingUpIcon className="h-12 w-12 text-purple-200 opacity-80" />
          </div>
        </div>

        {/* Taxa de Concepção */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Taxa de Concepção</p>
              <p className="text-3xl font-bold">{formatPercentage(analytics.reprodutivo.taxa_concepcao)}</p>
              <p className="text-orange-100 text-xs mt-1">
                {analytics.reprodutivo.nascimentos} nascimentos
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Animais */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Status do Rebanho
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ativos</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(analytics.animais.ativos / analytics.animais.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.animais.ativos}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Vendidos</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(analytics.animais.vendidos / analytics.animais.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.animais.vendidos}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Mortos</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(analytics.animais.mortos / analytics.animais.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.animais.mortos}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estoque de Sêmen */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🧬 Estoque de Sêmen
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total de Doses</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.estoque.semen_total}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Disponíveis</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {analytics.estoque.semen_disponivel}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usadas</span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {analytics.estoque.semen_usado}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full" 
                  style={{ 
                    width: `${analytics.estoque.semen_total > 0 ? (analytics.estoque.semen_disponivel / analytics.estoque.semen_total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {analytics.estoque.semen_total > 0 ? 
                  `${((analytics.estoque.semen_disponivel / analytics.estoque.semen_total) * 100).toFixed(1)}% disponível` : 
                  'Nenhum estoque cadastrado'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tendências */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 Tendências do Período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Crescimento do Rebanho</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{analytics.tendencias.crescimento_rebanho}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Novos animais no período
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Eficiência Reprodutiva</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.tendencias.eficiencia_reprodutiva}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nascimentos confirmados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
