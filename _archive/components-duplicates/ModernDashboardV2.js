
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '../../contexts/ToastContext'
import AnalyticsDashboard from './AnalyticsDashboard'
import AdvancedMetrics from './AdvancedMetrics'
import RealTimeNotifications from '../notifications/RealTimeNotifications'
import AdvancedSearch from '../search/AdvancedSearch'
import DataExportImport from '../export/DataExportImport'
import StatsCards from './StatsCards'
import QuickActions from './QuickActions'
import useDashboardData from '../../hooks/useDashboardData'
import useDashboardTabs from '../../hooks/useDashboardTabs'

// Ícones temáticos
import {
  ChartBarIcon,
  PlusIcon,
  CogIcon,
  BellIcon,
  UserGroupIcon,
  CubeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TrendingUpIcon as ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '../ui/Icons'

import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import logger from '../../utils/logger'
import { cn } from '../../utils/cn'

export default function ModernDashboardV2() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentPeriod, setCurrentPeriod] = useState('30d')
  const [showQuickActions, setShowQuickActions] = useState(false)
  
  const { data, loading, error } = useDashboardData(currentPeriod)
  const { activeTab, setActiveTab, tabs } = useDashboardTabs()

  const periodDays = useMemo(() => {
    const periods = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    return periods[currentPeriod] || 30
  }, [currentPeriod])

  const handleQuickAction = useCallback((action) => {
    logger.info('Dashboard quick action:', action)
    
    const actions = {
      'novo-animal': () => router.push('/animals'),
      'estoque': () => router.push('/estoque-semen'),
      'relatorios': () => router.push('/reports'),
      'configuracoes': () => router.push('/settings')
    }
    
    const actionFn = actions[action]
    if (actionFn) {
      actionFn()
      toast.success(`Navegando para ${action.replace('-', ' ')}...`)
    }
  }, [router, toast])

  const handlePeriodChange = useCallback((period) => {
    setCurrentPeriod(period)
    logger.info('Dashboard period changed:', period)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="bordered" className="max-w-md">
          <CardBody className="text-center p-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600 mb-2">Erro ao carregar dashboard</CardTitle>
            <CardDescription className="mb-4">{error}</CardDescription>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visão geral do seu rebanho e operações
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                {[
                  { key: '7d', label: '7 dias' },
                  { key: '30d', label: '30 dias' },
                  { key: '90d', label: '90 dias' },
                  { key: '1y', label: '1 ano' }
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => handlePeriodChange(period.key)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                      currentPeriod === period.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Quick Actions Toggle */}
              <Button
                variant="primary"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Ações Rápidas
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <Card className="mb-8 animate-in slide-in-from-top-2 duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5 text-blue-600" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="ghost"
                  onClick={() => handleQuickAction('novo-animal')}
                  className="h-20 flex-col gap-2 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                >
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Novo Animal</span>
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleQuickAction('estoque')}
                  className="h-20 flex-col gap-2 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200"
                >
                  <CubeIcon className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Estoque</span>
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleQuickAction('relatorios')}
                  className="h-20 flex-col gap-2 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
                >
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">Relatórios</span>
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleQuickAction('configuracoes')}
                  className="h-20 flex-col gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <CogIcon className="h-6 w-6 text-gray-600" />
                  <span className="text-sm font-medium">Configurações</span>
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards data={data} period={currentPeriod} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analytics Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  Análise de Dados
                </CardTitle>
                <CardDescription>
                  Métricas e tendências do seu rebanho
                </CardDescription>
              </CardHeader>
              <CardBody>
                <AnalyticsDashboard 
                  data={data} 
                  period={currentPeriod}
                  onPeriodChange={handlePeriodChange}
                />
              </CardBody>
            </Card>

            {/* Advanced Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                  Métricas Avançadas
                </CardTitle>
                <CardDescription>
                  Indicadores de performance e produtividade
                </CardDescription>
              </CardHeader>
              <CardBody>
                <AdvancedMetrics 
                  data={data} 
                  period={periodDays}
                />
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Real-time Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-orange-600" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Alertas e atualizações em tempo real
                </CardDescription>
              </CardHeader>
              <CardBody>
                <RealTimeNotifications />
              </CardBody>
            </Card>

            {/* Advanced Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                  Busca Avançada
                </CardTitle>
                <CardDescription>
                  Encontre animais e registros rapidamente
                </CardDescription>
              </CardHeader>
              <CardBody>
                <AdvancedSearch />
              </CardBody>
            </Card>

            {/* Quick Actions Component */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-600" />
                  Ações Recentes
                </CardTitle>
                <CardDescription>
                  Últimas atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardBody>
                <QuickActions onAction={handleQuickAction} />
              </CardBody>
            </Card>

            {/* Data Export/Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-teal-600" />
                  Dados
                </CardTitle>
                <CardDescription>
                  Importar e exportar informações
                </CardDescription>
              </CardHeader>
              <CardBody>
                <DataExportImport />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              Sistema operacional
            </div>
            <div>
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}