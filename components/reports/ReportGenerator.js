
import React, { useEffect, useState } from 'react'

import { 
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  CalculatorIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  RectangleStackIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import ProductivityReport from './ProductivityReport'
import CostReport from './CostReport'
import FinancialAnalysisReport from './FinancialAnalysisReport'
import LocationReport from './LocationReport'
import ReportsDashboard from './ReportsDashboard.minimal'
import ReportTemplates from './ReportTemplates'
import AdvancedReportBuilder from './AdvancedReportBuilder'
import ReportScheduler from './ReportScheduler'
import ExcelTestButton from '../debug/ExcelTestButton'

const REPORT_TYPES = {
  monthly_summary: {
    id: 'monthly_summary',
    name: 'Resumo Mensal',
    description: 'RelatÃ³rio completo das atividades do mÃªs',
    icon: CalendarIcon,
    color: 'blue',
    sections: [
      'nascimentos',
      'mortes',
      'vendas',
      'compras',
      'gestacao',
      'estatisticas_gerais'
    ]
  },
  births_analysis: {
    id: 'births_analysis',
    name: 'AnÃ¡lise de Nascimentos',
    description: 'Detalhamento dos nascimentos por perÃ­odo',
    icon: UserGroupIcon,
    color: 'green',
    sections: [
      'nascimentos_por_pai',
      'nascimentos_por_mae',
      'distribuicao_sexo',
      'media_peso',
      'dificuldades_parto'
    ]
  },
  breeding_report: {
    id: 'breeding_report',
    name: 'RelatÃ³rio de ReproduÃ§Ã£o',
    description: 'AnÃ¡lise reprodutiva do rebanho',
    icon: ChartBarIcon,
    color: 'purple',
    sections: [
      'femeas_gestantes',
      'previsao_partos',
      'taxa_prenhez',
      'genealogia',
      'fiv_statistics'
    ]
  },
  financial_summary: {
    id: 'financial_summary',
    name: 'Resumo Financeiro',
    description: 'AnÃ¡lise financeira das operaÃ§Ãµes',
    icon: DocumentTextIcon,
    color: 'yellow',
    sections: [
      'receitas',
      'custos',
      'lucro_liquido',
      'roi_por_animal',
      'projecoes'
    ]
  },
  productivity_report: {
    id: 'productivity_report',
    name: 'RelatÃ³rio de Produtividade',
    description: 'AnÃ¡lise detalhada da produtividade do rebanho com dados reais',
    icon: ChartBarIcon,
    color: 'emerald',
    sections: [
      'metricas_gerais',
      'produtividade_por_raca',
      'produtividade_por_idade',
      'produtividade_por_localizacao',
      'tendencias_produtividade'
    ]
  },
  cost_report: {
    id: 'cost_report',
    name: 'RelatÃ³rio de Custos',
    description: 'AnÃ¡lise detalhada dos custos operacionais sem dados fictÃ­cios',
    icon: DocumentTextIcon,
    color: 'red',
    sections: [
      'custos_por_categoria',
      'custos_por_animal',
      'custos_por_periodo',
      'eficiencia_custos',
      'alertas_custos'
    ]
  },
  financial_analysis: {
    id: 'financial_analysis',
    name: 'AnÃ¡lise Financeira Completa',
    description: 'AnÃ¡lise financeira abrangente com mÃ©tricas de rentabilidade',
    icon: CalculatorIcon,
    color: 'teal',
    sections: [
      'resumo_executivo',
      'fluxo_caixa',
      'rentabilidade_animal',
      'projecoes_financeiras',
      'ponto_equilibrio',
      'kpis_financeiros'
    ]
  },
  inventory_report: {
    id: 'inventory_report',
    name: 'RelatÃ³rio de Estoque',
    description: 'Status do estoque e movimentaÃ§Ãµes',
    icon: DocumentArrowDownIcon,
    color: 'indigo',
    sections: [
      'estoque_semen',
      'movimentacoes',
      'alertas_estoque',
      'fornecedores'
    ]
  },
  location_report: {
    id: 'location_report',
    name: 'RelatÃ³rio de LocalizaÃ§Ã£o',
    description: 'LocalizaÃ§Ã£o atual e histÃ³rico de movimentaÃ§Ã£o dos animais',
    icon: MapPinIcon,
    color: 'orange',
    sections: [
      'localizacao_atual',
      'historico_movimentacoes',
      'animais_por_piquete',
      'movimentacoes_recentes',
      'animais_sem_localizacao'
    ]
  }
}

// DestinatÃ¡rios serÃ£o carregados do localStorage ou estado local

export default function ReportGenerator() {
  // Estados principais para navegaÃ§Ã£o
  const [currentView, setCurrentView] = useState('dashboard') // dashboard, templates, builder, scheduler, generator
  
  // Estados existentes do gerador
  const [selectedReports, setSelectedReports] = useState([])
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [recipients, setRecipients] = useState([])
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    whatsapp: '',
    role: ''
  })
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    type: 'custom' // monthly, quarterly, custom
  })
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [customSections, setCustomSections] = useState({})
  
  // Novos estados para funcionalidades avanÃ§adas
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    animalType: '',
    breed: '',
    location: '',
    ageRange: { min: '', max: '' },
    costCategory: '',
    minValue: '',
    maxValue: ''
  })
  const [exportFormat, setExportFormat] = useState('pdf')
  const [showReportViewer, setShowReportViewer] = useState(false)
  const [currentReportType, setCurrentReportType] = useState(null)
  
  // Estados para novos componentes
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customReports, setCustomReports] = useState([])

  useEffect(() => {
    // Set default period to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setReportPeriod({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
      type: 'monthly'
    })

    // Carregar destinatÃ¡rios salvos
    loadRecipients()
  }, [])

  const loadRecipients = () => {
    const savedRecipients = localStorage.getItem('reportRecipients')
    if (savedRecipients) {
      setRecipients(JSON.parse(savedRecipients))
    }
  }

  const saveRecipients = (newRecipients) => {
    localStorage.setItem('reportRecipients', JSON.stringify(newRecipients))
    setRecipients(newRecipients)
  }

  const addRecipient = () => {
    if (!newRecipient.name || !newRecipient.whatsapp) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: Nome e WhatsApp sÃ£o obrigatÃ³rios')
      return
    }

    // Validar formato do WhatsApp (apenas nÃºmeros)
    const whatsappClean = newRecipient.whatsapp.replace(/\D/g, '')
    if (whatsappClean.length < 10) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: WhatsApp deve ter pelo menos 10 dÃ­gitos')
      return
    }

    const recipient = {
      id: Date.now().toString(),
      name: newRecipient.name,
      whatsapp: whatsappClean,
      role: newRecipient.role || 'Contato'
    }

    const updatedRecipients = [...recipients, recipient]
    saveRecipients(updatedRecipients)
    
    setNewRecipient({ name: '', whatsapp: '', role: '' })
    setShowAddRecipient(false)
    alert('âÅ“â€¦ Sucesso! DestinatÃ¡rio adicionado com sucesso!')
  }

  const removeRecipient = (recipientId) => {
    const updatedRecipients = recipients.filter(r => r.id !== recipientId)
    saveRecipients(updatedRecipients)
    setSelectedRecipients(prev => prev.filter(id => id !== recipientId))
    alert('âÅ“â€¦ Sucesso! DestinatÃ¡rio removido com sucesso!')
  }

  const handleReportToggle = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  const handleRecipientToggle = (recipientId) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    )
  }

  const handleSectionToggle = (reportId, sectionId) => {
    setCustomSections(prev => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [sectionId]: !prev[reportId]?.[sectionId]
      }
    }))
  }

  const generatePreview = async () => {
    if (selectedReports.length === 0) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: Selecione pelo menos um tipo de relatÃ³rio')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: selectedReports,
          period: reportPeriod,
          sections: customSections,
          preview: true
        })
      })

      if (!response.ok) throw new Error('Erro ao gerar preview')
      
      const data = await response.json()
      setPreviewData(data)
      setShowPreview(true)
    } catch (error) {
      alert('â�Å’ Erro: NÃ£o foi possÃ­vel gerar o preview do relatÃ³rio')
    } finally {
      setLoading(false)
    }
  }

  const sendReports = async () => {
    if (selectedReports.length === 0) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: Selecione pelo menos um tipo de relatÃ³rio')
      return
    }

    if (selectedRecipients.length === 0) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: Selecione pelo menos um destinatÃ¡rio')
      return
    }

    try {
      setLoading(true)
      
      // Obter dados dos destinatÃ¡rios selecionados
      const selectedRecipientsData = recipients.filter(r => 
        selectedRecipients.includes(r.id)
      )
      
      const response = await fetch('/api/reports/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: selectedReports,
          recipients: selectedRecipientsData,
          period: reportPeriod,
          sections: customSections
        })
      })

      if (!response.ok) throw new Error('Erro ao enviar relatÃ³rios')
      
      alert(`âÅ“â€¦ Sucesso! RelatÃ³rios enviados via WhatsApp para ${selectedRecipientsData.length} destinatÃ¡rio(s)!`)
      
      // Reset form
      setSelectedReports([])
      setSelectedRecipients([])
      setCustomSections({})
    } catch (error) {
      alert('â�Å’ Erro: NÃ£o foi possÃ­vel enviar os relatÃ³rios via WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format = 'pdf') => {
    if (selectedReports.length === 0) {
      alert('âÅ¡ ï¸� AtenÃ§Ã£o: Selecione pelo menos um tipo de relatÃ³rio')
      return
    }

    try {
      setLoading(true)
      
      console.log('ðÅ¸â€œÅ  Iniciando download do relatÃ³rio...', { format, reports: selectedReports })
      
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: selectedReports,
          period: reportPeriod,
          sections: customSections,
          filters: filters,
          format
        })
      })

      console.log('ðÅ¸â€œ¡ Resposta da API:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('â�Å’ Erro da API:', errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }
      
      const contentType = response.headers.get('content-type')
      console.log('ðÅ¸â€œâ€¹ Content-Type:', contentType)
      
      const blob = await response.blob()
      console.log('ðÅ¸â€œ¦ Blob criado:', blob.size, 'bytes')
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Definir extensÃ£o correta baseada no formato
      const fileExtension = format === 'xlsx' || format === 'excel' ? 'xlsx' : format
      const filename = `relatorio-${reportPeriod.startDate}-${reportPeriod.endDate}.${fileExtension}`
      a.download = filename
      
      console.log('ðÅ¸â€™¾ Baixando arquivo:', filename)
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('âÅ“â€¦ Sucesso! RelatÃ³rio baixado com sucesso!')
    } catch (error) {
      console.error('â�Å’ Erro completo:', error)
      alert(`â�Å’ Erro: ${error.message || 'NÃ£o foi possÃ­vel baixar o relatÃ³rio'}`)
    } finally {
      setLoading(false)
    }
  }

  // Novas funÃ§Ãµes para funcionalidades avanÃ§adas
  const resetFilters = () => {
    setFilters({
      animalType: '',
      breed: '',
      location: '',
      ageRange: { min: '', max: '' },
      costCategory: '',
      minValue: '',
      maxValue: ''
    })
  }

  const openReportViewer = (reportType) => {
    setCurrentReportType(reportType)
    setShowReportViewer(true)
  }

  const renderReportComponent = () => {
    if (!currentReportType) return null

    const reportProps = {
      filters,
      period: reportPeriod,
      onClose: () => setShowReportViewer(false)
    }

    switch (currentReportType) {
      case 'productivity_report':
        return <ProductivityReport {...reportProps} />
      case 'cost_report':
        return <CostReport {...reportProps} />
      case 'financial_analysis':
        return <FinancialAnalysisReport {...reportProps} />
      case 'location_report':
        return <LocationReport {...reportProps} />
      default:
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              VisualizaÃ§Ã£o nÃ£o disponÃ­vel para este tipo de relatÃ³rio.
            </p>
          </div>
        )
    }
  }

  // Handlers para navegaÃ§Ã£o
  const handleCreateReport = () => {
    setCurrentView('generator')
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setCurrentView('generator')
    // Configurar o gerador com base no template
    if (template.sections) {
      const reportTypes = template.sections.map(section => {
        // Mapear seÃ§Ãµes do template para tipos de relatÃ³rio
        if (section.includes('LocalizaÃ§Ã£o') || section.includes('localizaÃ§Ã£o')) return 'location_report'
        if (section.includes('Financeiro') || section.includes('financeiro')) return 'financial_summary'
        if (section.includes('Nascimento') || section.includes('nascimento')) return 'births_analysis'
        return 'monthly_summary'
      })
      setSelectedReports([...new Set(reportTypes)])
    }
  }

  const handleCreateCustom = () => {
    setCurrentView('builder')
  }

  const handleSaveCustomReport = async (reportConfig) => {
    // Salvar relatÃ³rio personalizado
    const newReport = {
      ...reportConfig,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isCustom: true
    }
    setCustomReports(prev => [...prev, newReport])
    setCurrentView('dashboard')
  }

  const handleViewReport = (report) => {
    // Implementar visualizaÃ§Ã£o de relatÃ³rio
    console.log('Viewing report:', report)
  }

  // Renderizar componente baseado na view atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ReportsDashboard 
            onCreateReport={handleCreateReport}
            onViewReport={handleViewReport}
          />
        )
      case 'templates':
        return (
          <ReportTemplates 
            onSelectTemplate={handleSelectTemplate}
            onCreateCustom={handleCreateCustom}
          />
        )
      case 'builder':
        return (
          <AdvancedReportBuilder 
            onSave={handleSaveCustomReport}
            onCancel={() => setCurrentView('dashboard')}
          />
        )
      case 'scheduler':
        return <ReportScheduler />
      case 'generator':
        return renderReportGenerator()
      default:
        return renderReportGenerator()
    }
  }

  const renderReportGenerator = () => (
    <div className="space-y-6">
      {/* Header com navegaÃ§Ã£o */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerador de RelatÃ³rios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie e envie relatÃ³rios personalizados para sua equipe
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setCurrentView('dashboard')}
        >
          ââ€ � Voltar ao Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Period Selection */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                PerÃ­odo do RelatÃ³rio
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setReportPeriod(prev => ({ ...prev, type: 'monthly' }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      reportPeriod.type === 'monthly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setReportPeriod(prev => ({ ...prev, type: 'quarterly' }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      reportPeriod.type === 'quarterly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    Trimestral
                  </button>
                  <button
                    onClick={() => setReportPeriod(prev => ({ ...prev, type: 'custom' }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      reportPeriod.type === 'custom'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data Inicial"
                    type="date"
                    value={reportPeriod.startDate}
                    onChange={(e) => setReportPeriod(prev => ({ 
                      ...prev, 
                      startDate: e.target.value 
                    }))}
                  />
                  <Input
                    label="Data Final"
                    type="date"
                    value={reportPeriod.endDate}
                    onChange={(e) => setReportPeriod(prev => ({ 
                      ...prev, 
                      endDate: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Report Types */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Tipos de RelatÃ³rio
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.values(REPORT_TYPES).map((report) => {
                  const Icon = report.icon
                  const isSelected = selectedReports.includes(report.id)
                  
                  return (
                    <div key={report.id} className="space-y-3">
                      <div
                        onClick={() => handleReportToggle(report.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-${report.color}-100 dark:bg-${report.color}-900/20`}>
                            <Icon className={`h-5 w-5 text-${report.color}-600 dark:text-${report.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {report.name}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {/* BotÃ£o de Visualizar para novos relatÃ³rios */}
                                {['productivity_report', 'cost_report', 'financial_analysis'].includes(report.id) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openReportViewer(report.id)
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Visualizar RelatÃ³rio"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleReportToggle(report.id)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
                                />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {report.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Custom Sections */}
                      {isSelected && (
                        <div className="ml-6 space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            SeÃ§Ãµes do RelatÃ³rio:
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {report.sections.map((section) => (
                              <label key={section} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={customSections[report.id]?.[section] !== false}
                                  onChange={() => handleSectionToggle(report.id, section)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recipients Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  DestinatÃ¡rios
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddRecipient(true)}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {recipients.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhum destinatÃ¡rio cadastrado
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddRecipient(true)}
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Adicionar Primeiro DestinatÃ¡rio
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedRecipients.includes(recipient.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {recipient.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ðÅ¸â€œ± +55 {recipient.whatsapp}
                          </p>
                          <Badge variant="neutral" size="sm" className="mt-1">
                            {recipient.role}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(recipient.id)}
                            onChange={() => handleRecipientToggle(recipient.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remover destinatÃ¡rio"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Filtros AvanÃ§ados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filtros AvanÃ§ados
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </CardHeader>
            {showAdvancedFilters && (
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Animal
                      </label>
                      <select
                        value={filters.animalType}
                        onChange={(e) => setFilters(prev => ({ ...prev, animalType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Todos os tipos</option>
                        <option value="bovino">Bovino</option>
                        <option value="equino">Equino</option>
                        <option value="suino">SuÃ­no</option>
                        <option value="ovino">Ovino</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RaÃ§a
                      </label>
                      <input
                        type="text"
                        value={filters.breed}
                        onChange={(e) => setFilters(prev => ({ ...prev, breed: e.target.value }))}
                        placeholder="Ex: Nelore, Angus..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        LocalizaÃ§Ã£o
                      </label>
                      <input
                        type="text"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Ex: Piquete 1, Curral A..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria de Custo
                      </label>
                      <select
                        value={filters.costCategory}
                        onChange={(e) => setFilters(prev => ({ ...prev, costCategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Todas as categorias</option>
                        <option value="medicamentos">Medicamentos</option>
                        <option value="veterinario">VeterinÃ¡rio</option>
                        <option value="manutencao">ManutenÃ§Ã£o</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Faixa EtÃ¡ria (meses)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={filters.ageRange.min}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            ageRange: { ...prev.ageRange, min: e.target.value }
                          }))}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                          type="number"
                          value={filters.ageRange.max}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            ageRange: { ...prev.ageRange, max: e.target.value }
                          }))}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Faixa de Valores (R$)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={filters.minValue}
                          onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                          placeholder="Min"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                          type="number"
                          value={filters.maxValue}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                          placeholder="Max"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetFilters}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardBody>
            )}
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AÃ§Ãµes
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                  onClick={generatePreview}
                  loading={loading}
                >
                  Visualizar Preview
                </Button>
                
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                  onClick={sendReports}
                  loading={loading}
                >
                  ðÅ¸â€œ± Enviar via WhatsApp
                </Button>

                <div className="flex space-x-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="xlsx">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                    onClick={() => downloadReport(exportFormat)}
                    loading={loading}
                  >
                    Baixar {exportFormat.toUpperCase()}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Summary */}
          {(selectedReports.length > 0 || selectedRecipients.length > 0) && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumo
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>RelatÃ³rios:</strong> {selectedReports.length} selecionados
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>DestinatÃ¡rios:</strong> {selectedRecipients.length} selecionados
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>PerÃ­odo:</strong> {reportPeriod.startDate} atÃ© {reportPeriod.endDate}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Debug Test Component */}
          <Card>
            <CardBody>
              <ExcelTestButton />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview do RelatÃ³rio"
        size="xl"
      >
        {previewData && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                PerÃ­odo: {reportPeriod.startDate} atÃ© {reportPeriod.endDate}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total de Animais:</span>
                  <span className="ml-2 font-medium">{previewData.totalAnimals || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Nascimentos:</span>
                  <span className="ml-2 font-medium">{previewData.births || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Mortes:</span>
                  <span className="ml-2 font-medium">{previewData.deaths || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Vendas:</span>
                  <span className="ml-2 font-medium">{previewData.sales || 0}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este Ã© um preview simplificado. O relatÃ³rio completo serÃ¡ gerado com todos os dados detalhados.
            </p>
          </div>
        )}
      </Modal>

      {/* Add Recipient Modal */}
      <Modal
        isOpen={showAddRecipient}
        onClose={() => {
          setShowAddRecipient(false)
          setNewRecipient({ name: '', whatsapp: '', role: '' })
        }}
        title="Adicionar DestinatÃ¡rio"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="ðÅ¸â€œ� Nome Completo"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: JoÃ£o Silva"
            required
          />
          
          <Input
            label="ðÅ¸â€œ± WhatsApp (apenas nÃºmeros)"
            value={newRecipient.whatsapp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setNewRecipient(prev => ({ ...prev, whatsapp: value }))
            }}
            placeholder="Ex: 11999887766"
            required
            maxLength={11}
          />
          
          <Input
            label="ðÅ¸â€˜¤ FunÃ§Ã£o/Cargo"
            value={newRecipient.role}
            onChange={(e) => setNewRecipient(prev => ({ ...prev, role: e.target.value }))}
            placeholder="Ex: ProprietÃ¡rio, VeterinÃ¡rio, Gerente"
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ðÅ¸â€™¡ <strong>Dica:</strong> Os relatÃ³rios serÃ£o enviados via WhatsApp para este nÃºmero.
              Certifique-se de que o nÃºmero estÃ¡ correto e inclui o DDD.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={addRecipient}
            >
              Adicionar DestinatÃ¡rio
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddRecipient(false)
                setNewRecipient({ name: '', whatsapp: '', role: '' })
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Viewer Modal */}
      <Modal
        isOpen={showReportViewer}
        onClose={() => setShowReportViewer(false)}
        title={currentReportType ? REPORT_TYPES[currentReportType]?.name : 'RelatÃ³rio'}
        size="full"
      >
        {renderReportComponent()}
      </Modal>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'dashboard'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <RectangleStackIcon className="h-4 w-4" />
              <span>Templates</span>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('builder')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'builder'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <WrenchScrewdriverIcon className="h-4 w-4" />
              <span>Construtor</span>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('scheduler')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'scheduler'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>Agendamentos</span>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('generator')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'generator'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Gerador</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {renderCurrentView()}
    </div>
  )
}