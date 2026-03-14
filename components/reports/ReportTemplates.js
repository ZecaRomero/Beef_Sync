import React, { useState } from 'react'
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  TruckIcon,
  HeartIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PencilIcon
} from '../ui/Icons'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const REPORT_TEMPLATES = [
  {
    id: 'executive_summary',
    name: 'Resumo Executivo',
    description: 'VisÃ£o geral completa para tomada de decisÃµes estratÃ©gicas',
    icon: DocumentTextIcon,
    color: 'blue',
    category: 'GestÃ£o',
    sections: [
      'MÃ©tricas principais',
      'Performance financeira',
      'Indicadores de produtividade',
      'Alertas e recomendaÃ§Ãµes'
    ],
    estimatedTime: '5-8 min',
    complexity: 'MÃ©dio',
    frequency: 'Mensal'
  },
  {
    id: 'financial_analysis',
    name: 'AnÃ¡lise Financeira Completa',
    description: 'RelatÃ³rio detalhado de custos, receitas e rentabilidade',
    icon: CurrencyDollarIcon,
    color: 'green',
    category: 'Financeiro',
    sections: [
      'Fluxo de caixa',
      'AnÃ¡lise de custos',
      'ROI por animal',
      'ProjeÃ§Ãµes financeiras',
      'Comparativo histÃ³rico'
    ],
    estimatedTime: '8-12 min',
    complexity: 'Alto',
    frequency: 'Mensal'
  },
  {
    id: 'breeding_performance',
    name: 'Performance Reprodutiva',
    description: 'AnÃ¡lise completa do programa reprodutivo do rebanho',
    icon: HeartIcon,
    color: 'pink',
    category: 'ReproduÃ§Ã£o',
    sections: [
      'Taxa de prenhez',
      'AnÃ¡lise genealÃ³gica',
      'Performance de touros',
      'PrevisÃ£o de partos',
      'EficiÃªncia reprodutiva'
    ],
    estimatedTime: '6-10 min',
    complexity: 'Alto',
    frequency: 'Trimestral'
  },
  {
    id: 'location_tracking',
    name: 'Rastreamento e LocalizaÃ§Ã£o',
    description: 'Monitoramento detalhado da movimentaÃ§Ã£o dos animais',
    icon: MapPinIcon,
    color: 'orange',
    category: 'Operacional',
    sections: [
      'LocalizaÃ§Ã£o atual',
      'HistÃ³rico de movimentaÃ§Ãµes',
      'OcupaÃ§Ã£o de piquetes',
      'Animais sem localizaÃ§Ã£o',
      'EficiÃªncia de manejo'
    ],
    estimatedTime: '4-6 min',
    complexity: 'Baixo',
    frequency: 'Semanal'
  },
  {
    id: 'health_monitoring',
    name: 'Monitoramento SanitÃ¡rio',
    description: 'Acompanhamento da saÃºde e bem-estar do rebanho',
    icon: BeakerIcon,
    color: 'red',
    category: 'Sanidade',
    sections: [
      'HistÃ³rico de medicamentos',
      'Protocolos sanitÃ¡rios',
      'Mortalidade e causas',
      'Alertas de saÃºde',
      'Custos veterinÃ¡rios'
    ],
    estimatedTime: '7-9 min',
    complexity: 'MÃ©dio',
    frequency: 'Mensal'
  },
  {
    id: 'inventory_management',
    name: 'GestÃ£o de Estoque',
    description: 'Controle completo do estoque de sÃªmen',
    icon: ClipboardDocumentListIcon,
    color: 'purple',
    category: 'Estoque',
    sections: [
      'Estoque atual',
      'MovimentaÃ§Ãµes',
      'Alertas de estoque baixo',
      'AnÃ¡lise de fornecedores',
      'Custos de estoque'
    ],
    estimatedTime: '5-7 min',
    complexity: 'MÃ©dio',
    frequency: 'Quinzenal'
  },
  {
    id: 'productivity_analysis',
    name: 'AnÃ¡lise de Produtividade',
    description: 'MÃ©tricas de eficiÃªncia e produtividade do rebanho',
    icon: ChartBarIcon,
    color: 'emerald',
    category: 'Produtividade',
    sections: [
      'KPIs de produtividade',
      'AnÃ¡lise por raÃ§a',
      'EficiÃªncia por idade',
      'Comparativo de perÃ­odos',
      'Benchmarking'
    ],
    estimatedTime: '6-8 min',
    complexity: 'Alto',
    frequency: 'Mensal'
  },
  {
    id: 'logistics_report',
    name: 'RelatÃ³rio LogÃ­stico',
    description: 'AnÃ¡lise de transporte, movimentaÃ§Ã£o e logÃ­stica',
    icon: TruckIcon,
    color: 'indigo',
    category: 'LogÃ­stica',
    sections: [
      'MovimentaÃ§Ãµes de animais',
      'Custos de transporte',
      'EficiÃªncia logÃ­stica',
      'Rotas otimizadas',
      'Cronograma de atividades'
    ],
    estimatedTime: '4-6 min',
    complexity: 'MÃ©dio',
    frequency: 'Semanal'
  },
  {
    id: 'compliance_audit',
    name: 'Auditoria e Conformidade',
    description: 'VerificaÃ§Ã£o de conformidade com normas e regulamentaÃ§Ãµes',
    icon: ClipboardDocumentListIcon,
    color: 'yellow',
    category: 'Conformidade',
    sections: [
      'Checklist de conformidade',
      'DocumentaÃ§Ã£o obrigatÃ³ria',
      'CertificaÃ§Ãµes',
      'NÃ£o conformidades',
      'Plano de aÃ§Ã£o'
    ],
    estimatedTime: '8-12 min',
    complexity: 'Alto',
    frequency: 'Trimestral'
  }
]

const CATEGORIES = [
  'Todos',
  'GestÃ£o',
  'Financeiro',
  'ReproduÃ§Ã£o',
  'Operacional',
  'Sanidade',
  'Estoque',
  'Produtividade',
  'LogÃ­stica',
  'Conformidade'
]

const COMPLEXITY_COLORS = {
  'Baixo': 'green',
  'MÃ©dio': 'yellow',
  'Alto': 'red'
}

export default function ReportTemplates({ onSelectTemplate, onCreateCustom }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTemplates = REPORT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'Todos' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleUseTemplate = (template) => {
    onSelectTemplate(template)
  }

  const handlePreviewTemplate = (template) => {
    // Implementar preview do template
    console.log('Preview template:', template)
  }

  const handleDuplicateTemplate = (template) => {
    const duplicatedTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (CÃ³pia)`,
      isCustom: true
    }
    onSelectTemplate(duplicatedTemplate)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ðÅ¸â€œâ€¹ Templates de RelatÃ³rios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Escolha um template prÃ©-configurado ou crie um personalizado
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onCreateCustom}
          leftIcon={<PencilIcon className="h-4 w-4" />}
        >
          Criar Personalizado
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg bg-${template.color}-100 dark:bg-${template.color}-900/20`}>
                      <Icon className={`h-6 w-6 text-${template.color}-600 dark:text-${template.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-500">Tempo estimado:</span>
                    <span className="font-medium">{template.estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-500">Complexidade:</span>
                    <Badge 
                      variant={COMPLEXITY_COLORS[template.complexity]} 
                      size="sm"
                    >
                      {template.complexity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-500">FrequÃªncia:</span>
                    <span className="font-medium">{template.frequency}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SeÃ§Ãµes incluÃ­das:
                  </h4>
                  <div className="space-y-1">
                    {template.sections.slice(0, 3).map((section, index) => (
                      <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                        ââ‚¬¢ {section}
                      </div>
                    ))}
                    {template.sections.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        +{template.sections.length - 3} mais...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Usar Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                    title="Visualizar"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicar e personalizar"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tente ajustar os filtros ou criar um template personalizado
          </p>
          <Button
            variant="primary"
            onClick={onCreateCustom}
            leftIcon={<PencilIcon className="h-4 w-4" />}
          >
            Criar Template Personalizado
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {REPORT_TEMPLATES.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Templates DisponÃ­veis
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {CATEGORIES.length - 1}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Categorias
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {REPORT_TEMPLATES.filter(t => t.complexity === 'Alto').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Templates AvanÃ§ados
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(REPORT_TEMPLATES.reduce((acc, t) => 
                  acc + parseInt(t.estimatedTime.split('-')[0]), 0) / REPORT_TEMPLATES.length)}min
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tempo MÃ©dio
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}