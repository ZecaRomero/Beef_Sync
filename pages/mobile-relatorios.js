/**
 * Relatórios visíveis no mobile.
 * Gráficos, KPI cards, animações e visual aprimorado.
 */
import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  HeartIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  SparklesIcon,
  LightBulbIcon,
  BanknotesIcon,
  StarIcon,
  ClockIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid'

if (typeof window !== 'undefined') {
  ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)
}

function formatDate(d) {
  if (!d) return '-'
  // Strings YYYY-MM-DD são interpretadas como UTC pelo JS, causando dia errado no Brasil.
  // Parse como data local para exibir corretamente.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.split(/[-T]/).map(Number)
    if (y && m && day) {
      const dt = new Date(y, m - 1, day)
      return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR')
    }
  }
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('pt-BR')
}

const CORES_PIQUETE = [
  'rgba(245, 158, 11, 0.85)',   // amber
  'rgba(34, 197, 94, 0.85)',    // green
  'rgba(59, 130, 246, 0.85)',   // blue
  'rgba(168, 85, 247, 0.85)',   // purple
  'rgba(236, 72, 153, 0.85)',   // pink
  'rgba(20, 184, 166, 0.85)',   // teal
  'rgba(249, 115, 22, 0.85)',   // orange
]

const ICONE_POR_CATEGORIA = {
  Manejo: ScaleIcon,
  Reprodução: HeartIcon,
  Sanidade: UserGroupIcon,
  Estoque: DocumentTextIcon,
  Localização: MapPinIcon,
  Financeiro: CurrencyDollarIcon,
  Gestão: ChartBarIcon,
  Documentos: DocumentTextIcon,
  Outros: ChartBarIcon
}

const DESCRICOES_ACESSO_RAPIDO = {
  resumo_geral: 'Resumo completo do rebanho',
  previsoes_parto: 'Datas previstas de partos',
  calendario_reprodutivo: 'Eventos e cronograma',
  ranking_pmgz: 'Top animais por desempenho'
}

export default function MobileRelatorios() {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState('home')
  const [showMenu, setShowMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTipo, setSelectedTipo] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('charts') // 'charts' | 'table'
  const [period, setPeriod] = useState(() => {
    const today = new Date()
    const start = new Date(today)
    start.setFullYear(start.getFullYear() - 10)
    const end = new Date(today)
    end.setFullYear(end.getFullYear() + 2)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  })
  const [sexoFilter, setSexoFilter] = useState('todos')
  const [tipoFiltroCalendario, setTipoFiltroCalendario] = useState('')
  const [tipoFiltroRanking, setTipoFiltroRanking] = useState('')
  const [serieFilter, setSerieFilter] = useState('')
  const [sharing, setSharing] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [recentIds, setRecentIds] = useState(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('mobile-relatorios-recent') : null
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [searchReports, setSearchReports] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [favorites, setFavorites] = useState(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('mobile-relatorios-favorites') : null
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [collapsedCats, setCollapsedCats] = useState({})
  const [toast, setToast] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [cardFilterModal, setCardFilterModal] = useState({ open: false, title: '', filter: null, dataType: 'animais' })
  const [cardAnimalsList, setCardAnimalsList] = useState([])
  const [cardListLoading, setCardListLoading] = useState(false)
  const [racaModalOpen, setRacaModalOpen] = useState(false)
  const [racaSelecionada, setRacaSelecionada] = useState(null)
  const [tourosRaca, setTourosRaca] = useState([])
  const [racaEmbriaoModalOpen, setRacaEmbriaoModalOpen] = useState(false)
  const [racaEmbriaoSelecionada, setRacaEmbriaoSelecionada] = useState(null)
  const [acasalamentosRaca, setAcasalamentosRaca] = useState([])

  useEffect(() => {
    fetch('/api/mobile-reports')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setConfig(d.data)
          // Debug: verificar configuração
          console.log('📅 Config recebida:', d.data)
          console.log('📅 Relatórios habilitados:', d.data.enabled)
          console.log('📅 Calendário está habilitado?', d.data.enabled?.includes('calendario_reprodutivo'))
        } else if (d.enabled && d.allTypes) {
          setConfig({ enabled: d.enabled, allTypes: d.allTypes })
          console.log('📅 Config alternativa:', { enabled: d.enabled, allTypes: d.allTypes })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Inicializar tema
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedDarkMode === 'true' || (!savedDarkMode && prefersDark)
    setIsDarkMode(shouldBeDark)
  }, [])

  // Carregar dashboard (resumo geral) na entrada
  useEffect(() => {
    if (!config?.enabled?.includes('resumo_geral')) return
    const params = new URLSearchParams({
      tipo: 'resumo_geral',
      startDate: period.startDate,
      endDate: period.endDate
    })
    fetch(`/api/mobile-reports?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setDashboardData(d.data)
      })
      .catch(() => {})
  }, [config?.enabled])

  useEffect(() => {
    if (!selectedTipo) {
      setReportData(null)
      setSearchQuery('')
      return
    }
    setLoadingData(true)
    const params = new URLSearchParams({
      tipo: selectedTipo,
      startDate: period.startDate,
      endDate: period.endDate
    })
    if ((selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados') && serieFilter) {
      params.set('serie', serieFilter)
    }
    fetch(`/api/mobile-reports?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setReportData(d.data)
          saveRecent(selectedTipo)
        }
        else setReportData(null)
      })
      .catch(() => setReportData(null))
      .finally(() => setLoadingData(false))
  }, [selectedTipo, period.startDate, period.endDate, serieFilter])

  useEffect(() => {
    if (selectedTipo === 'calendario_reprodutivo') {
      setViewMode('calendar')
    }
  }, [selectedTipo])

  // Ao navegar o calendário, buscar dados do mês exibido
  useEffect(() => {
    if (selectedTipo === 'calendario_reprodutivo' && viewMode === 'calendar' && calendarMonth) {
      const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
      const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      setPeriod(prev => {
        if (prev.startDate === startStr && prev.endDate === endStr) return prev
        return { startDate: startStr, endDate: endStr }
      })
    }
  }, [selectedTipo, viewMode, calendarMonth?.getFullYear?.(), calendarMonth?.getMonth?.()])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!cardFilterModal.open || !cardFilterModal.filter) return
    
    // Se está mostrando a lista de piquetes (resumo)
    if (cardFilterModal.dataType === 'piquetes') {
      const rows = reportData?.data || []
      setCardAnimalsList(rows.filter(r => r.Piquete != null && !r._resumo))
      setCardListLoading(false)
      return
    }
    
    // piquete_animais: lista já foi setada no click handler (originalRow.animais)
    if (cardFilterModal.dataType === 'piquete_animais') {
      setCardListLoading(false)
      return
    }
    
    setCardListLoading(true)
    
    // Se o filtro tem piquete, usar a API de localizações para buscar animais
    if (cardFilterModal.filter.piquete) {
      const piqueteNome = cardFilterModal.filter.piquete
      console.log('Buscando animais do piquete:', piqueteNome)
      fetch(`/api/localizacoes?piquete=${encodeURIComponent(piqueteNome)}&atual=true`)
        .then(r => r.json())
        .then(d => {
          console.log('Dados recebidos da API de localizações:', d)
          if (d.success && Array.isArray(d.data)) {
            // Transformar dados de localização em formato de animal
            const animais = d.data.map(loc => {
              const animal = {
                id: loc.animal_id,
                serie: loc.serie || '',
                rg: loc.rg || '',
                sexo: loc.sexo || '',
                raca: loc.raca || '',
                identificacao: `${loc.serie || ''}-${loc.rg || ''}`,
                piquete: loc.piquete || ''
              }
              console.log('Animal transformado:', animal)
              return animal
            })
            console.log('Total de animais encontrados:', animais.length)
            setCardAnimalsList(animais)
          } else {
            console.log('Nenhum animal encontrado ou resposta inválida')
            setCardAnimalsList([])
          }
        })
        .catch(err => {
          console.error('Erro ao buscar animais do piquete:', err)
          setCardAnimalsList([])
        })
        .finally(() => setCardListLoading(false))
      return
    }
    
    // Caso contrário, usar a API de animais normal
    const params = new URLSearchParams(cardFilterModal.filter)
    fetch(`/api/animals?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) setCardAnimalsList(d.data)
        else setCardAnimalsList([])
      })
      .catch(() => setCardAnimalsList([]))
      .finally(() => setCardListLoading(false))
  }, [cardFilterModal.open, cardFilterModal.filter, cardFilterModal.dataType, reportData?.data])

  const handleCardClick = useCallback((k, v) => {
    const key = String(k).toLowerCase()
    if (/machos?\b/i.test(k)) {
      setCardFilterModal({ open: true, title: `Machos (${v})`, filter: { sexo: 'Macho' }, dataType: 'animais' })
      return
    }
    if (/fêmeas?|femeas?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Fêmeas (${v})`, filter: { sexo: 'Fêmea' }, dataType: 'animais' })
      return
    }
    if (/animais únicos?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Animais únicos (${v})`, filter: {}, dataType: 'animais' })
      return
    }
    if (/total de pesagens?/i.test(k)) {
      setSelectedTipo('pesagens')
      setViewMode('table')
      return
    }
    if (/piquetes?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Piquetes (${v})`, filter: {}, dataType: 'piquetes' })
      return
    }
    if (/peso médio|peso medio/i.test(k)) return
    setCardFilterModal({ open: true, title: k, filter: {}, dataType: 'animais' })
  }, [])

  const enabledReports = config?.enabled || []
  const allTypes = config?.allTypes || []
  const tiposHabilitados = allTypes.filter(t => enabledReports.includes(t.key))
  const ACESSO_RAPIDO_KEYS = ['resumo_geral', 'previsoes_parto', 'calendario_reprodutivo', 'ranking_pmgz']
  const porCategoria = tiposHabilitados.reduce((acc, t) => {
    const cat = t.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})
  const categoriasComRelatorios = Object.entries(porCategoria)
    .map(([cat, tipos]) => ({ cat, tipos }))
    .filter(({ tipos }) => tipos.length > 0)
  const matchSearch = (label, key) => {
    if (!searchReports.trim()) return true
    const q = searchReports.trim().toLowerCase()
    return (label || '').toLowerCase().includes(q) || (key || '').toLowerCase().includes(q)
  }
  const showRanking = enabledReports.includes('ranking_animais_avaliados') || enabledReports.includes('ranking_pmgz')
  const ehRanking = selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados'
  const LABELS_RANKING = {
    ranking: 'Ranking',
    posicao: 'Posição',
    animal: 'Animal',
    valor: 'Valor',
    raca: 'Raça',
    sexo: 'Sexo',
    piquete: 'Piquete',
    iABCZ: 'iABCZ',
    deca: 'DECA',
    iqg: 'IQG',
    pt_iqg: 'Pt IQG'
  }

  const filteredData = reportData?.data?.filter(d => {
    if (d._resumo) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    return Object.values(d).some(v => v != null && String(v).toLowerCase().includes(q))
  }) || []
  const hasSexo = (reportData?.data || []).some(r => r.sexo != null)
  const filteredBySexo = filteredData.filter(r => {
    if (!hasSexo || sexoFilter === 'todos') return true
    const s = String(r.sexo || '').toUpperCase()
    if (sexoFilter === 'M') return s.startsWith('M')
    if (sexoFilter === 'F') return s.startsWith('F')
    return true
  })

  const filteredCalendario = selectedTipo === 'calendario_reprodutivo' && tipoFiltroCalendario
    ? filteredBySexo.filter(r => (r.tipo || '') === tipoFiltroCalendario)
    : filteredBySexo

  const saveRecent = useCallback((id) => {
    if (!id) return
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 5)
      try { localStorage.setItem('mobile-relatorios-recent', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const toggleFavorite = useCallback((id) => {
    if (!id) return
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('mobile-relatorios-favorites', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const toggleCollapse = useCallback((cat) => {
    setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }, [])

  // Dados para gráficos (resumo_pesagens)
  const dadosGraficoPiquete = reportData?.data?.filter(d => !d._resumo) || []
  const chartBarPiquete = selectedTipo === 'resumo_pesagens' && dadosGraficoPiquete.length > 0 ? {
    labels: dadosGraficoPiquete.map(r => (r.Piquete || r.piquete || '').replace(/PROJETO\s*/i, 'P')),
    datasets: [{
      label: 'Animais',
      data: dadosGraficoPiquete.map(r => r.Animais ?? r.animais ?? 0),
      backgroundColor: CORES_PIQUETE.slice(0, dadosGraficoPiquete.length),
      borderColor: CORES_PIQUETE.map(c => c.replace('0.85', '1')),
      borderWidth: 1
    }]
  } : null

  const chartPesoPiquete = selectedTipo === 'resumo_pesagens' && dadosGraficoPiquete.length > 0 ? {
    labels: dadosGraficoPiquete.map(r => (r.Piquete || r.piquete || '').replace(/PROJETO\s*/i, 'P')),
    datasets: [{
      label: 'Média Peso (kg)',
      data: dadosGraficoPiquete.map(r => {
        const v = r['Média Peso (kg)'] ?? r.mediaPeso
        return typeof v === 'number' ? v : (parseFloat(String(v).replace(',', '.')) || 0)
      }),
      backgroundColor: 'rgba(245, 158, 11, 0.7)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1
    }]
  } : null

  const resumo = reportData?.resumo || {}
  let machos = Number(resumo.Machos ?? resumo.machos ?? 0)
  let femeas = Number(resumo.Fêmeas ?? resumo.femeas ?? 0)
  if (selectedTipo === 'nascimentos' && (machos === 0 && femeas === 0) && filteredData.length > 0) {
    machos = filteredData.filter(r => (r.sexo || '').toUpperCase().startsWith('M')).length
    femeas = filteredData.filter(r => (r.sexo || '').toUpperCase().startsWith('F')).length
  }
  const chartSexo = (selectedTipo === 'resumo_pesagens' || selectedTipo === 'nascimentos') && (machos > 0 || femeas > 0) ? {
    labels: ['Machos', 'Fêmeas'],
    datasets: [{
      data: [machos, femeas],
      backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(236, 72, 153, 0.85)'],
      borderColor: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)'],
      borderWidth: 2
    }]
  } : null

  const prenhas = Number(resumo.prenhas ?? 0)
  const totalIA = Number(resumo.total ?? 0)
  const naoPrenhas = totalIA - prenhas
  const chartPrenhez = selectedTipo === 'resumo_femeas_ia' && totalIA > 0 ? {
    labels: ['Prenhas', 'Não prenhas'],
    datasets: [{
      data: [prenhas, naoPrenhas],
      backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(239, 68, 68, 0.85)'],
      borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 2
    }]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  }

  // Gráfico de pesagens por data (evolução temporal)
  const pesagensPorData = selectedTipo === 'pesagens' && filteredData.length > 0 ? (() => {
    const porData = {}
    filteredData.forEach(r => {
      const d = r.data || ''
      if (d) porData[d] = (porData[d] || 0) + 1
    })
    const entries = Object.entries(porData).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return null
    return {
      labels: entries.map(([d]) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
      datasets: [{
        label: 'Pesagens',
        data: entries.map(([, c]) => c),
        fill: true,
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.3
      }]
    }
  })() : null

  // Gráfico de inseminações por touro
  const inseminacoesPorTouro = (selectedTipo === 'inseminacoes' || selectedTipo === 'femeas_ia') && filteredData.length > 0 ? (() => {
    const porTouro = {}
    filteredData.forEach(r => {
      const t = (r.touro || 'Não informado').trim() || 'Não informado'
      porTouro[t] = (porTouro[t] || 0) + 1
    })
    const entries = Object.entries(porTouro).sort(([, a], [, b]) => b - a).slice(0, 8)
    if (entries.length === 0) return null
    return {
      labels: entries.map(([t]) => t.length > 15 ? t.slice(0, 12) + '...' : t),
      datasets: [{
        label: 'Inseminações',
        data: entries.map(([, c]) => c),
        backgroundColor: CORES_PIQUETE.slice(0, entries.length),
        borderWidth: 1
      }]
    }
  })() : null

  // Gráfico de estoque de sêmen por touro
  const estoquePorTouro = selectedTipo === 'estoque_semen' && filteredData.length > 0 ? (() => {
    const porTouro = {}
    filteredData.forEach(r => {
      const t = (r.touro || 'Não informado').trim() || 'Não informado'
      const q = Number(r.quantidade) || 0
      porTouro[t] = (porTouro[t] || 0) + q
    })
    const entries = Object.entries(porTouro).sort(([, a], [, b]) => b - a).slice(0, 8)
    if (entries.length === 0) return null
    return {
      labels: entries.map(([t]) => t.length > 15 ? t.slice(0, 12) + '...' : t),
      datasets: [{
        label: 'Doses',
        data: entries.map(([, c]) => c),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1
      }]
    }
  })() : null

  // Detalhes do estoque de sêmen por touro
  const detalhesEstoqueSemen = selectedTipo === 'estoque_semen' && filteredData.length > 0 ? (() => {
    const porTouro = {}
    filteredData.forEach(r => {
      const t = (r.touro || 'Não informado').trim() || 'Não informado'
      const q = Number(r.quantidade) || 0
      const raca = (r.raca || 'Não informada').trim() || 'Não informada'
      if (!porTouro[t]) {
        porTouro[t] = { total: 0, registros: 0, raca: raca }
      }
      porTouro[t].total += q
      porTouro[t].registros += 1
    })
    return Object.entries(porTouro)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([touro, dados]) => ({
        touro,
        doses: dados.total,
        registros: dados.registros,
        raca: dados.raca
      }))
  })() : null

  // Estoque agrupado por raça
  const estoquePorRaca = selectedTipo === 'estoque_semen' && filteredData.length > 0 ? (() => {
    const porRaca = {}
    filteredData.forEach(r => {
      const raca = (r.raca || 'Não informada').trim() || 'Não informada'
      const q = Number(r.quantidade) || 0
      if (!porRaca[raca]) {
        porRaca[raca] = { total: 0, touros: new Set() }
      }
      porRaca[raca].total += q
      if (r.touro) porRaca[raca].touros.add(r.touro.trim())
    })
    return Object.entries(porRaca)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([raca, dados]) => ({
        raca,
        doses: dados.total,
        touros: dados.touros.size
      }))
  })() : null

  // ========== EMBRIÕES ==========
  // Gráfico de estoque de embriões por acasalamento
  const estoqueEmbriaoPorAcasalamento = selectedTipo === 'estoque_embrioes' && filteredData.length > 0 ? (() => {
    const porAcasalamento = {}
    filteredData.forEach(r => {
      const acasalamento = (r.acasalamento || 'Não informado').trim() || 'Não informado'
      const q = Number(r.quantidade) || 0
      porAcasalamento[acasalamento] = (porAcasalamento[acasalamento] || 0) + q
    })
    const entries = Object.entries(porAcasalamento).sort(([, a], [, b]) => b - a).slice(0, 8)
    if (entries.length === 0) return null
    return {
      labels: entries.map(([a]) => a.length > 20 ? a.slice(0, 17) + '...' : a),
      datasets: [{
        label: 'Embriões',
        data: entries.map(([, c]) => c),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1
      }]
    }
  })() : null

  // Detalhes do estoque de embriões por acasalamento
  const detalhesEstoqueEmbrioes = selectedTipo === 'estoque_embrioes' && filteredData.length > 0 ? (() => {
    const porAcasalamento = {}
    filteredData.forEach(r => {
      const acasalamento = (r.acasalamento || 'Não informado').trim() || 'Não informado'
      const q = Number(r.quantidade) || 0
      const raca = (r.raca || 'Não informada').trim() || 'Não informada'
      const rack = r.rack || '-'
      const botijao = r.botijao || '-'
      const caneca = r.caneca || '-'
      if (!porAcasalamento[acasalamento]) {
        porAcasalamento[acasalamento] = { total: 0, registros: 0, raca: raca, rack, botijao, caneca }
      }
      porAcasalamento[acasalamento].total += q
      porAcasalamento[acasalamento].registros += 1
    })
    return Object.entries(porAcasalamento)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([acasalamento, dados]) => ({
        acasalamento,
        embrioes: dados.total,
        registros: dados.registros,
        raca: dados.raca,
        rack: dados.rack,
        botijao: dados.botijao,
        caneca: dados.caneca
      }))
  })() : null

  // Estoque de embriões agrupado por raça
  const estoqueEmbriaoPorRaca = selectedTipo === 'estoque_embrioes' && filteredData.length > 0 ? (() => {
    const porRaca = {}
    filteredData.forEach(r => {
      const raca = (r.raca || 'Não informada').trim() || 'Não informada'
      const q = Number(r.quantidade) || 0
      if (!porRaca[raca]) {
        porRaca[raca] = { total: 0, acasalamentos: new Set() }
      }
      porRaca[raca].total += q
      if (r.acasalamento) porRaca[raca].acasalamentos.add(r.acasalamento.trim())
    })
    return Object.entries(porRaca)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([raca, dados]) => ({
        raca,
        embrioes: dados.total,
        acasalamentos: dados.acasalamentos.size
      }))
  })() : null

  // Função para abrir modal com touros de uma raça específica
  const abrirModalRaca = (raca) => {
    if (!filteredData || filteredData.length === 0) return
    
    const porTouro = {}
    filteredData.forEach(r => {
      const racaItem = (r.raca || 'Não informada').trim() || 'Não informada'
      if (racaItem === raca) {
        const t = (r.touro || 'Não informado').trim() || 'Não informado'
        const q = Number(r.quantidade) || 0
        if (!porTouro[t]) {
          porTouro[t] = { total: 0, registros: 0 }
        }
        porTouro[t].total += q
        porTouro[t].registros += 1
      }
    })
    
    const touros = Object.entries(porTouro)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([touro, dados]) => ({
        touro,
        doses: dados.total,
        registros: dados.registros
      }))
    
    setRacaSelecionada(raca)
    setTourosRaca(touros)
    setRacaModalOpen(true)
  }

  // Função para abrir modal com acasalamentos de uma raça específica (embriões)
  const abrirModalRacaEmbriao = (raca) => {
    if (!filteredData || filteredData.length === 0) return
    
    const porAcasalamento = {}
    filteredData.forEach(r => {
      const racaItem = (r.raca || 'Não informada').trim() || 'Não informada'
      if (racaItem === raca) {
        const acasalamento = (r.acasalamento || 'Não informado').trim() || 'Não informado'
        const q = Number(r.quantidade) || 0
        const rack = r.rack || '-'
        const botijao = r.botijao || '-'
        const caneca = r.caneca || '-'
        if (!porAcasalamento[acasalamento]) {
          porAcasalamento[acasalamento] = { total: 0, registros: 0, rack, botijao, caneca }
        }
        porAcasalamento[acasalamento].total += q
        porAcasalamento[acasalamento].registros += 1
      }
    })
    
    const acasalamentos = Object.entries(porAcasalamento)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([acasalamento, dados]) => ({
        acasalamento,
        embrioes: dados.total,
        registros: dados.registros,
        rack: dados.rack,
        botijao: dados.botijao,
        caneca: dados.caneca
      }))
    
    setRacaEmbriaoSelecionada(raca)
    setAcasalamentosRaca(acasalamentos)
    setRacaEmbriaoModalOpen(true)
  }

  // Gráfico de nascimentos por mês
  const nascimentosPorMes = selectedTipo === 'nascimentos' && filteredData.length > 0 ? (() => {
    const porMes = {}
    filteredData.forEach(r => {
      const d = r.data || ''
      if (!d) return
      const mes = new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      porMes[mes] = (porMes[mes] || 0) + 1
    })
    const mesesOrd = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const entries = Object.entries(porMes).sort(([a], [b]) => {
      const ai = mesesOrd.findIndex(m => a.toLowerCase().startsWith(m))
      const bi = mesesOrd.findIndex(m => b.toLowerCase().startsWith(m))
      return (ai >= 0 ? ai : 99) - (bi >= 0 ? bi : 99)
    }).slice(0, 12)
    if (entries.length === 0) return null
    return {
      labels: entries.map(([m]) => m),
      datasets: [{
        label: 'Nascimentos',
        data: entries.map(([, c]) => c),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }]
    }
  })() : null

  // Gráfico de abastecimento de nitrogênio por data
  const nitrogenioEvolution = selectedTipo === 'abastecimento_nitrogenio' && filteredData.length > 0 ? (() => {
    const porData = {}
    filteredData.forEach(r => {
      const d = r.data || ''
      if (!d) return
      const litros = parseFloat(String(r.quantidade || '0').replace(' L', '')) || 0
      porData[d] = (porData[d] || 0) + litros
    })
    const entries = Object.entries(porData).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return null
    return {
      labels: entries.map(([d]) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
      datasets: [{
        label: 'Litros',
        data: entries.map(([, l]) => l),
        fill: true,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3
      }]
    }
  })() : null

  // Gráfico de abastecimento por motorista
  const nitrogenioByDriver = selectedTipo === 'abastecimento_nitrogenio' && filteredData.length > 0 ? (() => {
    const porMotorista = {}
    filteredData.forEach(r => {
      const m = (r.motorista || 'Não informado').trim() || 'Não informado'
      const litros = parseFloat(String(r.quantidade || '0').replace(' L', '')) || 0
      porMotorista[m] = (porMotorista[m] || 0) + litros
    })
    const entries = Object.entries(porMotorista).sort(([, a], [, b]) => b - a).slice(0, 6)
    if (entries.length === 0) return null
    return {
      labels: entries.map(([m]) => m.length > 15 ? m.slice(0, 12) + '...' : m),
      datasets: [{
        label: 'Litros',
        data: entries.map(([, l]) => l),
        backgroundColor: CORES_PIQUETE.slice(0, entries.length),
        borderWidth: 1
      }]
    }
  })() : null

  const temGraficos = chartBarPiquete || chartPesoPiquete || chartSexo || chartPrenhez ||
    pesagensPorData || inseminacoesPorTouro || estoquePorTouro || nascimentosPorMes ||
    nitrogenioEvolution || nitrogenioByDriver || estoqueEmbriaoPorAcasalamento

  const ehResumoGeral = selectedTipo === 'resumo_geral'
  const graficosResumo = ehResumoGeral ? (reportData?.resumo?.graficos || []) : []
  
  const chartResumoIdade = ehResumoGeral && graficosResumo.length > 0 ? {
    labels: graficosResumo.filter(d => d.categoria === 'Idade').map(d => d.label),
    datasets: [{
      data: graficosResumo.filter(d => d.categoria === 'Idade').map(d => d.valor),
      backgroundColor: ['rgba(245, 158, 11, 0.85)', 'rgba(34, 197, 94, 0.85)', 'rgba(59, 130, 246, 0.85)'],
      borderColor: ['rgba(245, 158, 11, 1)', 'rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)'],
      borderWidth: 1
    }]
  } : null

  const chartResumoSexo = ehResumoGeral && graficosResumo.length > 0 ? {
    labels: graficosResumo.filter(d => d.categoria === 'Sexo').map(d => d.label),
    datasets: [{
      data: graficosResumo.filter(d => d.categoria === 'Sexo').map(d => d.valor),
      backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(236, 72, 153, 0.85)'],
      borderColor: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)'],
      borderWidth: 1
    }]
  } : null

  const temCalendario = selectedTipo === 'calendario_reprodutivo'

  const eventosPorDia = temCalendario && filteredCalendario.length > 0 ? (() => {
    const map = {}
    filteredCalendario.forEach(ev => {
      const d = ev.data
      if (!d) return
      const key = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  })() : {}

  const contagemTiposCalendario = temCalendario && filteredBySexo.length > 0 ? {
    chegadas: filteredBySexo.filter(r => (r.tipo || '') === 'Chegada de Receptora').length,
    dg: filteredBySexo.filter(r => (r.tipo || '') === 'Diagnóstico de Gestação').length,
    partos: filteredBySexo.filter(r => (r.tipo || '') === 'Parto Previsto').length,
    andrologico: filteredBySexo.filter(r => (r.tipo || '') === 'Refazer Exame Andrológico').length,
    brucelose: filteredBySexo.filter(r => (r.tipo || '') === 'Brucelose').length,
    dgt: filteredBySexo.filter(r => (r.tipo || '') === 'DGT').length,
    total: filteredBySexo.length
  } : null

  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekday = firstDay.getDay()
    const days = []
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  }

  const refetch = useCallback(() => {
    if (!selectedTipo) return
    setLoadingData(true)
    const params = new URLSearchParams({ tipo: selectedTipo, startDate: period.startDate, endDate: period.endDate })
    if ((selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados') && serieFilter) {
      params.set('serie', serieFilter)
    }
    fetch(`/api/mobile-reports?${params}`)
      .then(r => r.json())
      .then(d => { 
        if (d.success && d.data) {
          setReportData(d.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [selectedTipo, period.startDate, period.endDate, serieFilter])

  const baseDados = (() => {
    if (temCalendario) return filteredCalendario
    if (ehRanking && selectedTipo === 'ranking_pmgz' && tipoFiltroRanking) {
      return filteredBySexo.filter(r => (r.ranking || '') === tipoFiltroRanking)
    }
    return filteredBySexo
  })()
  const dadosParaExibir = (() => {
    if (!ehRanking || baseDados.length === 0) return baseDados
    const valorKey = Object.keys(baseDados[0] || {}).find(k => /^iABCZ$|^valor$|^iqg$/i.test(k))
    if (!valorKey) return baseDados
    const parseVal = (v) => parseFloat(String(v || '0').replace(',', '.')) || 0
    const rankingKey = baseDados[0]?.ranking != null ? 'ranking' : null
    const sorted = [...baseDados].sort((a, b) => {
      if (rankingKey && a[rankingKey] !== b[rankingKey]) {
        const order = ['iABCZ', 'Peso', 'CE', 'IQG']
        const ia = order.indexOf(a[rankingKey]) + 1 || 99
        const ib = order.indexOf(b[rankingKey]) + 1 || 99
        return ia - ib
      }
      return parseVal(b[valorKey]) - parseVal(a[valorKey])
    })
    if (!rankingKey) {
      return sorted.map((row, i) => ({ ...row, posicao: i + 1 }))
    }
    return sorted.map((row, i) => {
      const prevSame = sorted.slice(0, i).filter(r => r[rankingKey] === row[rankingKey]).length
      return { ...row, posicao: prevSame + 1 }
    })
  })()
  const totalRegistros = searchQuery.trim() || (temCalendario && tipoFiltroCalendario) ? dadosParaExibir.length : (reportData?.total ?? filteredBySexo.length)

  // Insights inteligentes gerados dos dados
  const insights = (() => {
    const list = []
    const r = resumo
    const dados = dadosParaExibir

    if (selectedTipo === 'resumo_pesagens' && dadosGraficoPiquete.length > 0) {
      const comPeso = dadosGraficoPiquete.map(r => ({
        nome: (r.Piquete || r.piquete || '').replace(/PROJETO\s*/i, 'P'),
        media: parseFloat(String(r['Média Peso (kg)'] ?? r.mediaPeso ?? 0).replace(',', '.')) || 0,
        animais: r.Animais ?? r.animais ?? 0
      })).filter(x => x.media > 0)
      if (comPeso.length > 0) {
        const maior = comPeso.reduce((a, b) => a.media > b.media ? a : b)
        const menor = comPeso.reduce((a, b) => a.media < b.media ? a : b)
        list.push({ icon: '📈', text: `Maior média: ${maior.nome} com ${maior.media.toFixed(1)} kg` })
        if (maior.nome !== menor.nome) list.push({ icon: '📉', text: `Menor média: ${menor.nome} com ${menor.media.toFixed(1)} kg` })
        const totalAnimais = comPeso.reduce((s, x) => s + x.animais, 0)
        if (totalAnimais > 0) list.push({ icon: '🐄', text: `${totalAnimais} animais distribuídos em ${comPeso.length} piquete(s)` })
      }
    }

    if (selectedTipo === 'resumo_femeas_ia' && totalIA > 0) {
      const taxa = (prenhas / totalIA) * 100
      if (taxa >= 50) list.push({ icon: '🎉', text: `Taxa de prenhez em destaque: ${taxa.toFixed(1)}%` })
      else if (taxa < 30) list.push({ icon: '💡', text: `Considere revisar estratégia de IA: ${taxa.toFixed(1)}% de prenhez` })
      list.push({ icon: '📊', text: `${prenhas} de ${totalIA} fêmeas prenhas no período` })
    }

    if (selectedTipo === 'nascimentos' && dados.length > 0) {
      const total = machos + femeas
      if (total > 0) {
        const pctM = ((machos / total) * 100).toFixed(0)
        list.push({ icon: '📋', text: `${total} nascimento(s): ${machos} machos (${pctM}%) e ${femeas} fêmeas` })
      }
    }

    if (selectedTipo === 'pesagens' && dados.length > 0) {
      const total = dados.length
      const comPeso = dados.filter(r => r.peso != null && parseFloat(r.peso) > 0)
      if (comPeso.length > 0) {
        const media = comPeso.reduce((s, r) => s + parseFloat(r.peso), 0) / comPeso.length
        list.push({ icon: '⚖️', text: `${total} pesagem(s) registrada(s) no período` })
        list.push({ icon: '📊', text: `Peso médio geral: ${media.toFixed(1)} kg` })
      }
    }

    if ((selectedTipo === 'inseminacoes' || selectedTipo === 'femeas_ia') && dados.length > 0) {
      const porTouro = {}
      dados.forEach(r => {
        const t = (r.touro || 'Não informado').trim() || 'Não informado'
        porTouro[t] = (porTouro[t] || 0) + 1
      })
      const top = Object.entries(porTouro).sort(([, a], [, b]) => b - a)[0]
      if (top) list.push({ icon: '🐂', text: `Touro mais usado: ${top[0]} com ${top[1]} IA(s)` })
    }

    if (selectedTipo === 'estoque_semen' && dados.length > 0) {
      const totalDoses = dados.reduce((s, r) => s + (Number(r.quantidade) || 0), 0)
      list.push({ icon: '📦', text: `${totalDoses} dose(s) em estoque total` })
      const touros = new Set(dados.map(r => (r.touro || '').trim()).filter(Boolean)).size
      list.push({ icon: '🐂', text: `${touros} touro(s) no catálogo` })
      
      // Touro com mais doses
      const porTouro = {}
      dados.forEach(r => {
        const t = (r.touro || '').trim()
        if (t) porTouro[t] = (porTouro[t] || 0) + (Number(r.quantidade) || 0)
      })
      const entries = Object.entries(porTouro).sort(([, a], [, b]) => b - a)
      if (entries.length > 0) {
        list.push({ icon: '🥇', text: `Maior estoque: ${entries[0][0]} com ${entries[0][1]} dose(s)` })
      }
      if (entries.length > 1) {
        list.push({ icon: '🥈', text: `2º lugar: ${entries[1][0]} com ${entries[1][1]} dose(s)` })
      }
    }

    if (selectedTipo === 'calendario_reprodutivo' && dados.length > 0) {
      const porTipo = {}
      const porMes = {}
      dados.forEach(r => {
        const t = (r.tipo || 'Outros').trim() || 'Outros'
        porTipo[t] = (porTipo[t] || 0) + 1
        const d = r.data || ''
        if (d) {
          const mesAno = d.substring(0, 7)
          porMes[mesAno] = (porMes[mesAno] || 0) + 1
        }
      })
      const top = Object.entries(porTipo).sort(([, a], [, b]) => b - a)[0]
      const partos = porTipo['Parto Previsto'] || contagemTiposCalendario?.partos || 0
      const brucelose = porTipo['Brucelose'] || contagemTiposCalendario?.brucelose || 0
      const dgt = porTipo['DGT'] || contagemTiposCalendario?.dgt || 0
      list.push({ icon: '📅', text: `${dados.length} evento(s) no calendário` })
      if (partos > 0) list.push({ icon: '🐄', text: `${partos} parto(s) previsto(s) no período` })
      if (brucelose > 0) list.push({ icon: '💉', text: `${brucelose} fêmea(s) para Brucelose` })
      if (dgt > 0) list.push({ icon: '📋', text: `${dgt} animal(is) para DGT` })
      if (Object.keys(porMes).length > 0) {
        const mesesComEventos = Object.keys(porMes).length
        list.push({ icon: '📆', text: `${mesesComEventos} mês(es) com eventos` })
      }
      if (top) list.push({ icon: '📌', text: `${top[0]}: ${top[1]} evento(s)` })
    }

    if (selectedTipo === 'previsoes_parto' && dados.length > 0) {
      const res = reportData?.resumo || {}
      const total = res['Total de previsões'] ?? dados.length
      if (total > 0) list.push({ icon: '🤰', text: `${total} previsão(ões) de parto no período` })
      const porTouro = res['Prenhas por touro']
      if (porTouro && porTouro !== '-') list.push({ icon: '🐂', text: `Por touro: ${String(porTouro).substring(0, 80)}${String(porTouro).length > 80 ? '...' : ''}` })
    }

    if (selectedTipo === 'femeas_brucelose' && dados.length > 0) {
      const total = dados.length
      list.push({ icon: '💉', text: `${total} fêmea(s) precisam de vacina de brucelose` })
      const porPiquete = {}
      dados.forEach(r => {
        const p = r.piquete || 'Não informado'
        porPiquete[p] = (porPiquete[p] || 0) + 1
      })
      const piquetes = Object.keys(porPiquete).length
      if (piquetes > 1) list.push({ icon: '📍', text: `Distribuídas em ${piquetes} piquete(s)` })
      const idadeMedia = dados.reduce((s, r) => s + (r.idade_meses || 0), 0) / total
      if (idadeMedia > 0) list.push({ icon: '📊', text: `Idade média: ${idadeMedia.toFixed(1)} meses` })
    }

    if (selectedTipo === 'animais_dgt' && dados.length > 0) {
      const total = dados.length
      const machos = dados.filter(r => (r.sexo || '').toUpperCase().startsWith('M')).length
      const femeas = dados.filter(r => (r.sexo || '').toUpperCase().startsWith('F')).length
      list.push({ icon: '📋', text: `${total} animal(is) elegível(is) para DGT` })
      if (machos > 0 && femeas > 0) {
        list.push({ icon: '🐄', text: `${machos} machos e ${femeas} fêmeas` })
      }
      const porPiquete = {}
      dados.forEach(r => {
        const p = r.piquete || 'Não informado'
        porPiquete[p] = (porPiquete[p] || 0) + 1
      })
      const piquetes = Object.keys(porPiquete).length
      if (piquetes > 1) list.push({ icon: '📍', text: `Distribuídos em ${piquetes} piquete(s)` })
    }

    return list
  })()

  const DICAS_POR_TIPO = {
    resumo_pesagens: 'Compare a média entre piquetes para identificar lotes que precisam de atenção.',
    pesagens: 'Use o gráfico de evolução para acompanhar a frequência de pesagens.',
    resumo_femeas_ia: 'Taxa acima de 50% indica boa eficiência reprodutiva.',
    inseminacoes: 'O touro mais usado pode indicar preferência ou disponibilidade.',
    nascimentos: 'A proporção macho/fêmea ajuda no planejamento do rebanho.',
    estoque_semen: 'Mantenha estoque para os touros mais utilizados.',
    gestacoes: 'Acompanhe gestações atrasadas para intervenções.',
    previsoes_parto: 'Resumo por touro: quantas prenhas cada touro gerou. Ajuste as datas para ver partos previstos no período.',
    mortes: 'Analise causas para prevenir futuras perdas.',
    calendario_reprodutivo: 'Eventos manuais, receptoras, partos previstos e refazer andrológico. Veja meses com eventos e quantidade de parições.',
    femeas_brucelose: 'Fêmeas entre 3 e 8 meses (90-240 dias) que precisam receber a vacina de brucelose obrigatória.',
    animais_dgt: 'Animais entre 11 e 21 meses (330-640 dias) elegíveis para avaliação de desempenho DGT.'
  }
  const dicaAtual = selectedTipo ? DICAS_POR_TIPO[selectedTipo] : null

  const handleShareSummary = async () => {
    try {
      setSharing(true)
      const titulo = `Relatório: ${selectedTipo || 'Geral'}`
      const resumoTxt = reportData?.resumo && typeof reportData.resumo === 'object'
        ? Object.entries(reportData.resumo).map(([k, v]) => `${k}: ${v}`).join('\n')
        : null
      const texto = [
        titulo,
        `Período: ${period.startDate} a ${period.endDate}`,
        `Registros: ${totalRegistros}`,
        resumoTxt ? `Resumo:\n${resumoTxt}` : null
      ].filter(Boolean).join('\n')
      if (navigator.share) {
        await navigator.share({ title: titulo, text: texto })
        setToast({ type: 'success', msg: 'Compartilhado!' })
      } else {
        await navigator.clipboard.writeText(texto)
        setToast({ type: 'success', msg: 'Resumo copiado!' })
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Não foi possível compartilhar' })
    } finally {
      setSharing(false)
    }
  }
  const PERIOD_PRESETS = {
    '7d': () => {
      const end = new Date()
      const start = new Date(end); start.setDate(start.getDate() - 7)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    },
    '30d': () => {
      const end = new Date()
      const start = new Date(end); start.setDate(start.getDate() - 30)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    },
    'mes': () => {
      const d = new Date()
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    },
    'ano': () => {
      const d = new Date()
      const start = new Date(d.getFullYear(), 0, 1)
      const end = new Date(d.getFullYear(), 11, 31)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    }
  }

  const applyPeriod = (key) => {
    const fn = PERIOD_PRESETS[key]
    if (fn) setPeriod(fn())
  }

  const exportCSV = () => {
    const rows = dadosParaExibir
    if (!rows.length) return
    const cols = Object.keys(rows[0]).filter(k => k !== '_resumo')
    const csv = [
      cols.join(';'),
      ...rows.map(r => cols.map(k => {
        const v = r[k]
        const s = k.toLowerCase().includes('data') && v ? formatDate(v) : String(v ?? '')
        return `"${s.replace(/"/g, '""')}"`
      }).join(';'))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${selectedTipo || 'geral'}-${period.startDate}_a_${period.endDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setToast({ type: 'success', msg: 'CSV exportado com sucesso!' })
  }

  return (
    <>
      <Head>
        <title>Relatórios | Beef-Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto"
          >
            <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              <span className="text-xl">{toast.type === 'success' ? '✓' : '⚠'}</span>
              <span className="font-semibold flex-1">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Botão voltar ao topo */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-28 right-4 z-30 p-3 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 active:scale-95 transition-all"
          >
            <ChevronUpIcon className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
      {/* Modal lista de animais ao clicar nos cards */}
      <AnimatePresence>
        {cardFilterModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCardFilterModal(m => ({ ...m, open: false }))}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cardFilterModal.title}</h3>
                <button
                  onClick={() => setCardFilterModal(m => ({ ...m, open: false }))}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {cardListLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <ArrowPathIcon className="h-10 w-10 text-amber-500 animate-spin" />
                  </div>
                ) : cardFilterModal.dataType === 'piquetes' ? (
                  <div className="p-4 space-y-3">
                    {cardAnimalsList.map((row, idx) => {
                      const piqueteNome = (row.Piquete || row.piquete || '-').replace(/PROJETO\s*/i, 'PROJETO ')
                      const totalAnimais = row.Animais ?? row.total ?? 0
                      const machos = row.Machos ?? row.machos ?? 0
                      const femeas = row.Fêmeas ?? row.femeas ?? row.Femeas ?? 0
                      const mediaPeso = row['Média Peso (kg)'] ?? row.mediaPeso ?? row.media_peso
                      const cor = CORES_PIQUETE[idx % CORES_PIQUETE.length]
                      
                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Buscar animais deste piquete
                            setCardFilterModal({
                              open: true,
                              title: `Animais em ${piqueteNome}`,
                              filter: { piquete: piqueteNome },
                              dataType: 'animais'
                            })
                          }}
                          className="w-full p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all text-left"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: cor }}
                              />
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                {piqueteNome}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm font-bold">
                                {totalAnimais} 🐄
                              </span>
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {machos > 0 && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                  <span className="text-blue-700 dark:text-blue-300 font-bold text-sm">M</span>
                                </div>
                                <div>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Machos</p>
                                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{machos}</p>
                                </div>
                              </div>
                            )}
                            
                            {femeas > 0 && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                                <div className="w-8 h-8 rounded-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center">
                                  <span className="text-pink-700 dark:text-pink-300 font-bold text-sm">F</span>
                                </div>
                                <div>
                                  <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">Fêmeas</p>
                                  <p className="text-lg font-bold text-pink-900 dark:text-pink-100">{femeas}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {mediaPeso && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Média de Peso</span>
                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                  {typeof mediaPeso === 'number' ? mediaPeso.toFixed(1) : mediaPeso} kg
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Indicador de clicável */}
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
                              Toque para ver os animais
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cardAnimalsList.map((a, idx) => {
                      const sexo = a.sexo || 'Não informado'
                      const ehMacho = sexo.toLowerCase().includes('macho')
                      
                      return (
                        <Link
                          key={a.animal_id || a.id || idx}
                          href={`/animals/${a.animal_id || a.id}`}
                          onClick={() => setCardFilterModal(m => ({ ...m, open: false }))}
                          className="block px-4 py-4 hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Cabeçalho com nome e sexo */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 dark:text-white text-base">
                                  {a.identificacao || a.animal || `${a.serie || ''}-${a.rg || ''}`.trim() || a.nome || '—'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  ehMacho 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                                }`}>
                                  {sexo}
                                </span>
                              </div>
                              
                              {/* Informações principais em grid */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                                {a.peso && a.peso !== '-' && (
                                  <div className="flex items-center gap-1.5">
                                    <ScaleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <span className="text-gray-600 dark:text-gray-400">Peso:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{a.peso}</span>
                                  </div>
                                )}
                                
                                {ehMacho && a.ce && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-amber-500 font-bold text-xs">CE</span>
                                    <span className="text-gray-600 dark:text-gray-400">:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{a.ce} cm</span>
                                  </div>
                                )}
                                
                                {a.idade_meses !== null && a.idade_meses !== undefined && (
                                  <div className="flex items-center gap-1.5">
                                    <ClockIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-gray-600 dark:text-gray-400">Idade:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{a.idade_meses}m</span>
                                  </div>
                                )}
                                
                                {a.raca && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-600 dark:text-gray-400">Raça:</span>
                                    <span className="font-medium text-gray-900 dark:text-white truncate">{a.raca}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Genealogia e índices */}
                              {(a.pai || a.avo_materno || a.iabcz || a.deca || (a.iqg ?? a.genetica_2) || (a.pt_iqg ?? a.decile_2)) && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                                  {a.pai && (
                                    <div className="flex items-start gap-1.5 text-xs">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[60px]">Pai:</span>
                                      <span className="text-gray-900 dark:text-white font-medium">{a.pai}</span>
                                    </div>
                                  )}
                                  
                                  {a.avo_materno && (
                                    <div className="flex items-start gap-1.5 text-xs">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[60px]">Avô Mat:</span>
                                      <span className="text-gray-900 dark:text-white font-medium">{a.avo_materno}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-3 mt-2">
                                    {a.iabcz && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">iABCZ:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{a.iabcz}</span>
                                      </div>
                                    )}
                                    
                                    {a.deca && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">DECA:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{a.deca}</span>
                                      </div>
                                    )}
                                    {(a.iqg ?? a.genetica_2) && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">IQG:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{(a.iqg ?? a.genetica_2)}</span>
                                      </div>
                                    )}
                                    {(a.pt_iqg ?? a.decile_2) && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Pt IQG:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{(a.pt_iqg ?? a.decile_2)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
                {!cardListLoading && cardAnimalsList.length === 0 && (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">Nenhum registro encontrado.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pb-24">
        <div className="sticky top-0 z-10 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700 shadow-sm px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            {selectedTipo ? (
              <button
                onClick={() => setSelectedTipo(null)}
                className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium"
              >
                <ArrowLeftIcon className="h-6 w-6" />
                Voltar
              </button>
            ) : (
              <Link
                href="/a"
                className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium"
              >
                <ArrowLeftIcon className="h-6 w-6" />
                Voltar
              </Link>
            )}
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-amber-500" />
              {selectedTipo ? (
                <span className="truncate max-w-[180px]">
                  {allTypes.find(t => t.key === selectedTipo)?.label || 'Relatório'}
                </span>
              ) : (
                <span>Relatórios</span>
              )}
            </h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8, delay: idx * 0.1 }}
                  className="h-16 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
                />
              ))}
            </div>
          ) : !selectedTipo ? (
            <div className="pb-24 space-y-4 relative">
              {currentTab === 'home' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="px-1 pt-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {getGreeting()},
                      <span className="text-amber-500">Fazendeiro</span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Aqui está o resumo da sua fazenda hoje.
                    </p>
                  </div>

              {/* Dashboard / Visão Geral - KPIs rápidos MELHORADOS */}
              {dashboardData?.data?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Visão Geral</span>
                    </div>
                    <button
                      onClick={() => setSelectedTipo('resumo_geral')}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline active:scale-95"
                    >
                      Ver completo
                      <ChevronRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {dashboardData.data.slice(0, 4).map((mod, i) => {
                      const modConfig = {
                        Rebanho: { 
                          gradient: 'from-blue-50 via-blue-100/70 to-blue-50 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-900/30',
                          border: 'border-blue-300 dark:border-blue-700',
                          icon: '🐄',
                          iconBg: 'bg-blue-200/50 dark:bg-blue-800/50',
                          textColor: 'text-blue-700 dark:text-blue-300'
                        },
                        Reprodução: { 
                          gradient: 'from-pink-50 via-pink-100/70 to-pink-50 dark:from-pink-900/30 dark:via-pink-800/20 dark:to-pink-900/30',
                          border: 'border-pink-300 dark:border-pink-700',
                          icon: '💕',
                          iconBg: 'bg-pink-200/50 dark:bg-pink-800/50',
                          textColor: 'text-pink-700 dark:text-pink-300'
                        },
                        Peso: { 
                          gradient: 'from-amber-50 via-amber-100/70 to-amber-50 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-amber-900/30',
                          border: 'border-amber-300 dark:border-amber-700',
                          icon: '⚖️',
                          iconBg: 'bg-amber-200/50 dark:bg-amber-800/50',
                          textColor: 'text-amber-700 dark:text-amber-300'
                        },
                        Financeiro: { 
                          gradient: 'from-emerald-50 via-emerald-100/70 to-emerald-50 dark:from-emerald-900/30 dark:via-emerald-800/20 dark:to-emerald-900/30',
                          border: 'border-emerald-300 dark:border-emerald-700',
                          icon: '💰',
                          iconBg: 'bg-emerald-200/50 dark:bg-emerald-800/50',
                          textColor: 'text-emerald-700 dark:text-emerald-300'
                        }
                      }
                      const config = modConfig[mod.modulo] || {
                        gradient: 'from-gray-50 to-gray-100/50 dark:from-gray-900/20 dark:to-gray-900/10',
                        border: 'border-gray-200 dark:border-gray-700',
                        icon: '📊',
                        iconBg: 'bg-gray-200/50 dark:bg-gray-700/50',
                        textColor: 'text-gray-700 dark:text-gray-300'
                      }
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.05 * i, type: 'spring', stiffness: 200 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedTipo('resumo_geral')}
                          className={`relative p-4 rounded-2xl bg-gradient-to-br border-2 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group ${config.gradient} ${config.border}`}
                        >
                          {/* Ícone decorativo no canto */}
                          <div className={`absolute -top-2 -right-2 w-16 h-16 rounded-full ${config.iconBg} opacity-20 blur-xl`} />
                          
                          {/* Indicador de clicável */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{mod.modulo}</p>
                              <span className="text-2xl">{config.icon}</span>
                            </div>
                            <div className="space-y-1.5">
                              {Object.entries(mod.dados || {}).slice(0, 2).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-baseline gap-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{k}</span>
                                  <span className={`text-base font-bold truncate ${config.textColor}`}>{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Barra de progresso decorativa */}
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.2 + (i * 0.1), duration: 0.6 }}
                            className={`absolute bottom-0 left-0 h-1 ${config.iconBg} opacity-50`}
                          />
                        </motion.div>
                      )
                    })}
                  </div>
                  
                  {/* Estatísticas rápidas adicionais */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3 grid grid-cols-3 gap-2"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 cursor-default"
                    >
                      <p className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 uppercase">Hoje</p>
                      <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentTab('reports')}
                      className="p-2 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-900/10 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 uppercase">Relatórios</p>
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-100">{enabledReports.length}</p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentTab('reports')}
                      className="p-2 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-semibold text-orange-600 dark:text-orange-400 uppercase">Favoritos</p>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-100">{favorites.length}</p>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
              </motion.div>
              )}

              {tiposHabilitados.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-amber-800 dark:text-amber-200">
                    Nenhum relatório habilitado para mobile. Configure em Monitoramento &gt; Acessos.
                  </p>
                </div>
              ) : (
                <>
                  {currentTab === 'reports' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Busca de relatórios */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchReports}
                      onChange={e => setSearchReports(e.target.value)}
                      placeholder="Buscar relatórios..."
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                    />
                    {searchReports && (
                      <button
                        onClick={() => setSearchReports('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    )}
                  </motion.div>

                  {/* Filtro por categoria */}
                  {categoriasComRelatorios.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2"
                    >
                      <button
                        onClick={() => setCategoryFilter('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          !categoryFilter
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Todas
                      </button>
                      {categoriasComRelatorios.map(({ cat }) => {
                        const CatIcon = ICONE_POR_CATEGORIA[cat] || ChartBarIcon
                        const ativo = categoryFilter === cat
                        return (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(ativo ? '' : cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              ativo ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            <CatIcon className="h-3.5 w-3.5" />
                            {cat}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                    </motion.div>
                  )}

                  {currentTab === 'home' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                  {/* Acesso Rápido - Relatórios mais usados */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <SparklesIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acesso Rápido</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ACESSO_RAPIDO_KEYS.filter(k => enabledReports.includes(k)).map((id, i) => {
                        const tipo = allTypes.find(t => t.key === id)
                        if (!tipo) return null
                        const Icon = ICONE_POR_CATEGORIA[tipo.category] || ChartBarIcon
                        const desc = DESCRICOES_ACESSO_RAPIDO[id]
                        return (
                          <motion.button
                            key={id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedTipo(id)}
                            className="flex flex-col items-start gap-1 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-900/10 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm hover:shadow-md transition-all text-left"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="p-2 rounded-lg bg-amber-200/50 dark:bg-amber-800/50 flex-shrink-0">
                                <Icon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                              </div>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">{tipo.label.replace(/^[📊📅🏆]\s*/, '')}</span>
                            </div>
                            {desc && <span className="text-[10px] text-gray-500 dark:text-gray-400 pl-1 line-clamp-1">{desc}</span>}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Card especial para Boletim Defesa */}
                  <Link href="/boletim-defesa/mobile">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative p-5 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 dark:from-teal-600 dark:to-teal-800 border-2 border-teal-400 dark:border-teal-500 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
                    >
                      {/* Efeito de brilho animado */}
                      <motion.div
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: 'easeInOut'
                        }}
                        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                      />
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="p-3 rounded-xl bg-white/20 backdrop-blur shadow-inner"
                          >
                            <DocumentTextIcon className="h-7 w-7 text-white" />
                          </motion.div>
                          <div>
                            <p className="font-bold text-white text-lg flex items-center gap-2">
                              Boletim Defesa
                              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">Novo</span>
                            </p>
                            <p className="text-teal-100 text-sm">Quantidades por faixa etária</p>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-6 w-6 text-white opacity-90" />
                      </div>
                    </motion.div>
                  </Link>

                  {/* Ações Rápidas - NOVO */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <LightBulbIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ações Rápidas</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-800" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Link href="/a">
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="p-2 rounded-lg bg-blue-200/50 dark:bg-blue-800/50">
                              <MagnifyingGlassIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                            </div>
                            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Consultar Animal</span>
                          </div>
                        </motion.div>
                      </Link>
                      
                      <Link href="/mobile-feedback">
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="p-2 rounded-lg bg-green-200/50 dark:bg-green-800/50">
                              <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
                            </div>
                            <span className="text-xs font-semibold text-green-900 dark:text-green-100">Enviar Feedback</span>
                          </div>
                        </motion.div>
                      </Link>
                      
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const today = new Date()
                          const start = new Date(today)
                          start.setMonth(start.getMonth() - 1)
                          setPeriod({
                            startDate: start.toISOString().split('T')[0],
                            endDate: today.toISOString().split('T')[0]
                          })
                        }}
                        className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <div className="p-2 rounded-lg bg-purple-200/50 dark:bg-purple-800/50">
                            <CalendarIcon className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                          </div>
                          <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Último Mês</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Favoritos */}
                  {favorites.filter(id => enabledReports.includes(id)).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <StarIconSolid className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Seus Favoritos</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {favorites.filter(id => enabledReports.includes(id)).map(id => {
                          const tipo = allTypes.find(t => t.key === id)
                          if (!tipo) return null
                          const Icon = ICONE_POR_CATEGORIA[tipo.category] || DocumentTextIcon
                          return (
                            <motion.div
                              key={id}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center gap-1 group"
                            >
                              <button
                                onClick={() => setSelectedTipo(id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50"
                              >
                                <Icon className="h-4 w-4" />
                                {tipo.label.replace(/^[📊📅🏆]\s*/, '')}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); toggleFavorite(id) }}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                              >
                                <StarIconSolid className="h-4 w-4" />
                              </button>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Você pode gostar - sugestões */}
                  {(() => {
                    const excluidos = new Set([...ACESSO_RAPIDO_KEYS, ...recentIds, ...favorites])
                    const sugestoes = []
                    for (const { tipos } of categoriasComRelatorios) {
                      for (const t of tipos) {
                        if (!excluidos.has(t.key) && sugestoes.length < 3) {
                          sugestoes.push(t)
                          excluidos.add(t.key)
                        }
                      }
                    }
                    return sugestoes.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <LightBulbIcon className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Você pode gostar</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sugestoes.map(tipo => {
                            const Icon = ICONE_POR_CATEGORIA[tipo.category] || ChartBarIcon
                            return (
                              <motion.button
                                key={tipo.key}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedTipo(tipo.key)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                              >
                                <Icon className="h-4 w-4" />
                                {tipo.label.replace(/^[📊📅🏆]\s*/, '')}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null
                  })()}

                  {recentIds.filter(id => !ACESSO_RAPIDO_KEYS.includes(id)).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <ClockIcon className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Acessados recentemente</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentIds.filter(id => !ACESSO_RAPIDO_KEYS.includes(id)).filter(id => enabledReports.includes(id)).slice(0, 5).map(id => {
                          const tipo = allTypes.find(t => t.key === id)
                          if (!tipo) return null
                          const Icon = ICONE_POR_CATEGORIA[tipo.category] || DocumentTextIcon
                          return (
                            <motion.button
                              key={id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedTipo(id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
                            >
                              <Icon className="h-4 w-4" />
                              {tipo.label.replace(/^[📊📅🏆]\s*/, '')}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                    </motion.div>
                  )}

                  {currentTab === 'reports' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <ChartBarIcon className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Todos os Relatórios</span>
                    </div>
                    <div className="space-y-4">
                      {categoriasComRelatorios
                        .filter(({ cat }) => !categoryFilter || categoryFilter === cat)
                        .map(({ cat, tipos: tiposNaCat }) => {
                          const tiposFiltrados = tiposNaCat.filter(t => matchSearch(t.label, t.key))
                          if (tiposFiltrados.length === 0) return null
                          const CatIcon = ICONE_POR_CATEGORIA[cat] || DocumentTextIcon
                          const isCollapsed = collapsedCats[cat]
                          return (
                            <motion.div
                              key={cat}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                              <button
                                onClick={() => toggleCollapse(cat)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <CatIcon className="h-4 w-4 text-amber-500" />
                                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">{cat}</span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">({tiposFiltrados.length})</span>
                                </div>
                                <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-2 pt-0 space-y-2">
                                      {tiposFiltrados.map((tipo, i) => {
                                        const Icon = ICONE_POR_CATEGORIA[tipo.category] || DocumentTextIcon
                                        const isFav = favorites.includes(tipo.key)
                                        return (
                                          <motion.div
                                            key={tipo.key}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="flex items-center gap-2"
                                          >
                                            <button
                                              onClick={() => setSelectedTipo(tipo.key)}
                                              className="flex-1 flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md shadow-sm transition-all text-left group"
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                                                  <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{tipo.label}</p>
                                              </div>
                                              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                                            </button>
                                            <button
                                              onClick={e => { e.stopPropagation(); toggleFavorite(tipo.key) }}
                                              className="p-2.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-500 transition-colors flex-shrink-0"
                                            >
                                              {isFav ? <StarIconSolid className="h-5 w-5" /> : <StarIcon className="h-5 w-5" />}
                                            </button>
                                          </motion.div>
                                        )
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )
                        })}
                      {(searchReports.trim() || categoryFilter) && categoriasComRelatorios.filter(({ cat }) => !categoryFilter || categoryFilter === cat).every(({ tipos }) => tipos.filter(t => matchSearch(t.label, t.key)).length === 0) && (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                          <p className="font-medium">Nenhum relatório encontrado</p>
                          <button
                            onClick={() => { setSearchReports(''); setCategoryFilter('') }}
                            className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-semibold"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
                  >
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Beef-Sync • Gestão inteligente de rebanho
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 opacity-75">
                      Exporte relatórios em CSV ou compartilhe com sua equipe
                    </p>
                  </motion.div>
                  </motion.div>
                )}
              </>
              )}

              {currentTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 pt-2"
                >
                  <div className="px-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Configurações e informações
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                     {/* Card do Usuário */}
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 shadow-md"
                     >
                        <div className="flex items-center gap-3 mb-3">
                           <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                             FA
                           </div>
                           <div className="flex-1">
                             <p className="font-bold text-gray-900 dark:text-white text-lg">Fazendeiro</p>
                             <p className="text-xs text-gray-600 dark:text-gray-400">admin@beefsync.com</p>
                           </div>
                        </div>
                        <button className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                           <ArrowRightOnRectangleIcon className="h-4 w-4" />
                           Sair da Conta
                        </button>
                     </motion.div>
    
                     {/* Seção Geral */}
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Preferências</p>
                        
                        {/* Aparência com Toggle */}
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const newDarkMode = !isDarkMode
                            setIsDarkMode(newDarkMode)
                            localStorage.setItem('darkMode', newDarkMode.toString())
                            
                            if (newDarkMode) {
                              document.documentElement.classList.add('dark')
                            } else {
                              document.documentElement.classList.remove('dark')
                            }
                          }}
                          className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400">
                                    {isDarkMode ? <MoonIcon className="h-5 w-5" /> : <span className="text-xl">☀️</span>}
                                 </div>
                                 <div className="text-left">
                                    <span className="font-semibold text-gray-900 dark:text-white block">Aparência</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</span>
                                 </div>
                              </div>
                              <div className={`w-12 h-6 rounded-full transition-all ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                 <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
                              </div>
                           </div>
                        </motion.button>
                        
                        {/* Notificações */}
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400">
                                    <BellIcon className="h-5 w-5" />
                                 </div>
                                 <div className="text-left">
                                    <span className="font-semibold text-gray-900 dark:text-white block">Notificações</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Alertas e avisos</span>
                                 </div>
                              </div>
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                           </div>
                        </motion.button>
                     </div>

                     {/* Seção Sobre */}
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Sobre</p>
                        
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
                                 <span className="text-2xl">🐄</span>
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900 dark:text-white">Beef-Sync</p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">Versão 2.0.0</p>
                              </div>
                           </div>
                           <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                              <p>Sistema de gestão pecuária</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-500">© 2024 Beef-Sync. Todos os direitos reservados.</p>
                           </div>
                        </div>
                     </div>

                     {/* Estatísticas Rápidas */}
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Estatísticas</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                           <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Relatórios</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{enabledReports.length}</p>
                           </div>
                           <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800">
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Favoritos</p>
                              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{favorites.length}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              <div className="fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-1.5 flex items-center justify-around z-50">
                <button
                  onClick={() => setCurrentTab('home')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                    currentTab === 'home'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {currentTab === 'home' ? <HomeIconSolid className="h-6 w-6" /> : <HomeIcon className="h-6 w-6" />}
                  <span className="text-[10px] font-medium">Início</span>
                </button>
                <button
                  onClick={() => setCurrentTab('reports')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                    currentTab === 'reports'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {currentTab === 'reports' ? <ChartBarIconSolid className="h-6 w-6" /> : <ChartBarIcon className="h-6 w-6" />}
                  <span className="text-[10px] font-medium">Relatórios</span>
                </button>
                <button
                  onClick={() => setCurrentTab('settings')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                    currentTab === 'settings'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {currentTab === 'settings' ? <ListBulletIcon className="h-6 w-6" /> : <ListBulletIcon className="h-6 w-6" />}
                  <span className="text-[10px] font-medium">Menu</span>
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTipo(null)}
                    className="text-sm text-amber-600 dark:text-amber-400 font-medium"
                  >
                    ← Voltar
                  </button>
                  {reportData && totalRegistros >= 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={refetch}
                    disabled={loadingData}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    title="Atualizar"
                  >
                    <ArrowPathIcon className={`h-5 w-5 ${loadingData ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Seletor rápido de período */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(PERIOD_PRESETS).map(([key, fn]) => {
                  const p = fn()
                  const isActive = period.startDate === p.startDate && period.endDate === p.endDate
                  const labels = { '7d': '7 dias', '30d': '30 dias', 'mes': 'Mês', 'ano': 'Ano' }
                  return (
                    <button
                      key={key}
                      onClick={() => applyPeriod(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {labels[key]}
                    </button>
                  )
                })}
              </div>

              {hasSexo && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <FunnelIcon className="h-4 w-4" /> Sexo
                  </span>
                  <button
                    onClick={() => setSexoFilter('todos')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${sexoFilter === 'todos' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setSexoFilter('M')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${sexoFilter === 'M' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Machos
                  </button>
                  <button
                    onClick={() => setSexoFilter('F')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${sexoFilter === 'F' ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Fêmeas
                  </button>
                </div>
              )}

              {(selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados') && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <FunnelIcon className="h-4 w-4" /> Série
                  </span>
                  <select
                    value={serieFilter}
                    onChange={e => setSerieFilter(e.target.value || '')}
                    className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[100px]"
                  >
                    <option value="">Todas as séries</option>
                    {(config?.series || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTipo === 'ranking_pmgz' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <FunnelIcon className="h-4 w-4" /> Ranking
                  </span>
                  {['iABCZ', 'Peso', 'CE', 'IQG'].map(tipo => {
                    const qtd = (reportData?.data || []).filter(d => !d._resumo && d.ranking === tipo).length
                    return (
                      <button
                        key={tipo}
                        onClick={() => setTipoFiltroRanking(tipoFiltroRanking === tipo ? '' : tipo)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          tipoFiltroRanking === tipo
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tipo} {qtd > 0 && <span className="opacity-75">({qtd})</span>}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setTipoFiltroRanking('')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      !tipoFiltroRanking ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Todos
                  </button>
                </div>
              )}

              {loadingData && (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    ))}
                  </motion.div>
                  <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              )}
              {!loadingData && reportData && (
                <div className="space-y-4">
                  {(temGraficos || temCalendario) && (
                    <div className="flex gap-2 p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-inner">
                      {temCalendario ? (
                        <>
                          <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                          >
                            📅 Calendário
                          </button>
                          <button
                            onClick={() => setViewMode('table')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'table' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                          >
                            📋 Tabela
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewMode('charts')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'charts' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                          >
                            📊 Gráficos
                          </button>
                          <button
                            onClick={() => setViewMode('table')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'table' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                          >
                            📋 Tabela
                          </button>
                        </>
                      )}
                    </div>
                  )}


                  {ehResumoGeral && (
                    <div className="space-y-4">
                      {reportData?.data?.map((mod, i) => {
                         const ModIcon = mod.modulo === 'Rebanho' ? UserGroupIcon :
                           mod.modulo === 'Reprodução' ? HeartIcon :
                           mod.modulo === 'Peso' ? ScaleIcon :
                           mod.modulo === 'Financeiro' ? BanknotesIcon :
                           mod.modulo === 'Custos' ? BanknotesIcon :
                           mod.modulo === 'Vendas' ? CurrencyDollarIcon :
                           mod.modulo === 'Sanidade' ? SparklesIcon :
                           ChartBarIcon
                         return (
                           <motion.div
                             key={i}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: i * 0.1 }}
                             className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                           >
                             <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                               <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                 <ModIcon className="h-6 w-6" />
                               </div>
                               <h3 className="font-bold text-lg text-gray-900 dark:text-white">{mod.modulo}</h3>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                               {Object.entries(mod.dados || {}).map(([label, val], j) => (
                                 <div key={j} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">{label}</p>
                                   <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{val}</p>
                                 </div>
                               ))}
                             </div>
                           </motion.div>
                         )
                       })}
            
            {(chartResumoIdade || chartResumoSexo) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {chartResumoIdade && chartResumoIdade.datasets[0].data.some(v => v > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                     <div className="flex items-center gap-2 mb-4">
                       <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                         <ChartBarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                       </div>
                       <h3 className="font-bold text-lg text-gray-900 dark:text-white">Distribuição por Idade</h3>
                     </div>
                     <div className="h-64 relative">
                       <Doughnut data={chartResumoIdade} options={pieOptions} />
                     </div>
                  </motion.div>
                )}
                
                {chartResumoSexo && chartResumoSexo.datasets[0].data.some(v => v > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                     <div className="flex items-center gap-2 mb-4">
                       <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                         <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                       </div>
                       <h3 className="font-bold text-lg text-gray-900 dark:text-white">Distribuição por Sexo</h3>
                     </div>
                     <div className="h-64 relative">
                       <Doughnut data={chartResumoSexo} options={pieOptions} />
                     </div>
                  </motion.div>
                )}
              </div>
            )}

            {reportData?.resumo?.erro && (
                         <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-center text-sm font-medium border border-red-100 dark:border-red-800">
                           {reportData.resumo.erro}
                         </div>
                      )}
                    </div>
                  )}

                  {temCalendario && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <FunnelIcon className="h-4 w-4" /> Tipo
                      </span>
                      <select
                        value={tipoFiltroCalendario || ''}
                        onChange={e => setTipoFiltroCalendario(e.target.value || '')}
                        className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Todos os tipos</option>
                        <option value="Chegada de Receptora">Chegada de Receptora</option>
                        <option value="Diagnóstico de Gestação">DG Agendado</option>
                        <option value="Parto Previsto">Parto Previsto</option>
                        <option value="Refazer Exame Andrológico">Refazer Andrológico</option>
                        <option value="Brucelose">Brucelose</option>
                        <option value="DGT">DGT</option>
                      </select>
                    </div>
                  )}

                  {temCalendario && contagemTiposCalendario && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'Chegada de Receptora' ? '' : 'Chegada de Receptora')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'Chegada de Receptora'
                            ? 'bg-blue-100 dark:bg-blue-800/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Chegadas</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{contagemTiposCalendario.chegadas}</p>
                      </button>
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'Diagnóstico de Gestação' ? '' : 'Diagnóstico de Gestação')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'Diagnóstico de Gestação'
                            ? 'bg-yellow-100 dark:bg-yellow-800/40 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">DG Agendados</p>
                        <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{contagemTiposCalendario.dg}</p>
                      </button>
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'Parto Previsto' ? '' : 'Parto Previsto')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'Parto Previsto'
                            ? 'bg-green-100 dark:bg-green-800/40 border-green-400 dark:border-green-600 ring-2 ring-green-400'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Partos Previstos</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">{contagemTiposCalendario.partos}</p>
                      </button>
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'Refazer Exame Andrológico' ? '' : 'Refazer Exame Andrológico')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'Refazer Exame Andrológico'
                            ? 'bg-orange-100 dark:bg-orange-800/40 border-orange-400 dark:border-orange-600 ring-2 ring-orange-400'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Refazer Andrológico</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{contagemTiposCalendario.andrologico}</p>
                      </button>
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'Brucelose' ? '' : 'Brucelose')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'Brucelose'
                            ? 'bg-rose-100 dark:bg-rose-800/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400'
                            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Brucelose</p>
                        <p className="text-lg font-bold text-rose-900 dark:text-rose-100">{contagemTiposCalendario.brucelose}</p>
                      </button>
                      <button
                        onClick={() => {
                          setTipoFiltroCalendario(tipoFiltroCalendario === 'DGT' ? '' : 'DGT')
                          setViewMode('table')
                        }}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          tipoFiltroCalendario === 'DGT'
                            ? 'bg-indigo-100 dark:bg-indigo-800/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400'
                            : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">DGT</p>
                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{contagemTiposCalendario.dgt}</p>
                      </button>
                      <button
                        onClick={() => setTipoFiltroCalendario('')}
                        className={`p-3 rounded-xl border transition-all col-span-2 sm:col-span-1 active:scale-95 ${
                          !tipoFiltroCalendario
                            ? 'bg-purple-100 dark:bg-purple-800/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400'
                            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-800/30'
                        }`}
                      >
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Total</p>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{contagemTiposCalendario.total}</p>
                      </button>
                    </div>
                  )}

                  {insights.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-gradient-to-br from-violet-50 to-amber-50 dark:from-violet-900/20 dark:to-amber-900/20 border border-violet-200 dark:border-violet-800 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="h-5 w-5 text-violet-500" />
                        <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">Resumo Inteligente</span>
                      </div>
                      <ul className="space-y-2">
                        {insights.map((ins, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-lg">{ins.icon}</span>
                            <span>{ins.text}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {dicaAtual && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    >
                      <LightBulbIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">{dicaAtual}</p>
                    </motion.div>
                  )}

                  {reportData.resumo && typeof reportData.resumo === 'object' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {Object.entries(reportData.resumo).slice(0, 6).map(([k, v], i) => {
                          const isPeso = /peso|kg/i.test(k)
                          const isAnimais = /animais|machos|fêmeas|total|piquetes/i.test(k)
                          const isTaxa = /taxa|prenhez/i.test(k)
                          const isClicavel = /machos?|fêmeas?|femeas?|animais únicos?|total de pesagens?|piquetes?|entradas?|saídas?|total nfs?|nf|notas?/i.test(k) && !/peso médio|peso medio/i.test(k)
                          const cardCls = isPeso ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800' :
                            isAnimais ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800' :
                            isTaxa ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800' :
                            'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border-gray-200 dark:border-gray-700'
                          const valCls = isPeso ? 'text-amber-700 dark:text-amber-300' :
                            isAnimais ? 'text-blue-700 dark:text-blue-300' :
                            isTaxa ? 'text-green-700 dark:text-green-300' :
                            'text-gray-900 dark:text-white'
                          const icon = isPeso ? '⚖️' : isAnimais ? '🐄' : isTaxa ? '✅' : '📊'
                          const taxaNum = /taxa|prenhez/i.test(k) ? parseFloat(String(v).replace('%', '')) : null
                          const isDestaque = taxaNum != null && taxaNum >= 50
                          return (
                            <motion.div
                              key={k}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              role={isClicavel ? 'button' : undefined}
                              tabIndex={isClicavel ? 0 : undefined}
                              onClick={isClicavel ? () => handleCardClick(k, v) : undefined}
                              onKeyDown={isClicavel ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(k, v) } : undefined}
                              whileHover={isClicavel ? { scale: 1.05, y: -2 } : {}}
                              whileTap={isClicavel ? { scale: 0.98 } : {}}
                              className={`p-4 rounded-xl border-2 shadow-sm relative overflow-hidden group ${cardCls} ${isClicavel ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
                            >
                              {isClicavel && (
                                <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              {isDestaque && (
                                <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400">
                                  ✓ Destaque
                                </span>
                              )}
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate flex-1">{k}</p>
                                <span className="text-base ml-1">{icon}</span>
                              </div>
                              <p className={`text-xl font-bold truncate ${valCls}`}>{String(v)}</p>
                              {isClicavel && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 opacity-70">
                                  Toque para ver detalhes
                                </p>
                              )}
                              {taxaNum != null && (
                                <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, taxaNum)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${taxaNum >= 50 ? 'bg-green-500' : taxaNum >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  />
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Modal de touros por raça */}
                  <AnimatePresence>
                    {racaModalOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setRacaModalOpen(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                🐂 Touros - {racaSelecionada}
                              </h3>
                              <p className="text-sm text-purple-100 mt-1">
                                {tourosRaca.length} {tourosRaca.length === 1 ? 'touro' : 'touros'} • {tourosRaca.reduce((sum, t) => sum + t.doses, 0)} doses
                              </p>
                            </div>
                            <button
                              onClick={() => setRacaModalOpen(false)}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <XMarkIcon className="h-6 w-6 text-white" />
                            </button>
                          </div>

                          {/* Conteúdo */}
                          <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
                            {tourosRaca.length === 0 ? (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>Nenhum touro encontrado para esta raça</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {tourosRaca.map((touro, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-lg">
                                            {idx === 0 && '🥇'}
                                            {idx === 1 && '🥈'}
                                            {idx === 2 && '🥉'}
                                            {idx > 2 && `${idx + 1}º`}
                                          </span>
                                          <p className="font-bold text-gray-900 dark:text-white text-base">
                                            {touro.touro}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {touro.registros} {touro.registros === 1 ? 'lote' : 'lotes'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-purple-600 text-white shadow-md">
                                          {touro.doses}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">doses</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Total Geral
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {tourosRaca.length} touros • {tourosRaca.reduce((sum, t) => sum + t.registros, 0)} lotes
                                </p>
                              </div>
                              <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-amber-500 text-white shadow-md">
                                {tourosRaca.reduce((sum, t) => sum + t.doses, 0)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Modal de acasalamentos por raça (embriões) */}
                  <AnimatePresence>
                    {racaEmbriaoModalOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setRacaEmbriaoModalOpen(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                🥚 Acasalamentos - {racaEmbriaoSelecionada}
                              </h3>
                              <p className="text-sm text-amber-100 mt-1">
                                {acasalamentosRaca.length} {acasalamentosRaca.length === 1 ? 'acasalamento' : 'acasalamentos'} • {acasalamentosRaca.reduce((sum, a) => sum + a.embrioes, 0)} embriões
                              </p>
                            </div>
                            <button
                              onClick={() => setRacaEmbriaoModalOpen(false)}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <XMarkIcon className="h-6 w-6 text-white" />
                            </button>
                          </div>

                          {/* Conteúdo */}
                          <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
                            {acasalamentosRaca.length === 0 ? (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>Nenhum acasalamento encontrado para esta raça</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {acasalamentosRaca.map((acasalamento, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-lg">
                                            {idx === 0 && '🥇'}
                                            {idx === 1 && '🥈'}
                                            {idx === 2 && '🥉'}
                                            {idx > 2 && `${idx + 1}º`}
                                          </span>
                                          <p className="font-bold text-gray-900 dark:text-white text-base">
                                            {acasalamento.acasalamento}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {acasalamento.registros} {acasalamento.registros === 1 ? 'lote' : 'lotes'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-amber-600 text-white shadow-md">
                                          {acasalamento.embrioes}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">embriões</p>
                                      </div>
                                    </div>
                                    {acasalamento.rack && acasalamento.botijao && acasalamento.caneca && 
                                     acasalamento.rack !== '-' && acasalamento.botijao !== '-' && acasalamento.caneca !== '-' && (
                                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Localização:</p>
                                        <div className="flex items-center gap-2 text-sm font-mono">
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Rack: {acasalamento.rack}
                                          </span>
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Botijão: {acasalamento.botijao}
                                          </span>
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Caneca: {acasalamento.caneca}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Total Geral
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {acasalamentosRaca.length} acasalamentos • {acasalamentosRaca.reduce((sum, a) => sum + a.registros, 0)} lotes
                                </p>
                              </div>
                              <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-amber-500 text-white shadow-md">
                                {acasalamentosRaca.reduce((sum, a) => sum + a.embrioes, 0)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  {viewMode === 'calendar' && temCalendario && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          </button>
                          <span className="text-base font-semibold text-gray-900 dark:text-white min-w-[140px] text-center capitalize">
                            {calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            const today = new Date()
                            today.setDate(1)
                            setCalendarMonth(today)
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600"
                        >
                          Hoje
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                          <div key={d} className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase text-center py-1">
                            {d}
                          </div>
                        ))}
                        {getMonthDays(calendarMonth).map((d, idx) => {
                          if (!d) {
                            return <div key={`empty-${idx}`} className="aspect-square" />
                          }
                          const key = d.toISOString().split('T')[0]
                          const list = eventosPorDia[key] || []
                          const isSelected = selectedDate === key
                          const isToday = key === new Date().toISOString().split('T')[0]
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedDate(key)}
                              className={`aspect-square p-1 rounded-lg border text-left transition-colors flex flex-col ${
                                isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500' :
                                isToday ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10' :
                                'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span className={`text-xs font-medium ${isSelected || isToday ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>
                                {d.getDate()}
                              </span>
                              {list.length > 0 && (
                                <span className="mt-auto text-[10px] px-1 py-0.5 rounded-full bg-amber-500/80 text-white font-medium">
                                  {list.length}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {selectedDate && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarIcon className="h-5 w-5 text-amber-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(selectedDate)} — {(eventosPorDia[selectedDate] || []).length} evento(s)
                            </span>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(eventosPorDia[selectedDate] || []).map((ev, i) => {
                              const status = ev.status || 'Agendado'
                              const borderCls =
                                status === 'Concluído' || status === 'Prenha' ? 'border-l-green-500' :
                                status === 'Vazia' ? 'border-l-red-500' :
                                'border-l-amber-500'
                              return (
                                <div
                                  key={i}
                                  className={`pl-3 py-2 rounded-r-lg border-l-4 bg-gray-50 dark:bg-gray-700/50 ${borderCls}`}
                                >
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {ev.titulo || ev.tipo || 'Evento'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {ev.tipo} {ev.animal ? `• ${ev.animal}` : ''}
                                  </p>
                                  {(ev.numero_nf || ev.fornecedor) && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                      {ev.numero_nf ? `NF ${ev.numero_nf}` : ''} {ev.fornecedor ? `• ${ev.fornecedor}` : ''}
                                    </p>
                                  )}
                                  {ev.descricao && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ev.descricao}</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {viewMode === 'charts' && temGraficos && (
                    <div className="space-y-4">
                      {chartPrenhez && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Taxa de Prenhez</p>
                          <div className="h-48">
                            <Doughnut data={chartPrenhez} options={pieOptions} />
                          </div>
                        </motion.div>
                      )}
                      {chartSexo && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Distribuição por Sexo</p>
                          <div className="h-48">
                            <Doughnut data={chartSexo} options={pieOptions} />
                          </div>
                        </motion.div>
                      )}

                      {chartBarPiquete && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Animais por Piquete</p>
                          <div className="h-56">
                            <Bar data={chartBarPiquete} options={chartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {chartPesoPiquete && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Peso Médio por Piquete (kg)</p>
                          <div className="h-56">
                            <Bar data={chartPesoPiquete} options={chartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {pesagensPorData && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pesagens ao longo do tempo</p>
                          <div className="h-48">
                            <Line data={pesagensPorData} options={lineChartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {inseminacoesPorTouro && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Inseminações por Touro</p>
                          <div className="h-56">
                            <Bar data={inseminacoesPorTouro} options={chartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {estoquePorTouro && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                          >
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estoque de Sêmen por Touro</p>
                            <div className="h-56">
                              <Bar data={estoquePorTouro} options={chartOptions} />
                            </div>
                          </motion.div>

                          {/* Card de resumo por raça */}
                          {estoquePorRaca && estoquePorRaca.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                              className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-700 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                                🐂 Estoque por Raça
                                <span className="text-xs font-normal text-purple-600 dark:text-purple-400">(clique para ver touros)</span>
                              </p>
                              <div className="grid grid-cols-1 gap-3">
                                {estoquePorRaca.map((item, idx) => (
                                  <div 
                                    key={idx}
                                    onClick={() => abrirModalRaca(item.raca)}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-purple-200 dark:border-purple-700 shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white text-base">
                                          {item.raca}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {item.touros} {item.touros === 1 ? 'touro' : 'touros'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-purple-600 text-white shadow-md">
                                          {item.doses}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">doses</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Tabela detalhada de estoque */}
                          {detalhesEstoqueSemen && detalhesEstoqueSemen.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                📊 Detalhamento Completo do Estoque
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">#</th>
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Touro</th>
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Raça</th>
                                      <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Doses</th>
                                      <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Lotes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalhesEstoqueSemen.map((item, idx) => (
                                      <tr 
                                        key={idx}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                      >
                                        <td className="py-2 px-2 text-gray-500 dark:text-gray-400">
                                          {idx === 0 && '🥇'}
                                          {idx === 1 && '🥈'}
                                          {idx === 2 && '🥉'}
                                          {idx > 2 && (idx + 1)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-900 dark:text-white font-medium">
                                          {item.touro}
                                        </td>
                                        <td className="py-2 px-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {item.raca}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                            {item.doses}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                                          {item.registros}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                                      <td colSpan="3" className="py-2 px-2 text-gray-900 dark:text-white">
                                        TOTAL
                                      </td>
                                      <td className="py-2 px-2 text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                          {detalhesEstoqueSemen.reduce((sum, item) => sum + item.doses, 0)}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-right text-gray-900 dark:text-white">
                                        {detalhesEstoqueSemen.reduce((sum, item) => sum + item.registros, 0)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* ========== EMBRIÕES ========== */}
                      {estoqueEmbriaoPorAcasalamento && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                          >
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🥚 Estoque de Embriões por Acasalamento</p>
                            <div className="h-56">
                              <Bar data={estoqueEmbriaoPorAcasalamento} options={chartOptions} />
                            </div>
                          </motion.div>

                          {/* Card de resumo por raça - Embriões */}
                          {estoqueEmbriaoPorRaca && estoqueEmbriaoPorRaca.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                              className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                                🥚 Estoque por Raça
                                <span className="text-xs font-normal text-amber-600 dark:text-amber-400">(clique para ver acasalamentos)</span>
                              </p>
                              <div className="grid grid-cols-1 gap-3">
                                {estoqueEmbriaoPorRaca.map((item, idx) => (
                                  <div 
                                    key={idx}
                                    onClick={() => abrirModalRacaEmbriao(item.raca)}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-200 dark:border-amber-700 shadow-sm cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white text-base">
                                          {item.raca}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {item.acasalamentos} {item.acasalamentos === 1 ? 'acasalamento' : 'acasalamentos'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-amber-600 text-white shadow-md">
                                          {item.embrioes}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">embriões</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Tabela detalhada de estoque de embriões */}
                          {detalhesEstoqueEmbrioes && detalhesEstoqueEmbrioes.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                📊 Detalhamento Completo do Estoque de Embriões
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">#</th>
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Acasalamento</th>
                                      <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Raça</th>
                                      <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Localização</th>
                                      <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-semibold">Embriões</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalhesEstoqueEmbrioes.map((item, idx) => (
                                      <tr 
                                        key={idx}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                      >
                                        <td className="py-2 px-2 text-gray-500 dark:text-gray-400">
                                          {idx === 0 && '🥇'}
                                          {idx === 1 && '🥈'}
                                          {idx === 2 && '🥉'}
                                          {idx > 2 && (idx + 1)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-900 dark:text-white font-medium">
                                          {item.acasalamento}
                                        </td>
                                        <td className="py-2 px-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {item.raca}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-center text-xs text-gray-600 dark:text-gray-400">
                                          {item.rack && item.botijao && item.caneca ? (
                                            <span className="inline-flex items-center gap-1">
                                              <span className="font-mono">{item.rack}</span>
                                              <span>/</span>
                                              <span className="font-mono">{item.botijao}</span>
                                              <span>/</span>
                                              <span className="font-mono">{item.caneca}</span>
                                            </span>
                                          ) : '-'}
                                        </td>
                                        <td className="py-2 px-2 text-right">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                            {item.embrioes}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                                      <td colSpan="4" className="py-2 px-2 text-gray-900 dark:text-white">
                                        TOTAL
                                      </td>
                                      <td className="py-2 px-2 text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                          {detalhesEstoqueEmbrioes.reduce((sum, item) => sum + item.embrioes, 0)}
                                        </span>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}

                      {nascimentosPorMes && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Nascimentos por Mês</p>
                          <div className="h-56">
                            <Bar data={nascimentosPorMes} options={chartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {nitrogenioEvolution && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📊 Evolução de Abastecimento</p>
                          <div className="h-48">
                            <Line data={nitrogenioEvolution} options={lineChartOptions} />
                          </div>
                        </motion.div>
                      )}

                      {nitrogenioByDriver && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🚚 Abastecimento por Motorista</p>
                          <div className="h-56">
                            <Bar data={nitrogenioByDriver} options={chartOptions} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {(viewMode === 'table' || (!temGraficos && !temCalendario && !ehResumoGeral)) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                    >
                      <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
                        {dadosParaExibir.length > 0 ? (() => {
                          const firstRow = reportData.data?.find(d => !d._resumo)
                          const columns = firstRow ? Object.keys(firstRow).filter(c => {
                            if (c === '_resumo' || c === 'animal_id') return false
                            const val = firstRow[c]
                            // Ocultar colunas com objetos/arrays (como a lista de animais)
                            if (typeof val === 'object' && val !== null) return false
                            return true
                          }) : []
                          
                          return (
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                              <tr>
                                {columns.map(col => (
                                  <th key={col} className="px-3 py-2.5 text-left text-gray-600 dark:text-gray-400 font-medium">
                                    {ehRanking ? (LABELS_RANKING[col] || col) : col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dadosParaExibir.map((row, i) => {
                                // Buscar a linha original completa do reportData para ter acesso ao campo animais
                                const originalRow = reportData.data?.find(d => 
                                  d.piquete === row.piquete || 
                                  (d.animal_id && d.animal_id === row.animal_id)
                                ) || row
                                
                                return (
                                <tr 
                                  key={i} 
                                  onClick={() => {
                                    // Se for o relatorio de animais por piquete e tiver a lista de animais
                                    if (selectedTipo === 'animais_piquetes' && originalRow.animais && Array.isArray(originalRow.animais)) {
                                      setCardFilterModal({
                                        open: true,
                                        title: `Animais em ${originalRow.piquete || 'Piquete'}`,
                                        filter: { piquete: originalRow.piquete },
                                        dataType: 'piquete_animais'
                                      })
                                      // Preservar todos os campos dos animais
                                      setCardAnimalsList(originalRow.animais.map(a => ({
                                        ...a,
                                        id: a.animal_id,
                                        identificacao: a.animal || `${a.serie || ''} ${a.rg || ''}`.trim()
                                      })))
                                      return
                                    }
                                    // Comportamento padrao: navegar para detalhes do animal
                                    if (row.animal_id) {
                                      router.push(`/animals/${row.animal_id}`)
                                    }
                                  }}
                                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${(row.animal_id || (selectedTipo === 'animais_piquetes' && originalRow.animais)) ? 'cursor-pointer' : ''}`}
                                >
                                  {columns.map(k => {
                                    const v = row[k]
                                    let display = k.toLowerCase().includes('data') && v ? formatDate(v) : String(v ?? '-')
                                    if (ehRanking && k === 'posicao' && [1, 2, 3].includes(Number(v))) {
                                      const trofeus = { 1: '🥇', 2: '🥈', 3: '🥉' }
                                      display = `${trofeus[Number(v)]} ${v}º`
                                    }
                                    return (
                                      <td key={k} className="px-3 py-2 text-gray-900 dark:text-white">
                                        {display}
                                      </td>
                                    )
                                  })}
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          )
                        })() : (
                          <div className="p-12 text-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4"
                            >
                              <span className="text-4xl">📋</span>
                            </motion.div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                              {searchQuery.trim() ? 'Nenhum registro encontrado' : 'Nenhum registro no período'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {searchQuery.trim() ? 'Tente outro termo de busca' : 'Ajuste as datas ou selecione outro relatório'}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {!loadingData && !reportData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center"
                >
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-700 dark:text-red-300 font-medium">Erro ao carregar relatório</p>
                  <button
                    onClick={refetch}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {selectedTipo && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20">
              <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTipo(null)}
                  className="flex items-center justify-center gap-1 py-3 rounded-xl bg-amber-600 dark:bg-amber-500 text-white font-semibold text-sm"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Voltar
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center justify-center gap-1 py-3 rounded-xl bg-gray-600 dark:bg-gray-500 text-white font-semibold text-sm"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Exportar
                </button>
                <button
                  onClick={handleShareSummary}
                  disabled={sharing}
                  className="flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sharing ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Compartilhando
                    </>
                  ) : (
                    <>
                      <ShareIcon className="h-5 w-5" />
                      Compartilhar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
