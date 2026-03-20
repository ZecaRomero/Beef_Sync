
import {
    ArrowPathIcon,
    ArrowUpTrayIcon,
    BanknotesIcon,
    Bars3Icon,
    BeakerIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CogIcon,
    CubeIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    EyeIcon,
    HeartIcon,
    HomeIcon,
    MapPinIcon,
    ShieldCheckIcon,
    TruckIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../lib/utils'
import { NavigationItem, SidebarProps } from '../../types/layout'
import NetworkStatusIndicator from '../ui/NetworkStatusIndicator'

const navigation: NavigationItem[] = [
  {
    name: 'Importações',
    icon: ArrowUpTrayIcon,
    color: 'text-blue-600 dark:text-blue-400',
    children: [
      { name: 'Central de Importações', href: '/importacoes', description: 'IA, Nascimentos, TE, iABCZ, DECA, IQG, Pt IQG, Localização, Piquetes, Óbitos, Observações, Pesagens' },
      { name: 'Excel Universal', href: '/importacao-excel', description: 'Animais, IA, FIV, Nascimentos, DG, Notas Fiscais' }
    ]
  },
  {
    name: 'Animais',
    icon: UserGroupIcon,
    color: 'text-green-600 dark:text-green-400',
    children: [
      { name: 'Lista de Animais', href: '/animals', description: 'Gerenciar rebanho' },
      { name: '🔍 Consulta Rápida', href: '/a', description: 'Buscar por Série e RG (celular)' },
      { name: '📱 Mobile + Ranking iABCZ', href: '/mobile-animal', description: 'Consulta mobile com importação e ranking' },
      { name: 'Nascimentos', href: '/nascimentos', description: 'Registrar nascimentos' },
      { name: 'Gestação', href: '/gestacao', description: 'Controle reprodutivo' },
      { name: 'Ocorrências', href: '/ocorrencias', description: 'Eventos do rebanho' },
      { name: 'Mortes', href: '/movimentacoes/mortes', description: 'Registro de óbitos' },
      { name: '🗑️ Limpar Todos os Animais', href: '/limpar-animais', description: 'Excluir todos os animais do banco', danger: true }
    ]
  },
  {
    name: 'Boletim Defesa',
    icon: ShieldCheckIcon,
    color: 'text-teal-600 dark:text-teal-400',
    children: [
      { name: 'Dashboard', href: '/boletim-defesa', description: 'Boletim Defesa + Boletim Campo (Excel)' },
      { name: 'Acesso Adelso', href: '/adelso', description: 'Login Adelso - Relatórios ou Boletim' }
    ]
  },
  {
    name: 'Comercial',
    icon: TruckIcon,
    color: 'text-cyan-600 dark:text-cyan-400',
    children: [
      { name: 'Dashboard', href: '/comercial', description: 'Visão geral comercial' },
      { name: 'Análise de Mercado & ROI', href: '/comercial/analise-mercado', description: 'Análise inteligente de vendas' },
      { name: 'Clientes', href: '/comercial/clientes', description: 'Cadastro de clientes' },
      { name: 'Fornecedores', href: '/comercial/fornecedores', description: 'Gestão de fornecedores' },
      { name: 'Contratos', href: '/comercial/contratos', description: 'Contratos comerciais' }
    ]
  },
  {
    name: 'Leilão',
    icon: BanknotesIcon,
    color: 'text-amber-600 dark:text-amber-400',
    children: [
      { name: 'Dashboard Leilão', href: '/leilao', description: 'Custo atual, sugestão de venda e ROI', new: true },
      { name: 'Importar Excel', href: '/leilao/importar', description: 'Pesagens, IA, parições e dados para leilão', new: true }
    ]
  },
  {
    name: 'Contabilidade',
    icon: ClipboardDocumentListIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    children: [
      { name: 'Relatórios Contábeis', href: '/contabilidade', description: 'Análise financeira' }
    ]
  },
  {
    name: 'Custos',
    href: '/custos',
    icon: CurrencyDollarIcon,
    color: 'text-red-600 dark:text-red-400'
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    name: 'DNA',
    icon: BeakerIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    children: [
      { name: 'Envio para Laboratório', href: '/dna', description: 'Enviar animais para análise de DNA' },
      { name: 'Histórico de Envios', href: '/dna/historico', description: 'Histórico de análises de DNA' }
    ]
  },
  {
    name: 'Estoque',
    icon: CubeIcon,
    color: 'text-purple-600 dark:text-purple-400',
    children: [
      { name: 'Estoque de Sêmen', href: '/estoque-semen', description: 'Controle de sêmen' },
      { name: 'Nitrogênio', href: '/nitrogenio', description: 'Gestão de nitrogênio' }
    ]
  },
  {
    name: 'Manutenção',
    icon: WrenchScrewdriverIcon,
    color: 'text-yellow-600 dark:text-yellow-400',
    children: [
      { name: 'Diagnóstico', href: '/diagnostico-animais', description: 'Diagnóstico do sistema' },
      { name: 'Teste Animais', href: '/test-animals', description: 'Testar funcionalidades' },
      { name: 'Debug Animais', href: '/debug-animals', description: 'Debug do sistema' },
      { name: 'Teste Boletim', href: '/test-boletim', description: 'Testar boletins' },
      { name: 'Limpeza Animais', href: '/cleanup-animals', description: 'Limpeza de dados' },
      { name: '🗑️ Limpar Todos os Animais', href: '/limpar-animais', description: 'Excluir todos os animais do banco', danger: true },
      { name: '🔥 Limpar Banco Completo', href: '/limpar-banco-completo', description: 'Excluir TODOS os dados (NFs, Boletim, etc)', danger: true }
    ]
  },
  {
    name: 'Monitoramento',
    icon: EyeIcon,
    color: 'text-violet-600 dark:text-violet-400',
    children: [
      { name: 'Acessos ao Sistema', href: '/monitoramento/acessos', description: 'Acessos, mobile, bloquear e manutenção' },
      { name: 'Alertas Inteligentes', href: '/monitoramento/alertas', description: 'Notificações automáticas' },
      { name: 'Performance do Rebanho', href: '/monitoramento/performance', description: 'Indicadores de performance' },
      { name: 'Análise de Tendências', href: '/monitoramento/tendencias', description: 'Análise preditiva' },
      { name: 'Dashboard Executivo', href: '/monitoramento/dashboard-executivo', description: 'Visão gerencial' }
    ]
  },
  {
    name: 'Movimentação',
    icon: ArrowPathIcon,
    color: 'text-purple-600 dark:text-purple-400',
    children: [
      { name: 'Localização de Animais', href: '/movimentacao/localizacao', description: 'Onde estão os animais' },
      { name: 'Histórico de Movimentações', href: '/movimentacao/historico', description: 'Histórico de transferências' },
      { name: 'Gestão de Piquetes', href: '/movimentacao/piquetes', description: 'Gerenciar piquetes' }
    ]
  },
  {
    name: 'Notas Fiscais',
    icon: DocumentTextIcon,
    color: 'text-orange-600 dark:text-orange-400',
    children: [
      { name: 'Gerenciar NFs', href: '/notas-fiscais', description: 'Entradas e Saídas (Vendas)' },
      { name: 'Relatório Fiscal', href: '/notas-fiscais/relatorio', description: 'Relatórios fiscais' },
      { name: 'Vendas Embriões/Sêmen', href: '/notas-fiscais/vendas-genetica', description: 'Relatório de vendas genéticas' }
    ]
  },
  {
    name: 'Pesagem',
    icon: MapPinIcon,
    color: 'text-amber-600 dark:text-amber-400',
    children: [
      { name: 'Pesagem', href: '/manejo/pesagem', description: 'Controle de peso' },
      { name: 'Lotes', href: '/manejo/lotes', description: 'Organização em lotes' },
      { name: 'Rastreabilidade', href: '/manejo/rastreabilidade', description: 'Histórico de movimentos' }
    ]
  },
  {
    name: 'Planejamento',
    icon: CalendarDaysIcon,
    color: 'text-rose-600 dark:text-rose-400',
    children: [
      { name: 'Agenda de Atividades', href: '/planejamento/agenda', description: 'Cronograma de atividades' },
      { name: 'Envio de Relatórios', href: '/relatorios-envio', description: 'Enviar relatórios por email e WhatsApp' },
      { name: 'Metas e Objetivos', href: '/planejamento/metas', description: 'Definir metas' },
      { name: 'Orçamento', href: '/planejamento/orcamento', description: 'Planejamento financeiro' },
      { name: 'Projeções', href: '/planejamento/projecoes', description: 'Projeções futuras' }
    ]
  },
  {
    name: 'Protocolos',
    href: '/protocol-editor',
    icon: BeakerIcon,
    color: 'text-pink-600 dark:text-pink-400'
  },
  {
    name: 'Relatórios',
    icon: ChartBarIcon,
    color: 'text-teal-600 dark:text-teal-400',
    children: [
      { name: 'Visualizar Relatórios', href: '/reports', description: 'Consultar relatórios' },
      { name: 'Gerador de Relatórios', href: '/reports-manager', description: 'Criar relatórios' },
      { name: 'Relatórios de Ocorrências', href: '/relatorios-ocorrencias', description: 'Análise de eventos' },
      { name: 'Histórico de Lançamentos', href: '/relatorios-lotes', description: 'Rastreamento de operações' },
      { name: 'Relatórios Personalizados', href: '/relatorios-personalizados', description: 'Relatórios customizados' }
    ]
  },
  {
    name: 'Reprodução',
    icon: HeartIcon,
    color: 'text-pink-600 dark:text-pink-400',
    children: [
      { name: 'Controle Reprodutivo', href: '/reproducao/controle', description: 'Gestão reprodutiva' },
      { name: 'Inseminação Artificial', href: '/reproducao/inseminacao', description: 'Registro de IA' },
      { name: 'Transferência de Embriões', href: '/reproducao/transferencia-embrioes', description: 'Controle de TE' },
      { name: 'Receptoras para DG', href: '/reproducao/receptoras-dg', description: 'Lista de receptoras para Diagnóstico de Gestação' },
      { name: 'Nascimentos', href: '/reproducao/nascimentos', description: 'Controle de nascimentos e alertas' },
      { name: 'Coleta de Oócitos (FIV)', href: '/reproducao/coleta-fiv', description: 'Coleta para FIV' },
      { name: 'Exames Andrológicos', href: '/reproducao/exames-andrologicos', description: 'Exames de touros' },
      { name: 'Calendário Reprodutivo', href: '/reproducao/calendario', description: 'Agenda reprodutiva' },
      { name: 'Genealogia', href: '/reproducao/genealogia', description: 'Árvore genealógica' }
    ]
  },
  {
    name: 'Sanidade',
    icon: ShieldCheckIcon,
    color: 'text-emerald-600 dark:text-emerald-400',
    children: [
      { name: 'Protocolos Sanitários', href: '/sanidade/protocolos', description: 'Protocolos de saúde' },
      { name: 'Vacinação', href: '/sanidade/vacinacao', description: 'Controle de vacinas' },
      { name: 'Medicamentos', href: '/sanidade/medicamentos', description: 'Estoque de medicamentos' },
      { name: 'Exames Laboratoriais', href: '/sanidade/exames', description: 'Resultados de exames' },
      { name: 'Quarentena', href: '/sanidade/quarentena', description: 'Animais em quarentena' },
      { name: 'Histórico Sanitário', href: '/sanidade/historico', description: 'Histórico de saúde' }
    ]
  },
  {
    name: 'Sistema',
    icon: CogIcon,
    color: 'text-gray-600 dark:text-gray-400',
    children: [
      { name: 'Configurações', href: '/settings', description: 'Configurar sistema' },
      { name: 'Backup', href: '/backup', description: 'Backup de dados' },
      { name: 'Usuários', href: '/sistema/usuarios', description: 'Gestão de usuários' },
      { name: 'Permissões', href: '/sistema/permissoes', description: 'Controle de acesso' },
      { name: '💬 Feedbacks', href: '/admin/feedbacks', description: 'Feedbacks dos usuários mobile' }
    ]
  }
]

const ModernSidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, onToggleCollapse, onClose }) => {
  const router = useRouter()
  const permissions = usePermissions()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtrar itens de navegação baseado em permissões
  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => {
      // Ocultar "Sistema" e "Manutenção" para usuários de rede
      if (!permissions.isDeveloper) {
        if (item.name === 'Sistema' || item.name === 'Manutenção') {
          return false
        }
      }
      return true
    })
  }, [permissions.isDeveloper])

  const toggleExpanded = (itemName: string) => {
    if (isCollapsed) return
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' && router.pathname === '/') return true
    return router.pathname === href
  }

  const hasActiveChild = (children: any[] | undefined) => {
    return children?.some(child => isActive(child.href))
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 xl:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar="main"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
          'shadow-xl xl:shadow-lg',
          isCollapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0 sidebar-open' : '-translate-x-full xl:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
          'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
        )}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bars3Icon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Beef-Sync</h1>
                <p className="text-xs text-blue-100">Sistema de Gestão</p>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={cn(
              'p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200',
              'hidden xl:flex items-center justify-center'
            )}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 xl:hidden"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-2 px-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const isItemActive = item.href ? isActive(item.href) : hasActiveChild(item.children)
            const isExpanded = expandedItems[item.name]

            return (
              <div key={item.name} className="transition-all duration-200 ease-in-out">
                {item.href ? (
                  // Single navigation item
                  <Link href={item.href}>
                    <div className={cn(
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 border',
                      isItemActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 shadow-sm'
                        : 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm hover:border-gray-100 dark:hover:border-gray-700',
                      isCollapsed ? 'justify-center' : 'justify-start'
                    )}>
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors duration-200 flex-shrink-0",
                        isItemActive 
                          ? "bg-white/50 dark:bg-black/20" 
                          : "bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700"
                      )}>
                        <Icon className={cn(
                          'w-5 h-5 transition-colors duration-200',
                          isItemActive ? item.color : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                        )} />
                      </div>
                      {!isCollapsed && (
                        <span className="ml-3 font-medium truncate">{item.name}</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  // Navigation item with children
                  <div className={cn(
                    "rounded-xl transition-all duration-200",
                    isExpanded && !isCollapsed ? "bg-gray-50/50 dark:bg-gray-800/30 pb-2" : ""
                  )}>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        'group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 border',
                        isItemActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 shadow-sm'
                          : 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm hover:border-gray-100 dark:hover:border-gray-700',
                        isCollapsed ? 'justify-center' : 'justify-between'
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors duration-200 flex-shrink-0",
                          isItemActive 
                            ? "bg-white/50 dark:bg-black/20" 
                            : "bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700"
                        )}>
                          <Icon className={cn(
                            'w-5 h-5 transition-colors duration-200',
                            isItemActive ? item.color : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                          )} />
                        </div>
                        {!isCollapsed && (
                          <span className="ml-3 font-medium truncate">{item.name}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ChevronDownIcon className={cn(
                          'w-4 h-4 transition-transform duration-200 text-gray-400 flex-shrink-0 ml-2',
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        )} />
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && (
                      <div className={cn(
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        isExpanded ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                      )}>
                        <div className="space-y-1 px-2 relative">
                          {/* Vertical guide line */}
                          <div className="absolute left-[26px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                          
                          {item.children?.map((child: any) => (
                          <Link key={child.name} href={child.href}>
                            <div className={cn(
                              'group flex items-center pl-10 pr-3 py-2 text-xs rounded-lg transition-all duration-200 border border-transparent relative',
                              child.danger
                                ? 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100'
                                : 'hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:border-gray-100 dark:hover:border-gray-600',
                              isActive(child.href)
                                ? child.danger
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 shadow-sm font-medium'
                                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-gray-100 dark:border-gray-700 shadow-sm font-medium'
                                : child.danger
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-500 dark:text-gray-400'
                            )}>
                              {/* Connector dot */}
                              <div className={cn(
                                "absolute left-[24px] w-1.5 h-1.5 rounded-full ring-2 ring-white dark:ring-gray-900 transition-colors",
                                isActive(child.href) ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400"
                              )} />

                              {/* Special icon for History */}
                              {child.name === 'Histórico de Lançamentos' && (
                                <ClockIcon className={cn(
                                  'w-3.5 h-3.5 mr-2 flex-shrink-0',
                                  isActive(child.href)
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                )} />
                              )}
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <div className={cn(
                                  'truncate',
                                  child.danger && 'font-semibold'
                                )}>{child.name}</div>
                                {child.new && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
                                    Novo
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Network Status Indicator - Compacto */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-2">
              <NetworkStatusIndicator />
            </div>
            
            {/* Histórico de Lançamentos - Compacto */}
            <Link href="/relatorios-lotes">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-2.5 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      Histórico de Lançamentos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Ver operações
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default ModernSidebar
