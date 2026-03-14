import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrendingUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card.js'
import Button from '../ui/Button.js'
import Badge from '../ui/Badge.js'
import CoverageTypeCard from './CoverageTypeCard.js'

const QUICK_REPORTS = [
  {
    id: 'daily_summary',
    name: 'Resumo Diário',
    description: 'Atividades das últimas 24h',
    icon: ClockIcon,
    color: 'blue',
    period: 'today'
  },
  {
    id: 'weekly_performance',
    name: 'Performance Semanal',
    description: 'Métricas dos últimos 7 dias',
    icon: TrendingUpIcon,
    color: 'green',
    period: 'week'
  },
  {
    id: 'monthly_overview',
    name: 'Visão Mensal',
    description: 'Resumo completo do mês',
    icon: CalendarIcon,
    color: 'purple',
    period: 'month'
  },
  {
    id: 'alerts_report',
    name: 'Relatório de Alertas',
    description: 'Situações que requerem atenção',
    icon: ExclamationTriangleIcon,
    color: 'red',
    period: 'current'
  }
]

const RECENT_REPORTS = [
  {
    id: 1,
    name: 'Relatório de Localização - Outubro 2025',
    type: 'location_report',
    generatedAt: '2025-10-28T10:30:00Z',
    status: 'completed',
    format: 'pdf',
    size: '2.3 MB'
  },
  {
    id: 2,
    name: 'Análise Financeira - Q3 2025',
    type: 'financial_analysis',
    generatedAt: '2025-10-27T15:45:00Z',
    status: 'completed',
    format: 'xlsx',
    size: '1.8 MB'
  },
  {
    id: 3,
    name: 'Resumo de Nascimentos - Setembro 2025',
    type: 'births_analysis',
    generatedAt: '2025-10-26T09:15:00Z',
    status: 'completed',
    format: 'pdf',
    size: '1.2 MB'
  }
]

export default function ReportsDashboard({ onCreateReport, onViewReport }) {
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    avgGenerationTime: 0,
    mostUsedType: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Simular carregamento de estatísticas
      setTimeout(() => {
        setStats({
          totalReports: 47,
          reportsThisMonth: 12,
          avgGenerationTime: 3.2,
          mostUsedType: 'Relatório de Localização'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setLoading(false)
    }
  }

  const generateQuickReport = async (reportConfig) => {
    try {
      setLoading(true)
      
      // Definir período baseado na configuração
      const now = new Date()
      let startDate, endDate
      
      switch (reportConfig.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = now
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = now
      }

      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: [reportConfig.id],
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          format: 'pdf'
        })
      })

      if (!response.ok) throw new Error('Erro ao gerar relatório')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportConfig.name.replace(/\s+/g, '-')}-${startDate.toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('✅ Relatório gerado com sucesso!')
    } catch (error) {
      alert('❌ Erro ao gerar relatório rápido')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Concluído</Badge>
      case 'processing':
        return <Badge variant="warning" size="sm">Processando</Badge>
      case 'failed':
        return <Badge variant="danger" size="sm">Erro</Badge>
      default:
        return <Badge variant="neutral" size="sm">Desconhecido</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Dashboard de Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral e acesso rápido aos seus relatórios
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onCreateReport}
          leftIcon={<DocumentTextIcon className="h-4 w-4" />}
        >
          Criar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Relatórios
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalReports}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Este Mês
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reportsThisMonth}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tempo Médio
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgGenerationTime}s
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <TrendingUpIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mais Usado
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.mostUsedType}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Coverage Type Card */}
      <CoverageTypeCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🚀 Relatórios Rápidos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gere relatórios com um clique
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {QUICK_REPORTS.map((report) => {
                const Icon = report.icon
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${report.color}-100 dark:bg-${report.color}-900/20`}>
                        <Icon className={`h-4 w-4 text-${report.color}-600 dark:text-${report.color}-400`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {report.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => generateQuickReport(report)}
                      leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                    >
                      Gerar
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              📋 Relatórios Recentes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seus últimos relatórios gerados
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {RECENT_REPORTS.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {report.name}
                      </h4>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>{formatDate(report.generatedAt)}</span>
                      <span>{report.format.toUpperCase()}</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReport && onViewReport(report)}
                      title="Visualizar"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Baixar novamente"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {/* Implementar histórico completo */}}
              >
                Ver Todos os Relatórios
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📈 Insights de Performance
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Eficiência Melhorada
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tempo de geração 23% mais rápido este mês
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Alta Confiabilidade
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                99.2% de taxa de sucesso na geração
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Uso Crescente
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                +34% de relatórios gerados vs. mês anterior
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}