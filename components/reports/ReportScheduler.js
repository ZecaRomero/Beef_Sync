import React, { useState } from 'react'
import { 
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário', description: 'Todo dia às 08:00' },
  { value: 'weekly', label: 'Semanal', description: 'Toda segunda-feira às 08:00' },
  { value: 'biweekly', label: 'Quinzenal', description: 'A cada 15 dias' },
  { value: 'monthly', label: 'Mensal', description: 'Todo dia 1º do mês' },
  { value: 'quarterly', label: 'Trimestral', description: 'A cada 3 meses' },
  { value: 'custom', label: 'Personalizado', description: 'Definir cronograma específico' }
]

const SCHEDULED_REPORTS = [
  {
    id: 1,
    name: 'Relatório Mensal de Performance',
    reportType: 'monthly_summary',
    frequency: 'monthly',
    nextRun: '2025-11-01T08:00:00Z',
    lastRun: '2025-10-01T08:00:00Z',
    status: 'active',
    recipients: ['João Silva', 'Maria Santos'],
    format: 'pdf',
    createdAt: '2025-09-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Análise Semanal de Localização',
    reportType: 'location_report',
    frequency: 'weekly',
    nextRun: '2025-11-04T08:00:00Z',
    lastRun: '2025-10-28T08:00:00Z',
    status: 'active',
    recipients: ['Carlos Oliveira'],
    format: 'xlsx',
    createdAt: '2025-10-01T14:30:00Z'
  },
  {
    id: 3,
    name: 'Resumo Financeiro Trimestral',
    reportType: 'financial_summary',
    frequency: 'quarterly',
    nextRun: '2026-01-01T08:00:00Z',
    lastRun: '2025-10-01T08:00:00Z',
    status: 'paused',
    recipients: ['Ana Costa', 'Roberto Lima'],
    format: 'pdf',
    createdAt: '2025-07-01T09:15:00Z'
  }
]

export default function ReportScheduler() {
  const [scheduledReports, setScheduledReports] = useState(SCHEDULED_REPORTS)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentReport, setCurrentReport] = useState(null)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    reportType: '',
    frequency: 'monthly',
    time: '08:00',
    recipients: [],
    format: 'pdf',
    enabled: true
  })

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
      case 'active':
        return <Badge variant="success" size="sm">Ativo</Badge>
      case 'paused':
        return <Badge variant="warning" size="sm">Pausado</Badge>
      case 'error':
        return <Badge variant="danger" size="sm">Erro</Badge>
      default:
        return <Badge variant="neutral" size="sm">Desconhecido</Badge>
    }
  }

  const getFrequencyLabel = (frequency) => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency)
    return option ? option.label : frequency
  }

  const toggleReportStatus = (reportId) => {
    setScheduledReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
        : report
    ))
  }

  const deleteScheduledReport = (reportId) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      setScheduledReports(prev => prev.filter(report => report.id !== reportId))
    }
  }

  const editScheduledReport = (report) => {
    setCurrentReport(report)
    setNewSchedule({
      name: report.name,
      reportType: report.reportType,
      frequency: report.frequency,
      time: '08:00',
      recipients: report.recipients,
      format: report.format,
      enabled: report.status === 'active'
    })
    setShowEditModal(true)
  }

  const createScheduledReport = () => {
    if (!newSchedule.name || !newSchedule.reportType) {
      alert('⚠️ Nome e tipo de relatório são obrigatórios')
      return
    }

    const newReport = {
      id: Date.now(),
      name: newSchedule.name,
      reportType: newSchedule.reportType,
      frequency: newSchedule.frequency,
      nextRun: calculateNextRun(newSchedule.frequency),
      lastRun: null,
      status: newSchedule.enabled ? 'active' : 'paused',
      recipients: newSchedule.recipients,
      format: newSchedule.format,
      createdAt: new Date().toISOString()
    }

    setScheduledReports(prev => [...prev, newReport])
    setShowCreateModal(false)
    setNewSchedule({
      name: '',
      reportType: '',
      frequency: 'monthly',
      time: '08:00',
      recipients: [],
      format: 'pdf',
      enabled: true
    })
    alert('✅ Agendamento criado com sucesso!')
  }

  const updateScheduledReport = () => {
    if (!newSchedule.name || !newSchedule.reportType) {
      alert('⚠️ Nome e tipo de relatório são obrigatórios')
      return
    }

    setScheduledReports(prev => prev.map(report => 
      report.id === currentReport.id 
        ? {
            ...report,
            name: newSchedule.name,
            reportType: newSchedule.reportType,
            frequency: newSchedule.frequency,
            recipients: newSchedule.recipients,
            format: newSchedule.format,
            status: newSchedule.enabled ? 'active' : 'paused',
            nextRun: calculateNextRun(newSchedule.frequency)
          }
        : report
    ))

    setShowEditModal(false)
    setCurrentReport(null)
    alert('✅ Agendamento atualizado com sucesso!')
  }

  const calculateNextRun = (frequency) => {
    const now = new Date()
    const nextRun = new Date(now)

    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(now.getDate() + 7)
        break
      case 'biweekly':
        nextRun.setDate(now.getDate() + 14)
        break
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1, 1)
        break
      case 'quarterly':
        nextRun.setMonth(now.getMonth() + 3, 1)
        break
      default:
        nextRun.setDate(now.getDate() + 1)
    }

    nextRun.setHours(8, 0, 0, 0)
    return nextRun.toISOString()
  }

  const getNextRunStatus = (nextRun) => {
    const now = new Date()
    const runDate = new Date(nextRun)
    const diffHours = (runDate - now) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return { color: 'red', text: 'Próximo' }
    } else if (diffHours < 72) {
      return { color: 'yellow', text: 'Em breve' }
    } else {
      return { color: 'green', text: 'Agendado' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ⏰ Agendamento de Relatórios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure relatórios automáticos para sua equipe
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Novo Agendamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Agendados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledReports.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledReports.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <PauseIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pausados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledReports.filter(r => r.status === 'paused').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Próximas 24h
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledReports.filter(r => {
                    const nextRun = new Date(r.nextRun)
                    const now = new Date()
                    return (nextRun - now) < 24 * 60 * 60 * 1000
                  }).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Scheduled Reports List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📋 Relatórios Agendados
          </h3>
        </CardHeader>
        <CardBody>
          {scheduledReports.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum relatório agendado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure seu primeiro agendamento automático
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                Criar Primeiro Agendamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map((report) => {
                const nextRunStatus = getNextRunStatus(report.nextRun)
                return (
                  <div
                    key={report.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {report.name}
                          </h4>
                          {getStatusBadge(report.status)}
                          <Badge variant={nextRunStatus.color} size="sm">
                            {nextRunStatus.text}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Frequência:</span>
                            <div>{getFrequencyLabel(report.frequency)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Próxima execução:</span>
                            <div>{formatDate(report.nextRun)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Destinatários:</span>
                            <div>{report.recipients.length} pessoa(s)</div>
                          </div>
                          <div>
                            <span className="font-medium">Formato:</span>
                            <div>{report.format.toUpperCase()}</div>
                          </div>
                        </div>

                        {report.lastRun && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                            Última execução: {formatDate(report.lastRun)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReportStatus(report.id)}
                          title={report.status === 'active' ? 'Pausar' : 'Ativar'}
                        >
                          {report.status === 'active' ? (
                            <PauseIcon className="h-4 w-4" />
                          ) : (
                            <PlayIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editScheduledReport(report)}
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduledReport(report.id)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Schedule Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Novo Agendamento"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome do Agendamento"
            value={newSchedule.name}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Relatório Mensal de Performance"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={newSchedule.reportType}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, reportType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Selecione um tipo</option>
              <option value="monthly_summary">Resumo Mensal</option>
              <option value="location_report">Relatório de Localização</option>
              <option value="financial_summary">Resumo Financeiro</option>
              <option value="births_analysis">Análise de Nascimentos</option>
              <option value="breeding_report">Relatório de Reprodução</option>
              <option value="inventory_report">Relatório de Estoque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequência
            </label>
            <div className="space-y-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={newSchedule.frequency === option.value}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horário
              </label>
              <input
                type="time"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato
              </label>
              <select
                value={newSchedule.format}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              checked={newSchedule.enabled}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">
              Ativar agendamento imediatamente
            </label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Informações importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Os relatórios serão enviados automaticamente via WhatsApp</li>
                  <li>Você pode pausar ou editar agendamentos a qualquer momento</li>
                  <li>Os destinatários devem estar cadastrados no sistema</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={createScheduledReport}
            >
              Criar Agendamento
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Agendamento"
        size="lg"
      >
        <div className="space-y-4">
          {/* Similar form fields as create modal */}
          <Input
            label="Nome do Agendamento"
            value={newSchedule.name}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Relatório Mensal de Performance"
            required
          />

          {/* Add other form fields similar to create modal */}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={updateScheduledReport}
            >
              Salvar Alterações
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
