import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/router'
import {
  CurrencyDollarIcon,
  PlusIcon,
  UserGroupIcon,
  CalculatorIcon,
  ArrowPathIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

// Hooks
import useSmartNotifications from '../../hooks/useSmartNotifications'
import useToast from '../../hooks/useToast'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'

// Components
import AnalyticsDashboard from './AnalyticsDashboard'
import RealTimeNotifications from '../notifications/RealTimeNotifications'
import AdvancedSearch from '../search/AdvancedSearch'
import DataExportImport from '../export/DataExportImport'
import { StatsGrid } from '../common/StatsWidget'
import LoadingScreen from '../common/LoadingScreen'
import { ToastContainer } from '../common/Toast'
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal'
import { Card, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'



// Utils
import animalDataManager from '../../services/animalDataManager'
import { isClient } from '../../utils/ssrSafeStorage'
import logger from '../../utils/logger'

// Types
interface DashboardStats {
  totalAnimals: number
  activeAnimals: number
  totalCosts: number
  avgCostPerAnimal: number
  recentBirths: number
  pendingTasks: number
  animaisVendidos?: number
  receitaTotal?: number
  lucroTotal?: number
  nascimentosUltimos7Dias?: number
  tarefasPendentes?: number
}

interface MarketData {
  boiGordo: { price: number; change: number; trend: string; name?: string }
  vacaGorda: { price: number; change: number; trend: string; name?: string }
  novilha: { price: number; change: number; trend: string; name?: string }
  garrote: { price: number; change: number; trend: string; name?: string }
  dolar?: { preco: number; variacao: number }
  boiFuturo?: { preco: number; variacao: number }
}

interface DashboardProps {
  variant?: 'simple' | 'modern' | 'premium' | 'v2' | 'v3'
  showAnalytics?: boolean
  showNotifications?: boolean
  showSearch?: boolean
  showExportImport?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

// Memoized Icons
const CattleIcon = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21c0-1.66 1.34-3 3-3s3 1.34 3 3" />
  </svg>
))

const StarIcon = memo(({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
))

// Memoized StatCard Component
const StatCard = memo(({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'blue', 
  gradient = false 
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  color?: string
  gradient?: boolean
}) => {
  const cardClasses = useMemo(() => {
    const baseClasses = "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    return gradient ? `${baseClasses} bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900 dark:to-${color}-800` : baseClasses
  }, [color, gradient])

  const changeColor = useMemo(() => {
    if (!change) return ''
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600'
  }, [change, changeType])

  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-sm ${changeColor}`}>
              {changeType === 'increase' ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  )
})

export default function ConsolidatedDashboard({
  variant = 'modern',
  showAnalytics = true,
  showNotifications = true,
  showSearch = true,
  showExportImport = true,
  autoRefresh = true,
  refreshInterval = 30000
}: DashboardProps) {
  const router = useRouter()
  const toastHook = useToast() as any
  const { toasts, success, removeToast } = toastHook
  const notifications = useSmartNotifications()

  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalAnimals: 0,
    activeAnimals: 0,
    totalCosts: 0,
    avgCostPerAnimal: 0,
    recentBirths: 0,
    pendingTasks: 0
  })

  const [marketData, setMarketData] = useState<MarketData>({
    boiGordo: { price: 270, change: 2.1, trend: 'up', name: 'Boi Gordo' },
    vacaGorda: { price: 250, change: -1.5, trend: 'down', name: 'Vaca Gorda' },
    novilha: { price: 258, change: 0.8, trend: 'up', name: 'Novilha' },
    garrote: { price: 277, change: 1.2, trend: 'up', name: 'Garrote' }
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [showExportImportModal, setShowExportImportModal] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+h': () => router.push('/'),
    'ctrl+d': () => router.push('/dashboard'),
    'ctrl+a': () => router.push('/animals'),
    'ctrl+s': () => router.push('/semen'),
    'ctrl+n': () => router.push('/nascimentos'),
    'ctrl+r': () => router.push('/reports'),
    'ctrl+p': () => handleQuickAction('novo-animal'),
    'ctrl+k': () => handleQuickAction('buscar'),
    'ctrl+b': () => handleBackup(),
    'ctrl+/': () => setShowShortcuts(true),
  })

  // Memoized calculations
  const processedStats = useMemo(() => {
    return {
      ...stats,
      growthRate: stats.totalAnimals > 0 ? ((stats.recentBirths / stats.totalAnimals) * 100).toFixed(1) : '0',
      activePercentage: stats.totalAnimals > 0 ? ((stats.activeAnimals / stats.totalAnimals) * 100).toFixed(1) : '0'
    }
  }, [stats])



  // Callbacks
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'novo-animal':
        router.push('/animals')
        break
      case 'estoque':
        router.push('/estoque-semen')
        break
      case 'notas-fiscais':
        router.push('/notas-fiscais')
        break
      case 'relatorio':
        router.push('/reports')
        break
      case 'exportar':
        setShowExportImportModal(true)
        break
      case 'buscar':
        // Implement search functionality
        break
      default:
        console.log('Ação rápida não implementada', { action })
    }
  }, [router])

  const handleSearch = useCallback((results: any, term: string, filters: any) => {
    setSearchResults({ results, term, filters })
  }, [])

  const handleBackup = useCallback(() => {
    // Implement backup functionality
    success('Backup iniciado com sucesso!')
  }, [success])

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)

      if (!isClient()) return

      // Load animals data
      const currentAnimals = await animalDataManager.getAllAnimals()

      // Calculate statistics
      const totalCosts = calculateTotalCosts(currentAnimals)
      
      const newStats = {
        totalAnimals: currentAnimals.length,
        activeAnimals: currentAnimals.filter((a: any) => a.situacao === 'Ativo').length,
        totalCosts,
        avgCostPerAnimal: currentAnimals.length > 0 ? totalCosts / currentAnimals.length : 0,
        recentBirths: currentAnimals.filter((a: any) => {
          if (!a.dataNascimento) return false
          const birthDate = new Date(a.dataNascimento)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return birthDate >= weekAgo
        }).length,
        pendingTasks: 0 // This would come from a tasks system
      }

      setStats(newStats)

      // Load market data (this would typically come from an API)
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.marketData) {
            setMarketData(data.marketData)
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados de mercado:', err)
      }

      logger.info('Dashboard carregado com sucesso', { totalAnimals: newStats.totalAnimals })
      
      if (!silent) {
        notifications.notifySystem('Dashboard carregado com sucesso', { type: 'success' })
      }

    } catch (error) {
      logger.error('Erro ao carregar dados do dashboard:', error)
      if (!silent) {
        notifications.notifySystem('Erro ao carregar dados do dashboard', { type: 'error' })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [notifications])

  const calculateTotalCosts = useCallback((animals: any[]) => {
    // This would calculate total costs from various sources
    return animals.reduce((total, animal) => {
      return total + (animal.custoTotal || 0)
    }, 0)
  }, [])

  // Effects
  useEffect(() => {
    loadDashboardData()
    
    // Set current time (client-side only)
    setCurrentTime(new Date().toLocaleTimeString())
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString())
        loadDashboardData(true)
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
    
    // Return undefined explicitly for the else case
    return undefined
  }, [loadDashboardData, autoRefresh, refreshInterval])

  // Render loading state
  if (loading) {
    return variant === 'premium' ? 
      <LoadingScreen message="Carregando Dashboard Premium" /> :
      <LoadingSpinner size="lg" text="Carregando dashboard..." />
  }

  // Render dashboard based on variant
  const renderDashboardContent = () => {
    switch (variant) {
      case 'simple':
        return renderSimpleDashboard()
      case 'premium':
        return renderPremiumDashboard()
      case 'v2':
        return renderV2Dashboard()
      case 'v3':
        return renderV3Dashboard()
      default:
        return renderModernDashboard()
    }
  }

  const renderSimpleDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🚀 Dashboard Beef Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do seu rebanho • {currentTime}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Animais"
          value={processedStats.totalAnimals}
          icon={CattleIcon}
          color="blue"
        />
        <StatCard
          title="Animais Ativos"
          value={processedStats.activeAnimals}
          change={parseFloat(processedStats.activePercentage)}
          changeType="increase"
          icon={UserGroupIcon}
          color="green"
        />
        <StatCard
          title="Custo Total"
          value={`R$ ${processedStats.totalCosts.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="yellow"
        />
        <StatCard
          title="Nascimentos (7d)"
          value={processedStats.recentBirths}
          change={parseFloat(processedStats.growthRate)}
          changeType="increase"
          icon={StarIcon}
          color="purple"
        />
      </div>

      {showAnalytics && <AnalyticsDashboard />}
    </div>
  )

  const renderModernDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Beef Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestão inteligente do seu rebanho
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => handleQuickAction('novo-animal')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Animal
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Animais"
          value={processedStats.totalAnimals}
          icon={CattleIcon}
          color="blue"
          gradient
        />
        <StatCard
          title="Animais Ativos"
          value={processedStats.activeAnimals}
          change={parseFloat(processedStats.activePercentage)}
          changeType="increase"
          icon={UserGroupIcon}
          color="green"
          gradient
        />
        <StatCard
          title="Custo Médio"
          value={`R$ ${processedStats.avgCostPerAnimal.toLocaleString()}`}
          icon={CalculatorIcon}
          color="yellow"
          gradient
        />
        <StatCard
          title="Nascimentos Recentes"
          value={processedStats.recentBirths}
          change={parseFloat(processedStats.growthRate)}
          changeType="increase"
          icon={StarIcon}
          color="purple"
          gradient
        />
      </div>

      {/* Market Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(marketData).map(([key, data]) => (
          <Card key={key}>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.name || key}
                  </p>
                  <p className="text-lg font-semibold">R$ {data.price}</p>
                </div>
                <Badge
                  variant={data.trend === 'up' ? 'success' : 'danger'}
                  size="sm"
                >
                  {data.change > 0 ? '+' : ''}{data.change}%
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {showAnalytics && <AnalyticsDashboard />}
    </div>
  )

  const renderPremiumDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Premium
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise avançada e insights inteligentes
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowShortcuts(true)}
          >
            <CommandLineIcon className="h-4 w-4 mr-2" />
            Atalhos
          </Button>
          <Button onClick={() => handleQuickAction('novo-animal')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Animal
          </Button>
        </div>
      </div>

      <StatsGrid columns={4}>
        <StatCard
          title="Total de Animais"
          value={processedStats.totalAnimals}
          change={processedStats.growthRate ? parseFloat(processedStats.growthRate) : undefined}
          changeType="increase"
          icon={CattleIcon}
          color="blue"
          gradient={true}
        />
        <StatCard
          title="Animais Ativos"
          value={processedStats.activeAnimals}
          change={processedStats.activePercentage ? parseFloat(processedStats.activePercentage) : undefined}
          changeType="increase"
          icon={UserGroupIcon}
          color="green"
          gradient={true}
        />
        <StatCard
          title="Custos Totais"
          value={`R$ ${processedStats.totalCosts.toLocaleString('pt-BR')}`}
          icon={CurrencyDollarIcon}
          color="red"
          gradient={true}
        />
        <StatCard
          title="Nascimentos Recentes"
          value={processedStats.recentBirths}
          icon={PlusIcon}
          color="purple"
          gradient={true}
        />
      </StatsGrid>
      
      {showAnalytics && <AnalyticsDashboard />}
      
      {showShortcuts && (
        <KeyboardShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  )

  const renderV2Dashboard = () => renderModernDashboard()
  const renderV3Dashboard = () => renderModernDashboard()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboardContent()}
        
        {/* Notifications */}
        {showNotifications && <RealTimeNotifications />}
        
        {/* Search Results */}
        {searchResults && showSearch && (
          <div className="mt-6">
            <AdvancedSearch
              onSearch={handleSearch}
            />
          </div>
        )}
        
        {/* Export/Import Modal */}
        {showExportImport && showExportImportModal && (
          <DataExportImport
            isOpen={showExportImportModal}
            onClose={() => setShowExportImportModal(false)}
          />
        )}
        
        {/* Toast Container */}
        <ToastContainer
          toasts={toasts}
          onClose={removeToast}
        />
      </div>
    </div>
  )
}