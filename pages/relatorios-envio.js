import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  MapPinIcon,
  HeartIcon,
  BeakerIcon,
  BanknotesIcon,
  CubeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChartPieIcon,
  EyeIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { showWhatsAppModal } from '../utils/whatsappSummaryGenerator'

export default function RelatoriosEnvio() {
  const [destinatarios, setDestinatarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    cargo: '',
    recebe_email: true,
    recebe_whatsapp: false,
    agendamento_ativo: false,
    intervalo_dias: null,
    ultimos_relatorios: [],
    tipos_relatorios: []
  })
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [agendamentoPendente, setAgendamentoPendente] = useState(null)
  const [selectedReports, setSelectedReports] = useState({
    nf_entrada_saida: false,
    nascimentos: false,
    previsoes_parto: false,
    mortes: false,
    receptoras_chegaram: false,
    receptoras_faltam_parir: false,
    receptoras_faltam_diagnostico: false,
    resumo_nascimentos: false,
    resumo_por_sexo: false,
    resumo_por_pai: false,
    resumo_por_raca: false,
    resumo_por_mae: false,
    resumo_mortes: false,
    resumo_femeas_ia: false,
    resumo_te: false,
    resumo_gestacoes: false,
    resumo_financeiro: false,
    resumo_estoque_semen: false,
    resumo_vacinacoes: false,
    resumo_exames_andrologicos: false,
    coleta_fiv: false,
    calendario_reprodutivo: false,
    femeas_ia: false,
    animais_piquetes: false,
    transferencias_embrioes: false,
    gestacoes: false,
    exames_andrologicos: false,
    boletim_gado: false,
    movimentacoes_financeiras: false,
    estoque_semen: false,
    vacinacoes: false,
    genealogia: false,
    pesagens: false,
    resumo_pesagens: false,
    agenda_atividades: false
  })
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState(null)
  const [searchDestinatario, setSearchDestinatario] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [filtroAvancado, setFiltroAvancado] = useState({
    recebeEmail: 'todos',
    recebeWhatsApp: 'todos',
    agendamento: 'todos'
  })
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [progressoEnvio, setProgressoEnvio] = useState(0)
  const [estatisticas, setEstatisticas] = useState(null)
  const [viewMode, setViewMode] = useState('compact')
  const [autoUseDefaults, setAutoUseDefaults] = useState(true)
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState(null)

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('destinatariosViewMode') : null
      if (saved === 'compact' || saved === 'cards') setViewMode(saved)
    } catch (_) {}
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('destinatariosViewMode', viewMode)
    } catch (_) {}
  }, [viewMode])

  const tiposRelatorios = [
    // Categoria: Notas Fiscais
    { 
      key: 'nf_entrada_saida', 
      label: 'Relatório de NF de Entrada e Saída', 
      description: 'Notas fiscais de entrada e saída', 
      category: 'Notas Fiscais',
      icon: DocumentTextIcon,
      color: 'blue'
    },
    
    // Categoria: Reprodução
    { 
      key: 'femeas_ia', 
      label: 'Fêmeas que Fizeram IA', 
      description: 'Relatório de fêmeas inseminadas artificialmente', 
      category: 'Reprodução',
      icon: HeartIcon,
      color: 'pink'
    },
    { 
      key: 'transferencias_embrioes', 
      label: 'Transferências de Embriões', 
      description: 'Relatório completo de transferências de embriões (TE)', 
      category: 'Reprodução',
      icon: BeakerIcon,
      color: 'purple'
    },
    { 
      key: 'gestacoes', 
      label: 'Gestações', 
      description: 'Relatório de gestações ativas e finalizadas', 
      category: 'Reprodução',
      icon: UserGroupIcon,
      color: 'green'
    },
    { 
      key: 'nascimentos', 
      label: 'Nascimentos', 
      description: 'Relatório completo de nascimentos', 
      category: 'Reprodução',
      icon: CalendarIcon,
      color: 'yellow'
    },
    { 
      key: 'previsoes_parto', 
      label: 'Previsões de Parto (FIV vs IA)', 
      description: 'Resumo de receptoras e fêmeas para parir - FIV e IA', 
      category: 'Reprodução',
      icon: HeartIcon,
      color: 'emerald'
    },
    { 
      key: 'receptoras_chegaram', 
      label: 'Receptoras que Chegaram', 
      description: 'Receptoras recebidas', 
      category: 'Reprodução',
      icon: TruckIcon,
      color: 'indigo'
    },
    { 
      key: 'receptoras_faltam_parir', 
      label: 'Receptoras que Faltam Parir', 
      description: 'Receptoras aguardando parto', 
      category: 'Reprodução',
      icon: ClipboardDocumentListIcon,
      color: 'orange'
    },
    { 
      key: 'receptoras_faltam_diagnostico', 
      label: 'Receptoras que Faltam Diagnóstico', 
      description: 'Receptoras aguardando diagnóstico de gestação', 
      category: 'Reprodução',
      icon: ClipboardDocumentListIcon,
      color: 'amber'
    },
    { 
      key: 'exames_andrologicos', 
      label: 'Exames Andrológicos', 
      description: 'Relatório de exames andrológicos realizados', 
      category: 'Reprodução',
      icon: BeakerIcon,
      color: 'cyan'
    },
    { 
      key: 'coleta_fiv', 
      label: 'Coleta FIV', 
      description: 'Relatório de coletas de oócitos (FIV)', 
      category: 'Reprodução',
      icon: BeakerIcon,
      color: 'violet'
    },
    { 
      key: 'calendario_reprodutivo', 
      label: 'Calendário Reprodutivo', 
      description: 'Agenda de eventos reprodutivos (IA, TE, DG, partos)', 
      category: 'Reprodução',
      icon: CalendarIcon,
      color: 'rose'
    },
    
    // Categoria: Localização
    { 
      key: 'animais_piquetes', 
      label: 'Animais que Entraram nos Piquetes', 
      description: 'Relatório de movimentação de animais por piquete', 
      category: 'Localização',
      icon: MapPinIcon,
      color: 'emerald'
    },
    
    // Categoria: Sanidade
    { 
      key: 'mortes', 
      label: 'Mortes', 
      description: 'Relatório de mortes', 
      category: 'Sanidade',
      icon: XCircleIcon,
      color: 'red'
    },
    { 
      key: 'vacinacoes', 
      label: 'Vacinações e Tratamentos', 
      description: 'Relatório de vacinações e tratamentos veterinários', 
      category: 'Sanidade',
      icon: BeakerIcon,
      color: 'teal'
    },
    
    // Categoria: Financeiro
    { 
      key: 'movimentacoes_financeiras', 
      label: 'Movimentações Financeiras', 
      description: 'Relatório de receitas, despesas e saldo', 
      category: 'Financeiro',
      icon: BanknotesIcon,
      color: 'green'
    },
    
    // Categoria: Estoque
    { 
      key: 'estoque_semen', 
      label: 'Estoque de Sêmen', 
      description: 'Relatório de estoque e movimentação de sêmen', 
      category: 'Estoque',
      icon: CubeIcon,
      color: 'blue'
    },
    
    // Categoria: Gestão
    { 
      key: 'boletim_gado', 
      label: 'Boletim de Gado', 
      description: 'Relatório completo do rebanho por raça e idade', 
      category: 'Gestão',
      icon: ChartBarIcon,
      color: 'indigo'
    },
    { 
      key: 'genealogia', 
      label: 'Genealogia', 
      description: 'Relatório de árvore genealógica dos animais', 
      category: 'Gestão',
      icon: UserGroupIcon,
      color: 'purple'
    },
    
    // Categoria: Manejo
    { 
      key: 'pesagens', 
      label: 'Pesagens', 
      description: 'Relatório completo de pesagens dos animais', 
      category: 'Manejo',
      icon: ScaleIcon,
      color: 'amber'
    },
    { 
      key: 'resumo_pesagens', 
      label: 'Resumo de Pesagens', 
      description: 'Resumo detalhado com estatísticas por sexo, local e período', 
      category: 'Manejo',
      icon: ChartPieIcon,
      color: 'orange'
    },
    
    // Categoria: Resumos
    { 
      key: 'resumo_nascimentos', 
      label: 'Resumo de Nascimentos', 
      description: 'Resumo geral de nascimentos', 
      category: 'Resumos',
      icon: ChartBarIcon,
      color: 'yellow'
    },
    { 
      key: 'resumo_pesagens', 
      label: 'Resumo de Pesagens', 
      description: 'Resumo por sexo e por piquete', 
      category: 'Resumos',
      icon: ChartBarIcon,
      color: 'green'
    },
    { 
      key: 'resumo_por_sexo', 
      label: 'Resumo por Sexo', 
      description: 'Nascimentos por sexo', 
      category: 'Resumos',
      icon: ChartBarIcon,
      color: 'pink'
    },
    { 
      key: 'resumo_por_pai', 
      label: 'Resumo por Pai', 
      description: 'Nascimentos agrupados por pai (TOP 5)', 
      category: 'Resumos',
      icon: ChartBarIcon,
      color: 'blue'
    },
    { 
      key: 'resumo_por_raca', 
      label: 'Resumo por Raça', 
      description: 'Nascimentos agrupados por raça', 
      category: 'Resumos',
      icon: ChartPieIcon,
      color: 'purple'
    },
    { 
      key: 'resumo_por_mae', 
      label: 'Resumo por Mãe', 
      description: 'Nascimentos agrupados por mãe (TOP 5)', 
      category: 'Resumos',
      icon: UserGroupIcon,
      color: 'pink'
    },
    { 
      key: 'resumo_mortes', 
      label: 'Resumo de Mortes', 
      description: 'Resumo de óbitos no período', 
      category: 'Resumos',
      icon: XCircleIcon,
      color: 'red'
    },
    { 
      key: 'resumo_femeas_ia', 
      label: 'Resumo de Fêmeas IA', 
      description: 'Estatísticas de inseminação artificial', 
      category: 'Resumos',
      icon: HeartIcon,
      color: 'pink'
    },
    { 
      key: 'resumo_te', 
      label: 'Resumo de TE', 
      description: 'Resumo de transferências de embriões', 
      category: 'Resumos',
      icon: BeakerIcon,
      color: 'purple'
    },
    { 
      key: 'resumo_gestacoes', 
      label: 'Resumo de Gestações', 
      description: 'Estatísticas de gestações', 
      category: 'Resumos',
      icon: UserGroupIcon,
      color: 'green'
    },
    { 
      key: 'resumo_financeiro', 
      label: 'Resumo Financeiro', 
      description: 'Receitas, despesas e saldo', 
      category: 'Resumos',
      icon: BanknotesIcon,
      color: 'green'
    },
    { 
      key: 'resumo_estoque_semen', 
      label: 'Resumo Estoque Sêmen', 
      description: 'Entradas e saídas de sêmen', 
      category: 'Resumos',
      icon: CubeIcon,
      color: 'blue'
    },
    { 
      key: 'resumo_vacinacoes', 
      label: 'Resumo de Vacinações', 
      description: 'Vacinações e tratamentos realizados', 
      category: 'Resumos',
      icon: BeakerIcon,
      color: 'teal'
    },
    { 
      key: 'resumo_exames_andrologicos', 
      label: 'Resumo Exames Andrológicos', 
      description: 'Estatísticas de exames andrológicos', 
      category: 'Resumos',
      icon: BeakerIcon,
      color: 'cyan'
    },
    { 
      key: 'agenda_atividades', 
      label: 'Agenda de Atividades', 
      description: 'DGT (330-640 dias) em Excel', 
      category: 'Resumos',
      icon: CalendarIcon,
      color: 'amber'
    }
  ]

  useEffect(() => {
    loadDestinatarios()
    checkAgendamentosPendentes()
    
    // Verificar agendamentos a cada 5 minutos
    const interval = setInterval(() => {
      checkAgendamentosPendentes()
    }, 5 * 60 * 1000) // 5 minutos
    
    return () => clearInterval(interval)
  }, [])

  const loadDestinatarios = async () => {
    try {
      const res = await fetch('/api/relatorios-envio/destinatarios')
      if (res.ok) {
        const data = await res.json()
        // A API retorna { success: true, data: [...] } ou diretamente o array
        const destinatariosArray = Array.isArray(data) ? data : (data.data || [])
        setDestinatarios(Array.isArray(destinatariosArray) ? destinatariosArray : [])
      } else {
        setDestinatarios([])
      }
    } catch (error) {
      console.error('Erro ao carregar destinatários:', error)
      setDestinatarios([])
    }
  }

  const checkAgendamentosPendentes = async () => {
    try {
      const res = await fetch('/api/relatorios-envio/agendamentos-pendentes')
      if (res.ok) {
        const data = await res.json()
        const agendamentos = Array.isArray(data) ? data : (data.data || [])
        
        if (agendamentos.length > 0) {
          // Mostrar modal para o primeiro agendamento pendente
          const primeiroAgendamento = agendamentos[0]
          setAgendamentoPendente(primeiroAgendamento)
          setShowAgendamentoModal(true)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar agendamentos pendentes:', error)
    }
  }

  // Função para validar formulário
  const validateForm = () => {
    const errors = {}
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido'
    }
    
    if (!formData.cargo.trim()) {
      errors.cargo = 'Cargo é obrigatório'
    }
    
    if (formData.recebe_whatsapp && formData.whatsapp && !/^[\d\s\(\)\-\+]+$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      errors.whatsapp = 'WhatsApp deve conter apenas números e caracteres de formatação'
    }
    
    if (formData.agendamento_ativo && (!formData.intervalo_dias || formData.intervalo_dias < 1)) {
      errors.intervalo_dias = 'Intervalo deve ser de pelo menos 1 dia'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Formatar WhatsApp
  const formatWhatsApp = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    return value
  }

  // Mostrar toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const getDefaultsByCargo = (cargo) => {
    const c = (cargo || '').toLowerCase()
    if (!c) return []
    if (c.includes('contador') || c.includes('finance')) {
      return ['nf_entrada_saida', 'movimentacoes_financeiras']
    }
    if (c.includes('gerente') || c.includes('pecuária') || c.includes('pecuaria')) {
      return ['calendario_reprodutivo', 'coleta_fiv', 'gestacoes', 'exames_andrologicos']
    }
    if (c.includes('adm') || c.includes('administr')) {
      return ['nf_entrada_saida', 'estoque_semen', 'animais_piquetes']
    }
    return []
  }

  const updateSelectedReportsFromRecipients = (ids) => {
    if (!autoUseDefaults) return
    const selected = destinatarios.filter(d => ids.includes(d.id))
    const union = new Set()
    selected.forEach(d => {
      if (Array.isArray(d.tipos_relatorios)) {
        d.tipos_relatorios.forEach(k => union.add(k))
      }
    })
    const next = { ...selectedReports }
    Object.keys(next).forEach(k => { next[k] = union.has(k) })
    setSelectedReports(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error')
      return
    }
    
    setLoading(true)
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id 
        ? `/api/relatorios-envio/destinatarios/${formData.id}`
        : '/api/relatorios-envio/destinatarios'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await loadDestinatarios()
        setShowForm(false)
        setFormErrors({})
        setFormData({
          nome: '',
          email: '',
          whatsapp: '',
          cargo: '',
          recebe_email: true,
          recebe_whatsapp: false,
          agendamento_ativo: false,
          intervalo_dias: null,
          ultimos_relatorios: []
        })
        showToast(formData.id ? 'Destinatário atualizado com sucesso!' : 'Destinatário cadastrado com sucesso!', 'success')
      } else {
        const error = await res.json()
        showToast(`Erro: ${error.message || 'Erro ao salvar destinatário'}`, 'error')
      }
    } catch (error) {
      console.error('Erro ao salvar destinatário:', error)
      alert('Erro ao salvar destinatário')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este destinatário?')) return

    try {
      const res = await fetch(`/api/relatorios-envio/destinatarios/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadDestinatarios()
        showToast('Destinatário excluído com sucesso!', 'success')
      } else {
        showToast('Erro ao excluir destinatário', 'error')
      }
    } catch (error) {
      console.error('Erro ao excluir destinatário:', error)
      showToast('Erro ao excluir destinatário', 'error')
    }
  }

  const handleEdit = (destinatario) => {
    setFormData({
      ...destinatario,
      agendamento_ativo: destinatario.agendamento_ativo || false,
      intervalo_dias: destinatario.intervalo_dias || null,
      ultimos_relatorios: destinatario.ultimos_relatorios || [],
      tipos_relatorios: Array.isArray(destinatario.tipos_relatorios) ? destinatario.tipos_relatorios : []
    })
    setShowForm(true)
  }

  const handleDuplicate = (destinatario) => {
    setFormData({
      nome: `${destinatario.nome} (Cópia)`,
      email: '',
      whatsapp: destinatario.whatsapp || '',
      cargo: destinatario.cargo,
      recebe_email: destinatario.recebe_email,
      recebe_whatsapp: destinatario.recebe_whatsapp,
      agendamento_ativo: false,
      intervalo_dias: null,
      ultimos_relatorios: []
    })
    setShowForm(true)
    showToast('Destinatário duplicado. Complete o email e salve.', 'success')
  }

  const calcularEstatisticas = () => {
    const totalDestinatarios = destinatarios.length
    const comAgendamento = destinatarios.filter(d => d.agendamento_ativo).length
    const recebemEmail = destinatarios.filter(d => d.recebe_email).length
    const recebemWhatsApp = destinatarios.filter(d => d.recebe_whatsapp).length
    const relatoriosSelecionados = Object.keys(selectedReports).filter(key => selectedReports[key]).length
    const destinatariosSelecionados = selectedDestinatarios.length
    
    return {
      totalDestinatarios,
      comAgendamento,
      recebemEmail,
      recebemWhatsApp,
      relatoriosSelecionados,
      destinatariosSelecionados
    }
  }

  const [selectedDestinatarios, setSelectedDestinatarios] = useState([])

  useEffect(() => {
    if (destinatarios && selectedReports && selectedDestinatarios) {
      const stats = calcularEstatisticas()
      setEstatisticas(stats)
    }
  }, [destinatarios, selectedReports, selectedDestinatarios])

  const validateDados = async () => {
    const selected = Object.keys(selectedReports).filter(key => selectedReports[key])
    if (selected.length === 0) {
      showToast('⚠️ Selecione pelo menos um relatório para validar', 'error')
      return
    }
    if (new Date(period.startDate) > new Date(period.endDate)) {
      showToast('⚠️ A data inicial não pode ser maior que a data final', 'error')
      return
    }
    setValidating(true)
    setValidationResults(null)
    try {
      const startDate = period.startDate
      const endDate = period.endDate
      const results = []
      const byKey = k => tiposRelatorios.find(t => t.key === k)
      if (selected.includes('nf_entrada_saida') || selected.includes('receptoras_chegaram')) {
        const r = await fetch(`/api/notas-fiscais?startDate=${startDate}&endDate=${endDate}`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        const entradas = rows.filter(x => (x.tipo || '').toLowerCase() === 'entrada')
        const saidas = rows.filter(x => (x.tipo || '').toLowerCase() === 'saida')
        const entradasValor = entradas.reduce((s, x) => s + (parseFloat(x.valor_total || x.valor || 0) || 0), 0)
        const saidasValor = saidas.reduce((s, x) => s + (parseFloat(x.valor_total || x.valor || 0) || 0), 0)
        if (selected.includes('nf_entrada_saida')) {
          results.push({ key: 'nf_entrada_saida', label: byKey('nf_entrada_saida')?.label || 'NF Entrada/Saída', info: { entradas: entradas.length, saidas: saidas.length, entradasValor, saidasValor } })
        }
        if (selected.includes('receptoras_chegaram')) {
          const recs = entradas.reduce((s, x) => s + (parseInt(x.quantidade_animais || x.qtd_animais || 0) || 0), 0)
          results.push({ key: 'receptoras_chegaram', label: byKey('receptoras_chegaram')?.label || 'Receptoras que Chegaram', info: { receptoras: recs } })
        }
      }
      if (selected.includes('nascimentos') || selected.includes('resumo_nascimentos') || selected.includes('resumo_por_sexo') || selected.includes('resumo_por_raca') || selected.includes('resumo_por_mae')) {
        const r = await fetch(`/api/animais`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        const births = rows.filter(x => {
          const dt = x.data_nascimento || x.dataNascimento
          if (!dt) return false
          const v = new Date(dt).toISOString().split('T')[0]
          return v >= startDate && v <= endDate
        })
        if (selected.includes('nascimentos')) {
          results.push({ key: 'nascimentos', label: byKey('nascimentos')?.label || 'Nascimentos', info: { total: births.length } })
        }
        if (selected.includes('resumo_por_sexo')) {
          const m = births.filter(b => (b.sexo || '').toLowerCase() === 'macho').length
          const f = births.filter(b => (b.sexo || '').toLowerCase() === 'fêmea' || (b.sexo || '').toLowerCase() === 'femea').length
          results.push({ key: 'resumo_por_sexo', label: byKey('resumo_por_sexo')?.label || 'Resumo por Sexo', info: { machos: m, femeas: f } })
        }
        if (selected.includes('resumo_por_raca')) {
          const map = {}
          births.forEach(b => { const raca = b.raca || 'Sem raça'; map[raca] = (map[raca] || 0) + 1 })
          results.push({ key: 'resumo_por_raca', label: byKey('resumo_por_raca')?.label || 'Resumo por Raça', info: map })
        }
        if (selected.includes('resumo_por_mae')) {
          const map = {}
          births.forEach(b => { const mae = b.mae || b.mae_id || 'Sem mãe'; map[mae] = (map[mae] || 0) + 1 })
          results.push({ key: 'resumo_por_mae', label: byKey('resumo_por_mae')?.label || 'Resumo por Mãe', info: map })
        }
        if (selected.includes('resumo_nascimentos')) {
          results.push({ key: 'resumo_nascimentos', label: byKey('resumo_nascimentos')?.label || 'Resumo de Nascimentos', info: { total: births.length } })
        }
      }
      if (selected.includes('mortes') || selected.includes('resumo_mortes')) {
        const r = await fetch(`/api/mortes?startDate=${startDate}&endDate=${endDate}`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        results.push({ key: 'mortes', label: byKey('mortes')?.label || 'Mortes', info: { total: rows.length } })
      }
      if (selected.includes('femeas_ia') || selected.includes('resumo_femeas_ia')) {
        const r = await fetch(`/api/inseminacoes?startDate=${startDate}&endDate=${endDate}`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        const femeas = rows.filter(x => {
          const sexo = (x.sexo || x.animal_sexo || '').toLowerCase()
          return sexo === 'fêmea' || sexo === 'femea'
        })
        const prenhas = femeas.filter(x => (x.status_gestacao || '').toLowerCase() === 'prenha').length
        const vazias = femeas.filter(x => (x.status_gestacao || '').toLowerCase() === 'vazia').length
        const pendentes = femeas.filter(x => {
          const s = (x.status_gestacao || '').toLowerCase()
          return s === '' || s === 'aguardando dg' || s === 'pendente'
        }).length
        results.push({ key: 'femeas_ia', label: byKey('femeas_ia')?.label || 'Fêmeas IA', info: { total: femeas.length, prenhas, vazias, pendentes } })
      }
      if (selected.includes('transferencias_embrioes')) {
        const r = await fetch(`/api/transferencias-embrioes?startDate=${startDate}&endDate=${endDate}`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        results.push({ key: 'transferencias_embrioes', label: byKey('transferencias_embrioes')?.label || 'Transferências de Embriões', info: { total: rows.length } })
      }
      if (selected.includes('gestacoes')) {
        const r = await fetch(`/api/gestacoes?startDate=${startDate}&endDate=${endDate}`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        results.push({ key: 'gestacoes', label: byKey('gestacoes')?.label || 'Gestações', info: { total: rows.length } })
      }
      if (selected.includes('exames_andrologicos') || selected.includes('resumo_exames_andrologicos')) {
        const r = await fetch(`/api/reproducao/exames-andrologicos`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        const periodo = rows.filter(x => {
          const dt = x.data_exame
          if (!dt) return false
          const v = new Date(dt).toISOString().split('T')[0]
          return v >= startDate && v <= endDate
        })
        const aptos = periodo.filter(x => (x.resultado || '').toLowerCase() === 'apto').length
        const inaptos = periodo.filter(x => (x.resultado || '').toLowerCase() === 'inapto').length
        results.push({ key: 'exames_andrologicos', label: byKey('exames_andrologicos')?.label || 'Exames Andrológicos', info: { total: periodo.length, aptos, inaptos } })
      }
      if (selected.includes('estoque_semen') || selected.includes('resumo_estoque_semen')) {
        const r = await fetch(`/api/estoque-semen`)
        const d = await r.json()
        const rows = Array.isArray(d) ? d : d.data || []
        results.push({ key: 'estoque_semen', label: byKey('estoque_semen')?.label || 'Estoque de Sêmen', info: { total: rows.length } })
      }
      if (selected.includes('pesagens') || selected.includes('resumo_pesagens')) {
        const r = await fetch(`/api/pesagens`)
        const d = await r.json()
        const pesagens = Array.isArray(d) ? d : d.pesagens || d.data || []
        
        // Filtrar por período
        const pesagensPeriodo = pesagens.filter(p => {
          const dataPesagem = p.data || ''
          return dataPesagem >= startDate && dataPesagem <= endDate
        })
        
        // Estatísticas
        const machos = pesagensPeriodo.filter(p => p.animal_sexo === 'Macho')
        const femeas = pesagensPeriodo.filter(p => p.animal_sexo === 'Fêmea')
        const pesos = pesagensPeriodo.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
        const pesoMedio = pesos.length > 0 ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : 0
        
        // Agrupar por local (última pesagem por animal + normalizar PIQUETE X → PROJETO X)
        const porAnimalUltimaVal = {}
        pesagensPeriodo.forEach(p => {
          const aid = p.animal_id ?? p.animal ?? `f${(p.peso || 0)}-${p.data || ''}`
          const d = p.data || ''
          const prev = porAnimalUltimaVal[aid]
          if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.created_at || '') > (prev.created_at || ''))) {
            porAnimalUltimaVal[aid] = p
          }
        })
        const porLocal = {}
        Object.values(porAnimalUltimaVal).forEach(p => {
          let local = (p.observacoes || '').match(/(PIQUETE\s*\d+|PROJETO\s*[\dA-Za-z\-]+|CONFINA\w*)/i)?.[0] || 'Não informado'
          if (/^PIQUETE\s+\d+$/i.test(local)) local = local.replace(/^PIQUETE\s+/i, 'PROJETO ')
          if (!porLocal[local]) porLocal[local] = { qtd: 0, machos: 0, femeas: 0 }
          porLocal[local].qtd++
          if (p.animal_sexo === 'Macho') porLocal[local].machos++
          if (p.animal_sexo === 'Fêmea') porLocal[local].femeas++
        })
        
        if (selected.includes('pesagens')) {
          results.push({ 
            key: 'pesagens', 
            label: byKey('pesagens')?.label || 'Pesagens', 
            info: { 
              total: pesagensPeriodo.length,
              machos: machos.length,
              femeas: femeas.length,
              pesoMedio
            } 
          })
        }
        
        if (selected.includes('resumo_pesagens')) {
          results.push({ 
            key: 'resumo_pesagens', 
            label: byKey('resumo_pesagens')?.label || 'Resumo de Pesagens', 
            info: { 
              total: pesagensPeriodo.length,
              machos: machos.length,
              femeas: femeas.length,
              pesoMedio,
              locais: Object.keys(porLocal).length,
              porLocal
            } 
          })
        }
      }
      setValidationResults(results)
      showToast('✅ Validação concluída', 'success')
    } catch (e) {
      showToast('Erro ao validar dados', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleSend = async () => {
    const selected = Object.keys(selectedReports).filter(key => selectedReports[key])
    if (selected.length === 0) {
      showToast('⚠️ Selecione pelo menos um relatório para enviar', 'error')
      return
    }

    if (selectedDestinatarios.length === 0) {
      showToast('⚠️ Selecione pelo menos um destinatário marcando o checkbox ao lado do nome', 'error')
      return
    }
    
    // Validar período
    if (new Date(period.startDate) > new Date(period.endDate)) {
      showToast('⚠️ A data inicial não pode ser maior que a data final', 'error')
      return
    }
    
    // Mostrar modal de confirmação
    setShowConfirmModal(true)
  }

  const confirmSend = async () => {
    setShowConfirmModal(false)
    const selected = Object.keys(selectedReports).filter(key => selectedReports[key])
    
    // Verificar se os destinatários selecionados estão configurados para receber
    const destinatariosSelecionados = destinatarios.filter(d => selectedDestinatarios.includes(d.id))
    const temEmail = destinatariosSelecionados.some(d => d.recebe_email && d.email)
    const temWhatsApp = destinatariosSelecionados.some(d => d.recebe_whatsapp && d.whatsapp)
    
    if (!temEmail && !temWhatsApp) {
      showToast('⚠️ Os destinatários selecionados não estão configurados para receber email ou WhatsApp', 'error')
      return
    }
    
    if (temEmail && !destinatariosSelecionados.every(d => !d.recebe_email || d.email)) {
      showToast('⚠️ Alguns destinatários estão marcados para receber email mas não têm email cadastrado', 'error')
      return
    }
    
    if (temWhatsApp && !destinatariosSelecionados.every(d => !d.recebe_whatsapp || d.whatsapp)) {
      showToast('⚠️ Alguns destinatários estão marcados para receber WhatsApp mas não têm WhatsApp cadastrado', 'error')
      return
    }
    
    console.log('📤 Iniciando envio:', { relatorios: selected, destinatarios: selectedDestinatarios.length })

    setSending(true)
    setSendResults(null)
    setProgressoEnvio(0)

    // Simular progresso
    const progressInterval = setInterval(() => {
      setProgressoEnvio(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 500)

    try {
      const res = await fetch('/api/relatorios-envio/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarios: selectedDestinatarios,
          relatorios: selected,
          period
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Verificar se houve envios bem-sucedidos
        const stats = data.stats || {}
        const results = data.results || []
        
        let message = data.message || 'Envio concluído com sucesso!'
        
        // Adicionar detalhes se houver resultados
        if (results.length > 0) {
          const emailsEnviados = results.filter(r => r.email === 'enviado').length
          const whatsappsEnviados = results.filter(r => r.whatsapp === 'enviado' || r.whatsapp === 'enviado (sem gráfico)').length
          const emailsErro = results.filter(r => r.email && r.email.startsWith('erro')).length
          const whatsappsErro = results.filter(r => r.whatsapp && r.whatsapp.startsWith('erro')).length
          
          if (emailsEnviados === 0 && whatsappsEnviados === 0) {
            message = '⚠️ Nenhum relatório foi enviado!\n\n'
            message += 'Possíveis causas:\n'
            message += '• SMTP não configurado (adicione SMTP_HOST, SMTP_USER, SMTP_PASS no arquivo .env)\n'
            message += '• WhatsApp não configurado (configure Evolution API ou Twilio)\n'
            message += '• Destinatários não estão marcados para receber email/WhatsApp\n'
            message += '• Email/WhatsApp não informados nos destinatários\n'
            message += '• Nenhum relatório completo foi gerado\n\n'
            message += 'Verifique os detalhes abaixo para cada destinatário.'
          } else {
            message += `\n\n📊 Resumo:\n`
            if (emailsEnviados > 0) message += `✅ ${emailsEnviados} email(s) enviado(s)\n`
            if (whatsappsEnviados > 0) message += `✅ ${whatsappsEnviados} WhatsApp(s) enviado(s)\n`
            if (emailsErro > 0) message += `❌ ${emailsErro} erro(s) no envio de email\n`
            if (whatsappsErro > 0) message += `❌ ${whatsappsErro} erro(s) no envio de WhatsApp\n`
          }
        }
        
        setSendResults({ 
          success: stats.emailsEnviados > 0 || stats.whatsappsEnviados > 0,
          message: message,
          details: results,
          stats: stats
        })
        
        // Finalizar progresso
        setProgressoEnvio(100)
        setTimeout(() => {
          setProgressoEnvio(0)
        }, 1000)
        
        // Recarregar destinatários para atualizar informações de agendamento
        await loadDestinatarios()
        
        // Mostrar toast de sucesso
        if (stats.emailsEnviados > 0 || stats.whatsappsEnviados > 0) {
          showToast(`✅ ${stats.emailsEnviados || 0} email(s) e ${stats.whatsappsEnviados || 0} WhatsApp(s) enviado(s) com sucesso!`, 'success')
        }
        
        // Mostrar modal com o resumo retornado pelo backend
        console.log('📱 Processando resposta do backend...')
        console.log('   Dados recebidos:', Object.keys(data))
        console.log('   Summary presente:', !!data.summary)
        console.log('   ChartImage presente:', !!data.chartImage)
        
        // Verificar se WhatsApp foi enviado automaticamente
        const whatsappEnviado = stats.whatsappsEnviados > 0
        const whatsappErro = stats.whatsappsComErro > 0
        
        // Sempre tentar exibir o modal se houver resumo ou gráfico
        const temResumo = data.summary && data.summary !== 'Nenhum resumo disponível para os relatórios selecionados.'
        const temGrafico = !!data.chartImage
        
        if (temResumo || temGrafico) {
          console.log('📱 Exibindo modal com resumo do WhatsApp')
          console.log('📝 Resumo:', temResumo ? `${data.summary.length} caracteres` : 'Não disponível')
          console.log('📊 Gráfico:', temGrafico ? 'Disponível' : 'Não disponível')
          
          let mensagemModal = data.summary || 'Resumo não disponível'
          
          // Adicionar mensagem sobre o status do envio automático
          if (whatsappEnviado) {
            mensagemModal = `✅ *WhatsApp enviado automaticamente!*\n\n` +
                          `O resumo e gráfico foram enviados para seu WhatsApp.\n\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                          mensagemModal
          } else if (whatsappErro) {
            mensagemModal = `⚠️ *WhatsApp não foi enviado automaticamente*\n\n` +
                          `Motivo: ${results.find(r => r.whatsapp && r.whatsapp.startsWith('erro'))?.whatsapp || 'Erro desconhecido'}\n\n` +
                          `📋 Você pode copiar o resumo abaixo e enviar manualmente:\n\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                          mensagemModal
          } else {
            mensagemModal = `📱 *RESUMO GERADO*\n\n` +
                          `O resumo está disponível abaixo para visualização.\n\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                          mensagemModal
          }
          
          // Aguardar um pouco para garantir que a UI está atualizada
          setTimeout(() => {
            try {
              showWhatsAppModal(mensagemModal, data.chartImage, whatsappEnviado, destinatariosSelecionados)
              console.log('✅ Modal exibido com sucesso')
            } catch (error) {
              console.error('❌ Erro ao exibir modal:', error)
              // Fallback: mostrar resumo em alerta
              alert('📱 RESUMO PARA WHATSAPP:\n\n' + mensagemModal.substring(0, 1000) + '\n\n... (resumo completo no console)')
              console.log('📝 Resumo completo:', mensagemModal)
            }
          }, 500)
        } else {
          console.warn('⚠️ Nenhum resumo ou gráfico retornado pelo backend')
          console.warn('   Dados completos:', JSON.stringify(data, null, 2))
          
          // Mesmo sem resumo, tentar gerar um básico se houver relatórios selecionados
          if (selected.length > 0) {
            const inicio = new Date(period.startDate).toLocaleDateString('pt-BR')
            const fim = new Date(period.endDate).toLocaleDateString('pt-BR')
            const resumoBasico = `📧 Relatórios completos enviados por email.\n\n` +
                                `📊 *RESUMO DE RELATÓRIOS*\n\n` +
                                `Período: ${inicio} a ${fim}\n\n` +
                                `Relatórios selecionados:\n` +
                                selected.map(r => `• ${r}`).join('\n') +
                                `\n_Beef-Sync - Sistema de Gestão Pecuária_`
            
            setTimeout(() => {
              showWhatsAppModal(resumoBasico, null, false, destinatariosSelecionados)
            }, 500)
          }
        }
      } else {
        throw new Error(data.message || 'Erro ao enviar relatórios')
      }
    } catch (error) {
      console.error('Erro ao enviar:', error)
      setSendResults({ success: false, message: 'Erro ao enviar: ' + error.message })
      showToast('Erro ao enviar relatórios: ' + error.message, 'error')
      setProgressoEnvio(0)
    } finally {
      setSending(false)
    }
  }

  // Gerar preview do resumo
  const gerarPreviewResumo = () => {
    const selected = Object.keys(selectedReports).filter(key => selectedReports[key])
    const destinatariosSelecionados = destinatarios.filter(d => selectedDestinatarios.includes(d.id))
    
    let preview = `📊 *PREVIEW DO ENVIO DE RELATÓRIOS*\n`
    preview += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    preview += `📅 *Período:*\n`
    preview += `${new Date(period.startDate).toLocaleDateString('pt-BR')} até ${new Date(period.endDate).toLocaleDateString('pt-BR')}\n\n`
    preview += `👥 *Destinatários (${destinatariosSelecionados.length}):*\n`
    destinatariosSelecionados.forEach((d, idx) => {
      preview += `${idx + 1}. ${d.nome}`
      if (d.recebe_email) preview += ` 📧`
      if (d.recebe_whatsapp) preview += ` 💬`
      preview += `\n`
    })
    preview += `\n📋 *Relatórios Selecionados (${selected.length}):*\n`
    tiposRelatorios.filter(r => selectedReports[r.key]).forEach((r, idx) => {
      preview += `${idx + 1}. ${r.label}\n`
    })
    preview += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    preview += `_Beef-Sync - Sistema de Gestão Pecuária_`
    
    return preview
  }

  return (
    <React.Fragment>
      <Head>
        <title>Envio de Relatórios - Beef-Sync</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Envio de Relatórios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Configure destinatários e envie relatórios por email e WhatsApp
            </p>

            {/* Estatísticas Rápidas */}
            {estatisticas && estatisticas.totalDestinatarios > 0 && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {estatisticas.totalDestinatarios}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Agendados</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {estatisticas.comAgendamento}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Relatórios</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {estatisticas.relatoriosSelecionados}
                  </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-1">
                    <EnvelopeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selecionados</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {estatisticas.destinatariosSelecionados}
                  </div>
                </div>
              </div>
            )}

            {/* Seção de Destinatários */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Destinatários {destinatarios.length > 0 && `(${destinatarios.length})`}
                </h2>
                <div className="flex gap-2">
                  {destinatarios.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedDestinatarios.length === destinatarios.length) {
                            setSelectedDestinatarios([])
                            showToast('Todos os destinatários desmarcados', 'success')
                            updateSelectedReportsFromRecipients([])
                          } else {
                            const ids = destinatarios.map(d => d.id)
                            setSelectedDestinatarios(ids)
                            updateSelectedReportsFromRecipients(ids)
                            showToast('Todos os destinatários selecionados', 'success')
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <CheckIcon className="w-4 h-4" />
                        {selectedDestinatarios.length === destinatarios.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                      <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('compact')}
                          className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md ${
                            viewMode === 'compact'
                              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          title="Visualizar em lista compacta"
                        >
                          <ListBulletIcon className="w-4 h-4" />
                          Lista
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md ${
                            viewMode === 'cards'
                              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          title="Visualizar em cards"
                        >
                          <Squares2X2Icon className="w-4 h-4" />
                          Cards
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={autoUseDefaults}
                          onChange={(e) => setAutoUseDefaults(e.target.checked)}
                          className="w-4 h-4"
                        />
                        Usar preferências dos destinatários
                      </label>
                      <button
                        onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                          showFiltrosAvancados
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <FunnelIcon className="w-4 h-4" />
                        Filtros
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setFormData({
                        nome: '',
                        email: '',
                        whatsapp: '',
                        cargo: '',
                        recebe_email: true,
                        recebe_whatsapp: false,
                        agendamento_ativo: false,
                        intervalo_dias: null,
                        ultimos_relatorios: []
                      })
                      setShowForm(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Adicionar Destinatário
                  </button>
                </div>
              </div>

              {/* Filtros Avançados */}
              {showFiltrosAvancados && destinatarios.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recebe Email
                      </label>
                      <select
                        value={filtroAvancado.recebeEmail}
                        onChange={(e) => setFiltroAvancado({ ...filtroAvancado, recebeEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="todos">Todos</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recebe WhatsApp
                      </label>
                      <select
                        value={filtroAvancado.recebeWhatsApp}
                        onChange={(e) => setFiltroAvancado({ ...filtroAvancado, recebeWhatsApp: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="todos">Todos</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Agendamento
                      </label>
                      <select
                        value={filtroAvancado.agendamento}
                        onChange={(e) => setFiltroAvancado({ ...filtroAvancado, agendamento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="todos">Todos</option>
                        <option value="ativo">Com Agendamento</option>
                        <option value="inativo">Sem Agendamento</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFiltroAvancado({
                        recebeEmail: 'todos',
                        recebeWhatsApp: 'todos',
                        agendamento: 'todos'
                      })
                      setSearchDestinatario('')
                    }}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}

              {/* Formulário de Destinatário */}
              {showForm && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nome}
                          onChange={(e) => {
                            setFormData({ ...formData, nome: e.target.value })
                            if (formErrors.nome) {
                              setFormErrors({ ...formErrors, nome: null })
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            formErrors.nome 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {formErrors.nome && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.nome}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value })
                            if (formErrors.email) {
                              setFormErrors({ ...formErrors, email: null })
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            formErrors.email 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          placeholder="(00) 00000-0000"
                          value={formData.whatsapp}
                          onChange={(e) => {
                            const formatted = formatWhatsApp(e.target.value)
                            setFormData({ ...formData, whatsapp: formatted })
                            if (formErrors.whatsapp) {
                              setFormErrors({ ...formErrors, whatsapp: null })
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            formErrors.whatsapp 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="(00) 00000-0000"
                        />
                        {formErrors.whatsapp && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.whatsapp}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cargo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cargo}
                          onChange={(e) => {
                            const cargo = e.target.value
                            const defaults = (Array.isArray(formData.tipos_relatorios) && formData.tipos_relatorios.length > 0)
                              ? formData.tipos_relatorios
                              : getDefaultsByCargo(cargo)
                            setFormData({ ...formData, cargo, tipos_relatorios: defaults })
                            if (formErrors.cargo) {
                              setFormErrors({ ...formErrors, cargo: null })
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            formErrors.cargo 
                              ? 'border-red-500 dark:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {formErrors.cargo && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.cargo}</p>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Preferências de Relatórios (padrão do destinatário)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tiposRelatorios.map(t => (
                          <label key={t.key} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="checkbox"
                              checked={Array.isArray(formData.tipos_relatorios) ? formData.tipos_relatorios.includes(t.key) : false}
                              onChange={(e) => {
                                const current = Array.isArray(formData.tipos_relatorios) ? [...formData.tipos_relatorios] : []
                                if (e.target.checked) {
                                  if (!current.includes(t.key)) current.push(t.key)
                                } else {
                                  const idx = current.indexOf(t.key)
                                  if (idx >= 0) current.splice(idx, 1)
                                }
                                setFormData({ ...formData, tipos_relatorios: current })
                              }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{t.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Estas preferências serão usadas como padrão ao selecionar este destinatário e nos envios automáticos.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.recebe_email}
                          onChange={(e) => setFormData({ ...formData, recebe_email: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Recebe por Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.recebe_whatsapp}
                          onChange={(e) => setFormData({ ...formData, recebe_whatsapp: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Recebe por WhatsApp</span>
                      </label>
                    </div>

                    {/* Configuração de Agendamento */}
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-4">
                      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Agendamento Automático
                      </h3>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={formData.agendamento_ativo}
                          onChange={(e) => setFormData({ ...formData, agendamento_ativo: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Ativar envio automático de relatórios</span>
                      </label>
                      {formData.agendamento_ativo && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Enviar relatórios a cada quantos dias?
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              required={formData.agendamento_ativo}
                              value={formData.intervalo_dias || ''}
                              onChange={(e) => {
                                setFormData({ ...formData, intervalo_dias: e.target.value ? parseInt(e.target.value) : null })
                                if (formErrors.intervalo_dias) {
                                  setFormErrors({ ...formErrors, intervalo_dias: null })
                                }
                              }}
                              placeholder="Ex: 7 (semanal), 15 (quinzenal), 30 (mensal)"
                              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                formErrors.intervalo_dias 
                                  ? 'border-red-500 dark:border-red-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                            {formErrors.intervalo_dias && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.intervalo_dias}</p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              O sistema enviará automaticamente os mesmos relatórios do último envio
                            </p>
                          </div>
                          {formData.ultimo_envio && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>Último envio: {new Date(formData.ultimo_envio).toLocaleDateString('pt-BR')}</p>
                              {formData.proximo_envio && (
                                <p>Próximo envio: {new Date(formData.proximo_envio).toLocaleDateString('pt-BR')}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setFormData({
                            nome: '',
                            email: '',
                            whatsapp: '',
                            cargo: '',
                            recebe_email: true,
                            recebe_whatsapp: false,
                            agendamento_ativo: false,
                            intervalo_dias: null,
                            ultimos_relatorios: []
                          })
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Busca de Destinatários */}
              {destinatarios.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar destinatários por nome, email ou cargo..."
                      value={searchDestinatario}
                      onChange={(e) => setSearchDestinatario(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchDestinatario && (
                      <button
                        onClick={() => setSearchDestinatario('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {destinatarios.filter(dest => {
                    if (searchDestinatario) {
                      const search = searchDestinatario.toLowerCase()
                      const matchSearch = dest.nome.toLowerCase().includes(search) ||
                                         dest.email.toLowerCase().includes(search) ||
                                         dest.cargo.toLowerCase().includes(search)
                      if (!matchSearch) return false
                    }
                    if (filtroAvancado.recebeEmail === 'sim' && !dest.recebe_email) return false
                    if (filtroAvancado.recebeEmail === 'nao' && dest.recebe_email) return false
                    if (filtroAvancado.recebeWhatsApp === 'sim' && !dest.recebe_whatsapp) return false
                    if (filtroAvancado.recebeWhatsApp === 'nao' && dest.recebe_whatsapp) return false
                    if (filtroAvancado.agendamento === 'ativo' && !dest.agendamento_ativo) return false
                    if (filtroAvancado.agendamento === 'inativo' && dest.agendamento_ativo) return false
                    return true
                  }).length === 0 && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      Nenhum destinatário encontrado com os filtros aplicados
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Destinatários */}
              {destinatarios.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="font-semibold mb-2">⚠️ Nenhum destinatário cadastrado</p>
                  <p className="text-sm">Clique em "Adicionar Destinatário" para cadastrar destinatários que receberão os relatórios.</p>
                </div>
              )}
              {viewMode === 'compact' ? (
                <div className="space-y-1">
                  {destinatarios
                    .filter(dest => {
                      if (searchDestinatario) {
                        const search = searchDestinatario.toLowerCase()
                        const matchSearch = dest.nome.toLowerCase().includes(search) ||
                                           dest.email.toLowerCase().includes(search) ||
                                           dest.cargo.toLowerCase().includes(search)
                        if (!matchSearch) return false
                      }
                      if (filtroAvancado.recebeEmail === 'sim' && !dest.recebe_email) return false
                      if (filtroAvancado.recebeEmail === 'nao' && dest.recebe_email) return false
                      if (filtroAvancado.recebeWhatsApp === 'sim' && !dest.recebe_whatsapp) return false
                      if (filtroAvancado.recebeWhatsApp === 'nao' && dest.recebe_whatsapp) return false
                      if (filtroAvancado.agendamento === 'ativo' && !dest.agendamento_ativo) return false
                      if (filtroAvancado.agendamento === 'inativo' && dest.agendamento_ativo) return false
                      return true
                    })
                    .map((dest) => (
                      <div
                        key={dest.id}
                        className={`flex items-center justify-between p-2 rounded-md border transition-colors text-sm ${
                          selectedDestinatarios.includes(dest.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedDestinatarios.includes(dest.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const ids = [...selectedDestinatarios, dest.id]
                                setSelectedDestinatarios(ids)
                                updateSelectedReportsFromRecipients(ids)
                              } else {
                                const ids = selectedDestinatarios.filter(id => id !== dest.id)
                                setSelectedDestinatarios(ids)
                                updateSelectedReportsFromRecipients(ids)
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white leading-tight">
                              {dest.nome}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {dest.email} • {dest.cargo}
                            </div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {dest.recebe_email ? (
                                <span className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                  📧 Email {dest.email ? '✅' : '❌'}
                                </span>
                              ) : (
                                <span className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                                  📧 Email desabilitado
                                </span>
                              )}
                              {dest.recebe_whatsapp ? (
                                <span className="text-[11px] bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                                  💬 WhatsApp {dest.whatsapp ? '✅' : '❌'}
                                </span>
                              ) : (
                                <span className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                                  💬 WhatsApp desabilitado
                                </span>
                              )}
                              {dest.agendamento_ativo && (
                                <span className="text-[11px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  Agendado: {dest.intervalo_dias} dias
                                  {dest.proximo_envio && (
                                    <span className="text-[11px]">
                                      (Próximo: {new Date(dest.proximo_envio).toLocaleDateString('pt-BR')})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDuplicate(dest)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 rounded"
                            title="Duplicar"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(dest)}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(dest.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {destinatarios
                    .filter(dest => {
                      if (searchDestinatario) {
                        const search = searchDestinatario.toLowerCase()
                        const matchSearch = dest.nome.toLowerCase().includes(search) ||
                                           dest.email.toLowerCase().includes(search) ||
                                           dest.cargo.toLowerCase().includes(search)
                        if (!matchSearch) return false
                      }
                      if (filtroAvancado.recebeEmail === 'sim' && !dest.recebe_email) return false
                      if (filtroAvancado.recebeEmail === 'nao' && dest.recebe_email) return false
                      if (filtroAvancado.recebeWhatsApp === 'sim' && !dest.recebe_whatsapp) return false
                      if (filtroAvancado.recebeWhatsApp === 'nao' && dest.recebe_whatsapp) return false
                      if (filtroAvancado.agendamento === 'ativo' && !dest.agendamento_ativo) return false
                      if (filtroAvancado.agendamento === 'inativo' && dest.agendamento_ativo) return false
                      return true
                    })
                    .map((dest) => (
                      <div
                        key={dest.id}
                        className={`rounded-lg border transition-colors p-3 ${
                          selectedDestinatarios.includes(dest.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedDestinatarios.includes(dest.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const ids = [...selectedDestinatarios, dest.id]
                                  setSelectedDestinatarios(ids)
                                  updateSelectedReportsFromRecipients(ids)
                                } else {
                                  const ids = selectedDestinatarios.filter(id => id !== dest.id)
                                  setSelectedDestinatarios(ids)
                                  updateSelectedReportsFromRecipients(ids)
                                }
                              }}
                              className="w-4 h-4 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {dest.nome}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {dest.email} • {dest.cargo}
                              </div>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {dest.recebe_email ? (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    📧 Email {dest.email ? '✅' : '❌'}
                                  </span>
                                ) : (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                                    📧 Email desabilitado
                                  </span>
                                )}
                                {dest.recebe_whatsapp ? (
                                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    💬 WhatsApp {dest.whatsapp ? '✅' : '❌'}
                                  </span>
                                ) : (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                                    💬 WhatsApp desabilitado
                                  </span>
                                )}
                                {dest.agendamento_ativo && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    Agendado: {dest.intervalo_dias} dias
                                    {dest.proximo_envio && (
                                      <span className="text-xs">
                                        (Próximo: {new Date(dest.proximo_envio).toLocaleDateString('pt-BR')})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDuplicate(dest)}
                              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 rounded"
                              title="Duplicar destinatário"
                            >
                              <DocumentDuplicateIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(dest)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                              title="Editar destinatário"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(dest.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                              title="Excluir destinatário"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Seção de Seleção de Relatórios */}
            <div className="mb-8" data-section="relatorios">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Selecionar Relatórios
              </h2>
              
              {/* Período */}
              <div className="mb-4">
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={period.endDate}
                      onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                {/* Presets de Período */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const hoje = new Date()
                      setPeriod({
                        startDate: hoje.toISOString().split('T')[0],
                        endDate: hoje.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hoje = new Date()
                      const semanaAtras = new Date(hoje)
                      semanaAtras.setDate(hoje.getDate() - 7)
                      setPeriod({
                        startDate: semanaAtras.toISOString().split('T')[0],
                        endDate: hoje.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hoje = new Date()
                      const mesAtras = new Date(hoje)
                      mesAtras.setMonth(hoje.getMonth() - 1)
                      setPeriod({
                        startDate: mesAtras.toISOString().split('T')[0],
                        endDate: hoje.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Último mês
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hoje = new Date()
                      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
                      setPeriod({
                        startDate: inicioMes.toISOString().split('T')[0],
                        endDate: hoje.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Este mês
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hoje = new Date()
                      const trimestreAtras = new Date(hoje)
                      trimestreAtras.setMonth(hoje.getMonth() - 3)
                      setPeriod({
                        startDate: trimestreAtras.toISOString().split('T')[0],
                        endDate: hoje.toISOString().split('T')[0]
                      })
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Últimos 3 meses
                  </button>
                </div>
              </div>

              {/* Checkboxes de Relatórios - Organizados por Categoria */}
              {['Notas Fiscais', 'Reprodução', 'Localização', 'Sanidade', 'Financeiro', 'Estoque', 'Gestão', 'Resumos'].map((categoria) => {
                const relatoriosCategoria = tiposRelatorios.filter(r => r.category === categoria)
                if (relatoriosCategoria.length === 0) return null
                
                const categoriaColors = {
                  'Notas Fiscais': 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
                  'Reprodução': 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/10',
                  'Localização': 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10',
                  'Sanidade': 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
                  'Financeiro': 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
                  'Estoque': 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
                  'Gestão': 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10',
                  'Resumos': 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                }
                
                return (
                  <div key={categoria} className="mb-6">
                    <div className={`p-3 rounded-lg mb-3 ${categoriaColors[categoria] || 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          {categoria}
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({relatoriosCategoria.length} relatório{relatoriosCategoria.length !== 1 ? 's' : ''})
                          </span>
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const novosRelatorios = { ...selectedReports }
                              relatoriosCategoria.forEach(rel => {
                                novosRelatorios[rel.key] = true
                              })
                              setSelectedReports(novosRelatorios)
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                          >
                            Selecionar Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const novosRelatorios = { ...selectedReports }
                              relatoriosCategoria.forEach(rel => {
                                novosRelatorios[rel.key] = false
                              })
                              setSelectedReports(novosRelatorios)
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Desmarcar Todos
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatoriosCategoria.map((tipo) => {
                        const IconComponent = tipo.icon || DocumentTextIcon
                        const colorClasses = {
                          blue: 'text-blue-600 dark:text-blue-400',
                          pink: 'text-pink-600 dark:text-pink-400',
                          purple: 'text-purple-600 dark:text-purple-400',
                          green: 'text-green-600 dark:text-green-400',
                          yellow: 'text-yellow-600 dark:text-yellow-400',
                          indigo: 'text-indigo-600 dark:text-indigo-400',
                          orange: 'text-orange-600 dark:text-orange-400',
                          amber: 'text-amber-600 dark:text-amber-400',
                          cyan: 'text-cyan-600 dark:text-cyan-400',
                          emerald: 'text-emerald-600 dark:text-emerald-400',
                          red: 'text-red-600 dark:text-red-400',
                          teal: 'text-teal-600 dark:text-teal-400',
                          violet: 'text-violet-600 dark:text-violet-400',
                          rose: 'text-rose-600 dark:text-rose-400'
                        }
                        const iconColor = colorClasses[tipo.color] || 'text-gray-600 dark:text-gray-400'
                        
                        const getSelectedStyles = (color) => {
                          const colorMap = {
                            blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                            pink: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
                            purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                            green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                            yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                            indigo: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
                            orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
                            amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
                            cyan: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
                            emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                            red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                            teal: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20',
                            violet: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20',
                            rose: 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                          }
                          return colorMap[color] || 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        }
                        
                        return (
                          <label
                            key={tipo.key}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all group ${
                              selectedReports[tipo.key]
                                ? `${getSelectedStyles(tipo.color)} shadow-md`
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedReports[tipo.key]}
                              onChange={(e) => setSelectedReports({
                                ...selectedReports,
                                [tipo.key]: e.target.checked
                              })}
                              className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className={`flex-shrink-0 mt-0.5 ${iconColor} group-hover:scale-110 transition-transform`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                {tipo.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {tipo.description}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botão de Enviar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(selectedReports).filter(key => selectedReports[key]).length > 0 && (
                    <span>
                      {Object.keys(selectedReports).filter(key => selectedReports[key]).length} relatório(s) selecionado(s) • 
                      {selectedDestinatarios.length} destinatário(s) selecionado(s)
                    </span>
                  )}
                </div>
                {Object.keys(selectedReports).filter(key => selectedReports[key]).length > 0 && selectedDestinatarios.length > 0 && (
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Preview
                  </button>
                )}
                {Object.keys(selectedReports).filter(key => selectedReports[key]).length > 0 && (
                  <button
                    onClick={validateDados}
                    disabled={validating}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    {validating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Validando...
                      </>
                    ) : (
                      <>
                        <ChartBarIcon className="w-4 h-4" />
                        Validar Dados
                      </>
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={sending || destinatarios.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Enviar Relatórios
                  </>
                )}
              </button>
            </div>

            {/* Barra de Progresso */}
            {sending && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enviando relatórios...
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progressoEnvio}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressoEnvio}%` }}
                  />
                </div>
              </div>
            )}

            {validationResults && validationResults.length > 0 && (
              <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                  Validação dos dados do período {period.startDate} a {period.endDate}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validationResults.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded border p-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.label}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {typeof r.info === 'object' ? JSON.stringify(r.info) : r.info}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados do Envio - exibição ativa */}
            {sendResults && (
              <div className={`mt-6 p-4 rounded-lg ${
                sendResults.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-start gap-2">
                  {sendResults.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      sendResults.success 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {sendResults.success ? 'Envio Concluído!' : 'Atenção'}
                    </div>
                    <div className={`text-sm mt-1 whitespace-pre-line ${
                      sendResults.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {sendResults.message || JSON.stringify(sendResults)}
                    </div>
                    
                    {sendResults.details && sendResults.details.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Detalhes por destinatário:
                        </div>
                        {sendResults.details.map((result, idx) => (
                          <div key={idx} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                            <div className="font-medium">{result.destinatario}</div>
                            <div className="mt-1 space-y-1">
                              {result.email && (
                                <div className={result.email === 'enviado' ? 'text-green-600' : result.email.startsWith('erro') ? 'text-red-600' : 'text-gray-500'}>
                                  📧 Email: {result.email}
                                </div>
                              )}
                              {result.whatsapp && (
                                <div className={result.whatsapp === 'enviado' || result.whatsapp === 'enviado (sem gráfico)' ? 'text-green-600' : result.whatsapp.startsWith('erro') ? 'text-red-600' : 'text-gray-500'}>
                                  💬 WhatsApp: {result.whatsapp}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Confirmação de Envio */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              Confirmar Envio
            </h2>
            
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Destinatários:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {destinatarios.filter(d => selectedDestinatarios.includes(d.id)).map(d => d.nome).join(', ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Período:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(period.startDate).toLocaleDateString('pt-BR')} até {new Date(period.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Relatórios selecionados:</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside max-h-40 overflow-y-auto">
                  {tiposRelatorios.filter(r => selectedReports[r.key]).map(r => (
                    <li key={r.key}>{r.label}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSend}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <EyeIcon className="w-6 h-6" />
                Preview do Envio
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📅 Período</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {new Date(period.startDate).toLocaleDateString('pt-BR')} até {new Date(period.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  👥 Destinatários ({selectedDestinatarios.length})
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {destinatarios.filter(d => selectedDestinatarios.includes(d.id)).map(d => (
                    <li key={d.id}>
                      {d.nome}
                      {d.recebe_email && <span className="ml-2">📧</span>}
                      {d.recebe_whatsapp && <span className="ml-1">💬</span>}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📋 Relatórios Selecionados ({Object.keys(selectedReports).filter(key => selectedReports[key]).length})
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {tiposRelatorios.filter(r => selectedReports[r.key]).map(r => (
                    <li key={r.key}>{r.label}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  Resumo para WhatsApp
                </h3>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border">
                  {gerarPreviewResumo()}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  handleSend()
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Confirmação de Agendamento */}
      {showAgendamentoModal && agendamentoPendente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Agendamento de Relatórios
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>{agendamentoPendente.nome}</strong> está agendado para receber relatórios hoje.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Último envio:</strong> {agendamentoPendente.ultimo_envio 
                    ? new Date(agendamentoPendente.ultimo_envio).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Intervalo:</strong> A cada {agendamentoPendente.intervalo_dias} dias
                </p>
                {agendamentoPendente.ultimos_relatorios && agendamentoPendente.ultimos_relatorios.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Últimos relatórios enviados:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {agendamentoPendente.ultimos_relatorios.map((rel, idx) => (
                        <li key={idx}>{rel}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Enviar com os mesmos relatórios
                  if (agendamentoPendente.ultimos_relatorios && agendamentoPendente.ultimos_relatorios.length > 0) {
                    // Calcular período: do último envio até hoje
                    let startDate
                    if (agendamentoPendente.ultimo_envio) {
                      const ultimaData = new Date(agendamentoPendente.ultimo_envio)
                      // Começar do dia seguinte ao último envio
                      ultimaData.setDate(ultimaData.getDate() + 1)
                      startDate = ultimaData.toISOString().split('T')[0]
                    } else {
                      // Se nunca foi enviado, usar início do mês atual
                      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
                    }
                    
                    const period = {
                      startDate: startDate,
                      endDate: new Date().toISOString().split('T')[0]
                    }
                    
                    setSelectedDestinatarios([agendamentoPendente.id])
                    const relatoriosSelecionados = {}
                    agendamentoPendente.ultimos_relatorios.forEach(rel => {
                      relatoriosSelecionados[rel] = true
                    })
                    setSelectedReports(relatoriosSelecionados)
                    setPeriod(period)
                    
                    setShowAgendamentoModal(false)
                    setAgendamentoPendente(null)
                    
                    // Aguardar um pouco para garantir que os estados foram atualizados
                    setTimeout(() => {
                      handleSend()
                    }, 500)
                  } else {
                    // Fallback: usar preferências padrão do destinatário (tipos_relatorios)
                    const preferidos = Array.isArray(agendamentoPendente.tipos_relatorios) ? agendamentoPendente.tipos_relatorios : []
                    if (preferidos.length > 0) {
                      const period = {
                        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      }
                      setSelectedDestinatarios([agendamentoPendente.id])
                      const relatoriosSelecionados = {}
                      preferidos.forEach(rel => { relatoriosSelecionados[rel] = true })
                      setSelectedReports(relatoriosSelecionados)
                      setPeriod(period)
                      setShowAgendamentoModal(false)
                      setAgendamentoPendente(null)
                      setTimeout(() => {
                        handleSend()
                      }, 500)
                    } else {
                      alert('Não há relatórios anteriores. Configure manualmente.')
                      setShowAgendamentoModal(false)
                      setAgendamentoPendente(null)
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Enviar Mesmos Relatórios
              </button>
              <button
                onClick={() => {
                  // Selecionar o destinatário e permitir alterar relatórios manualmente
                  setSelectedDestinatarios([agendamentoPendente.id])
                  setShowAgendamentoModal(false)
                  setAgendamentoPendente(null)
                  // Scroll para a seção de relatórios
                  setTimeout(() => {
                    document.querySelector('[data-section="relatorios"]')?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Alterar e Enviar
              </button>
              <button
                onClick={async () => {
                  // Adiar para amanhã
                  try {
                    const res = await fetch(`/api/relatorios-envio/destinatarios/${agendamentoPendente.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...agendamentoPendente,
                        proximo_envio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                      })
                    })
                    if (res.ok) {
                      await loadDestinatarios()
                      setShowAgendamentoModal(false)
                      setAgendamentoPendente(null)
                    }
                  } catch (error) {
                    console.error('Erro ao adiar agendamento:', error)
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Adiar
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}
