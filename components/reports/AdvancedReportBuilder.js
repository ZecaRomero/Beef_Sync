import React, { useState, useEffect } from 'react'
import { 
  PlusIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  FunnelIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'

const REPORT_SECTIONS = {
  header: {
    name: 'Cabeçalho',
    description: 'Informações básicas do relatório',
    fields: ['title', 'period', 'generated_date', 'logo']
  },
  summary: {
    name: 'Resumo Executivo',
    description: 'Principais métricas e KPIs',
    fields: ['total_animals', 'births', 'deaths', 'sales', 'revenue']
  },
  charts: {
    name: 'Gráficos',
    description: 'Visualizações de dados',
    fields: ['birth_trends', 'location_distribution', 'breed_analysis', 'financial_charts']
  },
  tables: {
    name: 'Tabelas Detalhadas',
    description: 'Dados tabulares completos',
    fields: ['animal_list', 'financial_details', 'location_history', 'breeding_records']
  },
  analysis: {
    name: 'Análises',
    description: 'Insights e recomendações',
    fields: ['performance_analysis', 'cost_efficiency', 'recommendations', 'alerts']
  },
  appendix: {
    name: 'Anexos',
    description: 'Informações complementares',
    fields: ['methodology', 'data_sources', 'glossary', 'contacts']
  }
}

const CHART_TYPES = [
  { id: 'bar', name: 'Gráfico de Barras', icon: ChartBarIcon },
  { id: 'line', name: 'Gráfico de Linha', icon: ChartBarIcon },
  { id: 'pie', name: 'Gráfico de Pizza', icon: ChartBarIcon },
  { id: 'area', name: 'Gráfico de Área', icon: ChartBarIcon }
]

const DATA_SOURCES = [
  { id: 'animals', name: 'Animais', table: 'animais' },
  { id: 'births', name: 'Nascimentos', table: 'nascimentos' },
  { id: 'deaths', name: 'Mortes', table: 'animais' },
  { id: 'locations', name: 'Localizações', table: 'localizacoes_animais' },
  { id: 'costs', name: 'Custos', table: 'custos' },
  { id: 'semen', name: 'Estoque de Sêmen', table: 'estoque_semen' }
]

export default function AdvancedReportBuilder({ onSave, onCancel, initialReport = null }) {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    sections: [],
    filters: {},
    scheduling: {
      enabled: false,
      frequency: 'monthly',
      recipients: []
    },
    formatting: {
      template: 'modern',
      includeCharts: true,
      includeTables: true,
      pageSize: 'A4',
      orientation: 'portrait'
    }
  })

  const [showSectionModal, setShowSectionModal] = useState(false)
  const [currentSection, setCurrentSection] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialReport) {
      setReportConfig(initialReport)
    }
  }, [initialReport])

  const addSection = (sectionType) => {
    const newSection = {
      id: Date.now().toString(),
      type: sectionType,
      title: REPORT_SECTIONS[sectionType].name,
      fields: REPORT_SECTIONS[sectionType].fields.map(field => ({
        id: field,
        name: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        enabled: true,
        config: {}
      })),
      order: reportConfig.sections.length
    }

    setReportConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  const removeSection = (sectionId) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }))
  }

  const updateSection = (sectionId, updates) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }))
  }

  const moveSection = (sectionId, direction) => {
    const sections = [...reportConfig.sections]
    const index = sections.findIndex(s => s.id === sectionId)
    
    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]]
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
    }

    setReportConfig(prev => ({ ...prev, sections }))
  }

  const generatePreview = async () => {
    setLoading(true)
    try {
      // Simular geração de preview
      await new Promise(resolve => setTimeout(resolve, 2000))
      setShowPreview(true)
    } catch (error) {
      alert('❌ Erro ao gerar preview')
    } finally {
      setLoading(false)
    }
  }

  const saveReport = async () => {
    if (!reportConfig.name.trim()) {
      alert('⚠️ Nome do relatório é obrigatório')
      return
    }

    if (reportConfig.sections.length === 0) {
      alert('⚠️ Adicione pelo menos uma seção ao relatório')
      return
    }

    try {
      setLoading(true)
      await onSave(reportConfig)
      alert('✅ Relatório salvo com sucesso!')
    } catch (error) {
      alert('❌ Erro ao salvar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            🔧 Construtor de Relatórios Avançado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie relatórios personalizados com seções e campos específicos
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={saveReport}
            loading={loading}
          >
            Salvar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📝 Informações Básicas
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Nome do Relatório"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  placeholder="Ex: Relatório Mensal de Performance"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    placeholder="Descreva o objetivo e conteúdo do relatório..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Report Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📋 Seções do Relatório
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSectionModal(true)}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Adicionar Seção
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {reportConfig.sections.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhuma seção adicionada ainda
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowSectionModal(true)}
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Adicionar Primeira Seção
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportConfig.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                    <div
                      key={section.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="neutral" size="sm">
                            {index + 1}
                          </Badge>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {section.title}
                          </h4>
                          <Badge variant="blue" size="sm">
                            {section.fields.filter(f => f.enabled).length} campos
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={index === 0}
                            title="Mover para cima"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={index === reportConfig.sections.length - 1}
                            title="Mover para baixo"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentSection(section)
                              setShowSectionModal(true)
                            }}
                            title="Editar seção"
                          >
                            <Cog6ToothIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            title="Remover seção"
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {section.fields.map((field) => (
                          <label key={field.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => {
                                const updatedFields = section.fields.map(f =>
                                  f.id === field.id ? { ...f, enabled: e.target.checked } : f
                                )
                                updateSection(section.id, { fields: updatedFields })
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {field.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Formatting Options */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🎨 Opções de Formatação
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template
                  </label>
                  <select
                    value={reportConfig.formatting.template}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      formatting: { ...prev.formatting, template: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="modern">Moderno</option>
                    <option value="classic">Clássico</option>
                    <option value="minimal">Minimalista</option>
                    <option value="corporate">Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamanho da Página
                  </label>
                  <select
                    value={reportConfig.formatting.pageSize}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      formatting: { ...prev.formatting, pageSize: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientação
                  </label>
                  <select
                    value={reportConfig.formatting.orientation}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      formatting: { ...prev.formatting, orientation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="portrait">Retrato</option>
                    <option value="landscape">Paisagem</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={reportConfig.formatting.includeCharts}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        formatting: { ...prev.formatting, includeCharts: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir Gráficos
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={reportConfig.formatting.includeTables}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        formatting: { ...prev.formatting, includeTables: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir Tabelas
                    </span>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                👁️ Preview
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={generatePreview}
                  loading={loading}
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                >
                  Gerar Preview
                </Button>
                
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                  disabled={reportConfig.sections.length === 0}
                >
                  Baixar Exemplo
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Resumo
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Seções:</span>
                  <span className="font-medium">{reportConfig.sections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Campos ativos:</span>
                  <span className="font-medium">
                    {reportConfig.sections.reduce((total, section) => 
                      total + section.fields.filter(f => f.enabled).length, 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Template:</span>
                  <span className="font-medium capitalize">
                    {reportConfig.formatting.template}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Formato:</span>
                  <span className="font-medium">
                    {reportConfig.formatting.pageSize} - {reportConfig.formatting.orientation}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Section Modal */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => {
          setShowSectionModal(false)
          setCurrentSection(null)
        }}
        title={currentSection ? 'Editar Seção' : 'Adicionar Seção'}
        size="lg"
      >
        <div className="space-y-4">
          {!currentSection && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(REPORT_SECTIONS).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => {
                    addSection(key)
                    setShowSectionModal(false)
                  }}
                  className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {section.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="neutral" size="sm">
                      {section.fields.length} campos
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview do Relatório"
        size="full"
      >
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {reportConfig.name || 'Relatório Personalizado'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {reportConfig.description || 'Descrição do relatório'}
              </p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                Gerado em: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {reportConfig.sections.map((section, index) => (
              <div key={section.id} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {index + 1}. {section.title}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {section.fields.filter(f => f.enabled).map((field) => (
                    <div key={field.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        [Dados serão carregados aqui]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
