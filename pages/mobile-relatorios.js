/**
 * Relatórios visíveis no mobile.
 * Gráficos, KPI cards, animações e visual aprimorado.
 */
import {
    ArrowPathIcon,
    ArrowRightOnRectangleIcon,
    BanknotesIcon,
    BeakerIcon,
    BellIcon,
    CalendarIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon as CheckCircleOutlineIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClockIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    FunnelIcon,
    HeartIcon,
    LightBulbIcon,
    MagnifyingGlassIcon,
    MoonIcon,
    ScaleIcon,
    SparklesIcon,
    StarIcon,
    UserGroupIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import {
    StarIcon as StarIconSolid
} from '@heroicons/react/24/solid'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import BottomTabBar from '../components/mobile-relatorios/BottomTabBar'
import CardInfoModal from '../components/mobile-relatorios/CardInfoModal'
import HomeHeroSection from '../components/mobile-relatorios/HomeHeroSection'
import HomeQuickAccessSection from '../components/mobile-relatorios/HomeQuickAccessSection'
import MobileReportsLoadingSkeleton from '../components/mobile-relatorios/MobileReportsLoadingSkeleton'
import MobileReportsTopBar from '../components/mobile-relatorios/MobileReportsTopBar'
import ReportActionBar from '../components/mobile-relatorios/ReportActionBar'
import ReportsSearchAndFilter from '../components/mobile-relatorios/ReportsSearchAndFilter'
import { useAuth } from '../contexts/AuthContext'
import {
    buildConsultaAnimalId,
    buildMedLocalKeys,
    CORES_PIQUETE,
    DESCRICOES_CARDS,
    diasAte,
    diasDesde,
    formatDate,
    formatDisplayValue,
    formatMoneyBR,
    getColumnLabelByContext,
    ICONE_POR_CATEGORIA,
    matchReportSearch,
    medsDoRowFromMaps,
    MOBILE_RELATORIOS_CATS,
    racaDisplay,
    racaKey,
    sortMedsByDate,
    ultimoMedRowFromMaps
} from '../utils/mobileRelatoriosUtils'

if (typeof window !== 'undefined') {
  ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)
}

export default function MobileRelatorios() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [currentTab, setCurrentTab] = useState('home')
  const [showMenu, setShowMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Obter nome e email do usuário logado
  const userName = useMemo(() => {
    if (user?.user_metadata?.nome) return user.user_metadata.nome
    if (user?.email) return user.email.split('@')[0]
    try {
      const mob = localStorage.getItem('mobile-auth')
      if (mob) {
        const d = JSON.parse(mob)
        if (d.nome) return d.nome
      }
    } catch (_) {}
    try {
      const auth = localStorage.getItem('maintenance_auth')
      if (auth) {
        const d = JSON.parse(auth)
        if (d.nome) return d.nome
      }
    } catch (_) {}
    return 'Fazendeiro'
  }, [user])

  const userEmail = useMemo(() => {
    if (user?.email) return user.email
    try {
      const mob = localStorage.getItem('mobile-auth')
      if (mob) {
        const d = JSON.parse(mob)
        if (d.email) return d.email
        if (d.telefone) return d.telefone
      }
    } catch (_) {}
    return ''
  }, [user])

  const userInitials = useMemo(() => {
    const parts = userName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return userName.slice(0, 2).toUpperCase()
  }, [userName])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (_) {}
    localStorage.removeItem('mobile-auth')
    localStorage.removeItem('beef_adelso_auth')
    localStorage.removeItem('maintenance_auth')
    localStorage.removeItem('beef_usuario_identificado')
    router.push('/login')
  }

  const CATS = MOBILE_RELATORIOS_CATS

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
  const [lastUpdate, setLastUpdate] = useState(null)
  const [, setUpdateTick] = useState(0)
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
  const [resumoDetalheModal, setResumoDetalheModal] = useState({ open: false, tipo: null, valor: null, titulo: '', qtd: 0 })

  // ── Medicamentos ──────────────────────────────────────────────────────────
  const [medicamentos, setMedicamentos] = useState({})
  const [medicamentosPorLocal, setMedicamentosPorLocal] = useState({})
  const [modalMed, setModalMed] = useState(null) // { row }
  const [formMed, setFormMed] = useState({ medicamento: '', dataAplicacao: '', dataProxima: '', observacao: '' })
  const [salvandoMed, setSalvandoMed] = useState(false)
  const [isAdelso, setIsAdelso] = useState(false)

  // ── Tipos que redirecionam para páginas externas ──────────────────────────
  const handleSelectTipo = useCallback((key) => {
    if (key === 'relatorio_vendas') {
      router.push('/notas-fiscais/relatorio')
      return
    }
    setSelectedTipo(key)
  }, [router])
  
  // ── Movimentação Boletim Campo (Adelso) ────────────────────────────────────
  const [modalMovBoletimCampo, setModalMovBoletimCampo] = useState(null)
  const [boletimQuantDraft, setBoletimQuantDraft] = useState({})
  const [salvandoMovBoletimCampo, setSalvandoMovBoletimCampo] = useState(false)

  useEffect(() => {
    try {
      // Verificar via Supabase user
      if (user?.user_metadata?.nome === 'Adelso') { setIsAdelso(true); return }
      const auth = localStorage.getItem('maintenance_auth')
      if (auth) {
        const d = JSON.parse(auth)
        if (d.nome === 'Adelso') { setIsAdelso(true); return }
      }
      const mob = localStorage.getItem('mobile-auth')
      if (mob) {
        const d = JSON.parse(mob)
        if (d.nome === 'Adelso') setIsAdelso(true)
      }
    } catch (_) {}
  }, [user])

  const medsDoRow = (rowOrId, fallbackRow = null) => {
    return medsDoRowFromMaps(rowOrId, fallbackRow, medicamentos, medicamentosPorLocal)
  }

  const ultimoMedRow = (rowOrId, fallbackRow = null) =>
    ultimoMedRowFromMaps(rowOrId, fallbackRow, medicamentos, medicamentosPorLocal)

  const carregarMedicamentos = async () => {
    try {
      const res = await fetch(`/api/boletim-campo/medicamentos?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        const mapById = {}
        const mapByLocal = {}
        ;(json.data || []).forEach(m => {
          const idKey = m.boletim_campo_id
          if (idKey != null) {
            if (!mapById[idKey]) mapById[idKey] = []
            mapById[idKey].push(m)
          }

          const localKeys = buildMedLocalKeys(m.local, m.local_1, m.sub_local_2)
          localKeys.forEach((localKey) => {
            if (!mapByLocal[localKey]) mapByLocal[localKey] = []
            mapByLocal[localKey].push(m)
          })
        })
        Object.keys(mapById).forEach(key => { mapById[key].sort(sortMedsByDate) })
        Object.keys(mapByLocal).forEach(key => { mapByLocal[key].sort(sortMedsByDate) })
        setMedicamentos(mapById)
        setMedicamentosPorLocal(mapByLocal)
      }
    } catch (_) {}
  }

  const salvarMedicamentoRel = async () => {
    if (!formMed.medicamento.trim() || !formMed.dataAplicacao) {
      alert('Informe o medicamento e a data de aplicação')
      return
    }
    setSalvandoMed(true)
    try {
      const row = modalMed.row
      const res = await fetch('/api/boletim-campo/medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletim_campo_id: row.id,
          local: row.local,
          local_1: row.local_1,
          sub_local_2: row.sub_local_2,
          medicamento: formMed.medicamento.trim(),
          data_aplicacao: formMed.dataAplicacao,
          data_proxima_aplicacao: formMed.dataProxima || null,
          observacao: formMed.observacao || null,
          usuario: 'Adelso'
        })
      })
      const json = await res.json()
      if (json.success) {
        await carregarMedicamentos()
        setFormMed({ medicamento: '', dataAplicacao: new Date().toISOString().split('T')[0], dataProxima: '', observacao: '' })
      } else alert(json.message || 'Erro ao salvar')
    } catch (_) { alert('Erro ao salvar') }
    finally { setSalvandoMed(false) }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const registrarMovimentacaoBoletimCampo = async ({ tipo, motivo, quantidade, origemRow, destinoRow }) => {
    if (!origemRow?.id) return
    try {
      setSalvandoMovBoletimCampo(true)
      const destinoLocalTxt = destinoRow?.local != null ? String(destinoRow.local).trim() : ''
      const destinoLocal = destinoLocalTxt && destinoLocalTxt !== '-' ? destinoLocalTxt : null
      const destinoLocal1Txt = destinoRow?.local_1 != null ? String(destinoRow.local_1).trim() : ''
      const destinoSubLocal2Txt = destinoRow?.sub_local_2 != null ? String(destinoRow.sub_local_2).trim() : ''
      const destinoSubLocal =
        destinoLocal1Txt && destinoLocal1Txt !== '-'
          ? destinoLocal1Txt
          : (destinoSubLocal2Txt && destinoSubLocal2Txt !== '-' ? destinoSubLocal2Txt : null)

      const payload = {
        boletimCampoId: origemRow.id,
        tipo,
        destinoLocal: motivo === 'piquete' ? destinoLocal : null,
        destinoSubLocal: motivo === 'piquete' ? destinoSubLocal : null,
        motivo,
        quantidade: parseInt(quantidade) || 0,
        usuario: 'Adelso',
        sexo: origemRow.sexo || null,
        era: origemRow.era || null,
        raca: origemRow.raca || null,
        categoria: origemRow.categoria || null,
        observacao: origemRow.observacao || null
      }

      await fetch('/api/boletim-campo/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Recarregar relatório e medicamentos após a movimentação
      setModalMovBoletimCampo(null)
      setBoletimQuantDraft({})
      await carregarMedicamentos()
      refetch()
    } catch (e) {
      console.error(e)
      alert('Erro ao registrar movimentação (boletim campo).')
    } finally {
      setSalvandoMovBoletimCampo(false)
    }
  }
  const [cardInfoModal, setCardInfoModal] = useState({ open: false, title: '', value: '', description: '', reportKey: null })

  useEffect(() => {
    fetch(`/api/mobile-reports?t=${Date.now()}`, { cache: 'no-store' })
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

  // Abrir relatório via query param (?tipo=boletim_campo)
  useEffect(() => {
    if (!config || !router.isReady) return
    const { tipo } = router.query
    if (tipo && config.enabled?.includes(tipo)) {
      setSelectedTipo(tipo)
      setCurrentTab('reports')
    }
  }, [config, router.isReady, router.query])

  // Inicializar tema
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedDarkMode === 'true' || (!savedDarkMode && prefersDark)
    setIsDarkMode(shouldBeDark)
  }, [])

  // Carregar dashboard (resumo geral) na entrada e ao mudar período
  useEffect(() => {
    if (!config?.enabled?.includes('resumo_geral')) return
    const params = new URLSearchParams({
      tipo: 'resumo_geral',
      startDate: period.startDate,
      endDate: period.endDate
    })
    params.set('t', Date.now().toString())
    fetch(`/api/mobile-reports?${params}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setDashboardData(d.data)
      })
      .catch(() => {})
  }, [config?.enabled, period.startDate, period.endDate])

  useEffect(() => {
    if (!selectedTipo) {
      setReportData(null)
      setSearchQuery('')
      return
    }
    setLoadingData(true)

    if (selectedTipo === 'ranking_mgte') {
      fetch(`/api/animals/ranking-mgte?limit=50&serie=${serieFilter}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setReportData(d.data)
            saveRecent(selectedTipo)
            setLastUpdate(new Date())
          } else {
            setReportData([])
          }
        })
        .catch(() => setReportData([]))
        .finally(() => setLoadingData(false))
      return
    }

    const params = new URLSearchParams({
      tipo: selectedTipo,
      startDate: period.startDate,
      endDate: period.endDate
    })
    if ((selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados') && serieFilter) {
      params.set('serie', serieFilter)
    }
    if (selectedTipo === 'boletim_campo') carregarMedicamentos()

    params.set('t', Date.now().toString())
    fetch(`/api/mobile-reports?${params}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setReportData(d.data)
          saveRecent(selectedTipo)
          setLastUpdate(new Date())
        }
        else setReportData(null)
      })
      .catch(() => setReportData(null))
      .finally(() => setLoadingData(false))
  }, [selectedTipo, period.startDate, period.endDate, serieFilter])

  // Auto-refresh: recarregar dados automaticamente a cada 5 segundos
  useEffect(() => {
    if (!selectedTipo) return
    
    const intervalId = setInterval(() => {
      const params = new URLSearchParams({
        tipo: selectedTipo,
        startDate: period.startDate,
        endDate: period.endDate
      })
      if ((selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados') && serieFilter) {
        params.set('serie', serieFilter)
      }

      // Para Boletim Campo, atualizar também histórico de medicamentos
      if (selectedTipo === 'boletim_campo') {
        carregarMedicamentos()
      }
      
      // Buscar dados sem mostrar loading para não interromper a visualização
      params.set('t', Date.now().toString())
      fetch(`/api/mobile-reports?${params}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setReportData(d.data)
            setLastUpdate(new Date())
          }
        })
        .catch(() => {})
    }, 5000) // 5 segundos

    return () => clearInterval(intervalId)
  }, [selectedTipo, period.startDate, period.endDate, serieFilter])

  // Atualizar o texto "há Xmin" a cada minuto
  useEffect(() => {
    if (!lastUpdate) return
    
    const tickInterval = setInterval(() => {
      setUpdateTick(t => t + 1)
    }, 60000) // 1 minuto

    return () => clearInterval(tickInterval)
  }, [lastUpdate])

  useEffect(() => {
    if (selectedTipo === 'calendario_reprodutivo') {
      setViewMode('calendar')
    }
  }, [selectedTipo])

  // Ao selecionar um relatório, rolar para o topo para exibir o conteúdo
  useEffect(() => {
    if (selectedTipo) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
    
    // piquete_animais: se skipFetch, lista já foi setada no click (animais_piquetes)
    if (cardFilterModal.dataType === 'piquete_animais' && cardFilterModal.skipFetch) {
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

  const formatMoney = formatMoneyBR
  const formatValue = formatDisplayValue

  const showCardInfo = useCallback((title, value, reportKey = null) => {
    const desc = DESCRICOES_CARDS[title] || DESCRICOES_CARDS[title?.trim?.()] || `Informação sobre ${title}.`
    const rawVal = typeof value === 'object' && value !== null
      ? (value.total ?? value.valor ?? value.quantidade ?? value.custos ?? value.vendas)
      : value
    setCardInfoModal({ open: true, title, value: formatValue(rawVal), description: desc, reportKey })
  }, [])

  const handleCardClick = useCallback((k, v) => {
    const key = String(k).toLowerCase()
    const displayValue = formatValue(v)
    if (/machos?\b/i.test(k)) {
      setCardFilterModal({ open: true, title: `Machos (${displayValue})`, filter: { sexo: 'Macho' }, dataType: 'animais' })
      return
    }
    if (/fêmeas?|femeas?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Fêmeas (${displayValue})`, filter: { sexo: 'Fêmea' }, dataType: 'animais' })
      return
    }
    if (/animais únicos?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Animais únicos (${displayValue})`, filter: {}, dataType: 'animais' })
      return
    }
    if (/total de pesagens?/i.test(k)) {
      setSelectedTipo('pesagens')
      setViewMode('table')
      return
    }
    if (/piquetes?/i.test(k)) {
      setCardFilterModal({ open: true, title: `Piquetes (${displayValue})`, filter: {}, dataType: 'piquetes' })
      return
    }
    if (/peso médio|peso medio/i.test(k)) return
    
    // Mapeamento direto para relatórios (clique no card abre a lista)
    const reportMap = {
      Custos: 'custos',
      Vendas: 'movimentacoes_financeiras',
      Vacinações: 'vacinacoes',
      Mortes: 'mortes',
      'Touros (sêmen)': 'estoque_semen',
      'Doses Sêmen': 'estoque_semen',
      Acasalamentos: 'estoque_embrioes',
      'Embriões Disp.': 'estoque_embrioes',
      financeiro: 'custos',
      estoque: 'estoque_semen',
      'Valor total': 'custos',
      'Total de custos': 'custos'
    }

    if (reportMap[k]) {
      setSelectedTipo(reportMap[k])
      setViewMode('table')
      return
    }

    showCardInfo(k, v, reportMap[k] || null)
  }, [formatValue, showCardInfo])

  const enabledReports = config?.enabled || []
  const allTypes = config?.allTypes || []
  const tiposHabilitados = allTypes.filter(t => enabledReports.includes(t.key))
  const porCategoria = tiposHabilitados.reduce((acc, t) => {
    const cat = t.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})
  const categoriasComRelatorios = Object.entries(porCategoria)
    .map(([cat, tipos]) => ({ cat, tipos }))
    .filter(({ tipos }) => tipos.length > 0)
  const matchSearch = (label, key) => matchReportSearch(label, key, searchReports)
  const showRanking = enabledReports.includes('ranking_animais_avaliados') || enabledReports.includes('ranking_pmgz') || enabledReports.includes('ranking_mgte')
  const ehRanking = selectedTipo === 'ranking_pmgz' || selectedTipo === 'ranking_animais_avaliados' || selectedTipo === 'ranking_mgte'
  const ehBoletimCampo = selectedTipo === 'boletim_campo'
  const ehBoletimDefesa = selectedTipo === 'boletim_defesa'
  const ehBoletimRebanho = selectedTipo === 'boletim_rebanho'
  const ehBoletim = ehBoletimCampo || ehBoletimDefesa || ehBoletimRebanho
  const getColumnLabel = (col) =>
    getColumnLabelByContext(col, { ehRanking, ehBoletimCampo, ehBoletimDefesa, ehBoletimRebanho })

  const filteredData = reportData?.data?.filter(d => {
    if (d._resumo) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    // Busca em campos normais
    if (Object.values(d).some(v => v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q))) return true
    // Resumo de pesagens / animais_piquetes: buscar dentro do array animais (rg, serie, animal)
    const animais = d.animais || []
    if (Array.isArray(animais) && animais.some(a => {
      if (!a || typeof a !== 'object') return false
      const rg = String(a.rg ?? '').toLowerCase()
      const serie = String(a.serie ?? '').toLowerCase()
      const animal = String(a.animal ?? '').toLowerCase()
      const ident = String(a.identificacao ?? '').toLowerCase()
      return rg.includes(q) || serie.includes(q) || animal.includes(q) || ident.includes(q)
    })) return true
    return false
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
      const raca = racaDisplay(racaKey(r.raca))
      if (!porTouro[t]) {
        porTouro[t] = { total: 0, registros: 0, raca }
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

  // Estoque agrupado por raça (case-insensitive: NELORE + Nelore = uma única entrada)
  const estoquePorRaca = selectedTipo === 'estoque_semen' && filteredData.length > 0 ? (() => {
    const porRaca = {}
    filteredData.forEach(r => {
      const key = racaKey(r.raca)
      const q = Number(r.quantidade) || 0
      if (!porRaca[key]) {
        porRaca[key] = { total: 0, touros: new Set() }
      }
      porRaca[key].total += q
      if (r.touro) porRaca[key].touros.add(r.touro.trim())
    })
    return Object.entries(porRaca)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([key, dados]) => ({
        raca: racaDisplay(key),
        racaKey: key,
        doses: dados.total,
        touros: dados.touros.size
      }))
  })() : null

  // ========== EMBRIÕES ==========
  // Gráfico de estoque de embriões por acasalamento
  const estoqueEmbriaoPorAcasalamento = selectedTipo === 'estoque_embrioes' && filteredData.length > 0 ? (() => {
    const porAcasalamento = {}
    // Filtrar apenas registros que são realmente embriões (têm acasalamento preenchido)
    const embrioesReais = filteredData.filter(r => r.acasalamento && r.acasalamento.trim())
    
    embrioesReais.forEach(r => {
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
    // Filtrar apenas registros que são realmente embriões (têm acasalamento preenchido)
    const embrioesReais = filteredData.filter(r => r.acasalamento && r.acasalamento.trim())
    
    embrioesReais.forEach(r => {
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

  // Estoque de embriões agrupado por raça (case-insensitive)
  const estoqueEmbriaoPorRaca = selectedTipo === 'estoque_embrioes' && filteredData.length > 0 ? (() => {
    const porRaca = {}
    const embrioesReais = filteredData.filter(r => r.acasalamento && r.acasalamento.trim())
    
    embrioesReais.forEach(r => {
      const key = racaKey(r.raca)
      const q = Number(r.quantidade) || 0
      if (!porRaca[key]) {
        porRaca[key] = { total: 0, acasalamentos: new Set() }
      }
      porRaca[key].total += q
      if (r.acasalamento) porRaca[key].acasalamentos.add(r.acasalamento.trim())
    })
    return Object.entries(porRaca)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([key, dados]) => ({
        raca: racaDisplay(key),
        embrioes: dados.total,
        acasalamentos: dados.acasalamentos.size
      }))
  })() : null

  // Função para abrir modal com touros de uma raça específica
  const abrirModalRaca = (raca) => {
    if (!filteredData || filteredData.length === 0) return
    
    const racaBusca = racaKey(raca)
    const porTouro = {}
    filteredData.forEach(r => {
      const racaItem = racaKey(r.raca)
      if (racaItem === racaBusca) {
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
    
    const racaBusca = racaKey(raca)
    const porAcasalamento = {}
    filteredData.forEach(r => {
      const racaItem = racaKey(r.raca)
      if (racaItem === racaBusca) {
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

  // Cada item decide individualmente: nome com "ACASALAMENTO" → embriões, senão → doses de sêmen
  const itemEhEmbriao = (acasalamento) =>
    typeof acasalamento === 'string' && acasalamento.toUpperCase().includes('ACASALAMENTO')

  // Compatibilidade: true só quando TODOS os itens são embriões (usado em partes fora do loop)
  const modalEhEmbriao = acasalamentosRaca.length > 0 &&
    acasalamentosRaca.every(a => itemEhEmbriao(a.acasalamento))

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
    params.set('t', Date.now().toString())
    fetch(`/api/mobile-reports?${params}`, { cache: 'no-store' })
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
    const valorKey = Object.keys(baseDados[0] || {}).find(k => /^iABCZ$|^valor$|^iqg$|^mgte$/i.test(k))
    if (!valorKey) return baseDados
    const parseVal = (v) => parseFloat(String(v || '0').replace(',', '.')) || 0
    const rankingKey = baseDados[0]?.ranking != null ? 'ranking' : null
    const sorted = [...baseDados].sort((a, b) => {
      if (rankingKey && a[rankingKey] !== b[rankingKey]) {
        const order = ['iABCZ', 'Peso', 'CE', 'IQG', 'MGTe']
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
      const dgt = porTipo['DGT'] || contagemTiposCalendario?.dgt || 0
      list.push({ icon: '📅', text: `${dados.length} evento(s) no calendário` })
      if (partos > 0) list.push({ icon: '🐄', text: `${partos} parto(s) previsto(s) no período` })
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
    animais_dgt: 'Animais entre 11 e 21 meses (330-640 dias) elegíveis para avaliação de desempenho DGT.',
    boletim_rebanho: 'Quantidades por raça, sexo e era, conforme o Boletim Campo. Mantém os dados sempre alinhados.'
  }
  const dicaAtual = selectedTipo ? DICAS_POR_TIPO[selectedTipo] : null

  const handleShareSummary = async () => {
    try {
      setSharing(true)
      const titulo = `Relatório: ${selectedTipo || 'Geral'}`
      const resumoTxt = reportData?.resumo && typeof reportData.resumo === 'object'
        ? Object.entries(reportData.resumo).map(([k, v]) => `${k}: ${formatValue(v)}`).join('\n')
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

  const handleShareWhatsApp = () => {
    try {
      const titulo = `📊 *Relatório: ${selectedTipo || 'Geral'}*`
      const resumoTxt = reportData?.resumo && typeof reportData.resumo === 'object'
        ? Object.entries(reportData.resumo).map(([k, v]) => `• ${k}: ${formatValue(v)}`).join('\n')
        : null
      
      let detalhes = ''
      
      // Detalhes para acasalamentos
      if (selectedTipo === 'acasalamentos' && dadosParaExibir.length > 0) {
        detalhes = '\n\n*Acasalamentos:*\n' + dadosParaExibir.slice(0, 10).map((a, i) => 
          `${i + 1}. ${a.animal || a.identificacao || '-'} (${a.embrioes || 0} embriões)`
        ).join('\n')
        if (dadosParaExibir.length > 10) {
          detalhes += `\n... e mais ${dadosParaExibir.length - 10} acasalamentos`
        }
      }
      
      // Detalhes para estoque de sêmen
      if (selectedTipo === 'estoque_semen' && detalhesEstoqueSemen && detalhesEstoqueSemen.length > 0) {
        const totalDoses = detalhesEstoqueSemen.reduce((s, t) => s + t.doses, 0)
        detalhes = `\n\n*Estoque de Sêmen:*\n`
        detalhes += `🧪 Total: ${totalDoses} doses\n`
        detalhes += `🐂 Touros: ${detalhesEstoqueSemen.length}\n\n`
        detalhes += '*Top 10 Touros:*\n'
        detalhes += detalhesEstoqueSemen.slice(0, 10).map((t, i) => 
          `${i + 1}. ${t.touro}\n   • ${t.doses} doses (${t.registros} lote${t.registros > 1 ? 's' : ''})\n   • Raça: ${t.raca}`
        ).join('\n')
        if (detalhesEstoqueSemen.length > 10) {
          detalhes += `\n... e mais ${detalhesEstoqueSemen.length - 10} touros`
        }
        
        // Adicionar resumo por raça se disponível
        if (estoquePorRaca && estoquePorRaca.length > 0) {
          detalhes += '\n\n*Por Raça:*\n'
          detalhes += estoquePorRaca.slice(0, 5).map((r, i) => 
            `${i + 1}. ${r.raca}: ${r.doses} doses (${r.touros} touro${r.touros > 1 ? 's' : ''})`
          ).join('\n')
        }
      }
      
      // Detalhes para estoque de embriões
      if (selectedTipo === 'estoque_embrioes' && detalhesEstoqueEmbrioes && detalhesEstoqueEmbrioes.length > 0) {
        const totalEmbrioes = detalhesEstoqueEmbrioes.reduce((s, a) => s + a.embrioes, 0)
        detalhes = `\n\n*Estoque de Embriões:*\n`
        detalhes += `🧬 Total: ${totalEmbrioes} embriões\n`
        detalhes += `🐄 Acasalamentos: ${detalhesEstoqueEmbrioes.length}\n\n`
        detalhes += '*Top 10 Acasalamentos:*\n'
        detalhes += detalhesEstoqueEmbrioes.slice(0, 10).map((a, i) => 
          `${i + 1}. ${a.acasalamento}\n   • ${a.embrioes} embriões\n   • Raça: ${a.raca}\n   • Local: R${a.rack} B${a.botijao} C${a.caneca}`
        ).join('\n')
        if (detalhesEstoqueEmbrioes.length > 10) {
          detalhes += `\n... e mais ${detalhesEstoqueEmbrioes.length - 10} acasalamentos`
        }
        
        // Adicionar resumo por raça se disponível
        if (estoqueEmbriaoPorRaca && estoqueEmbriaoPorRaca.length > 0) {
          detalhes += '\n\n*Por Raça:*\n'
          detalhes += estoqueEmbriaoPorRaca.slice(0, 5).map((r, i) => 
            `${i + 1}. ${r.raca}: ${r.embrioes} embriões (${r.acasalamentos} acasalamento${r.acasalamentos > 1 ? 's' : ''})`
          ).join('\n')
        }
      }
      
      const texto = [
        titulo,
        `📅 Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`,
        `📋 Registros: ${totalRegistros}`,
        resumoTxt ? `\n*Resumo:*\n${resumoTxt}` : null,
        detalhes || null,
        '\n_Gerado pelo Beef-Sync_'
      ].filter(Boolean).join('\n')
      
      const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
      window.open(url, '_blank')
      setToast({ type: 'success', msg: 'Abrindo WhatsApp...' })
    } catch (e) {
      setToast({ type: 'error', msg: 'Erro ao compartilhar' })
    }
  }

  const handleShareEmail = () => {
    try {
      const titulo = `Relatório: ${selectedTipo || 'Geral'}`
      const resumoTxt = reportData?.resumo && typeof reportData.resumo === 'object'
        ? Object.entries(reportData.resumo).map(([k, v]) => `${k}: ${formatValue(v)}`).join('\n')
        : null
      
      const corpo = [
        `Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`,
        `Registros: ${totalRegistros}`,
        resumoTxt ? `\nResumo:\n${resumoTxt}` : null,
        '\n\nGerado pelo Beef-Sync'
      ].filter(Boolean).join('\n')
      
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`
      window.location.href = mailtoUrl
      setToast({ type: 'success', msg: 'Abrindo email...' })
    } catch (e) {
      setToast({ type: 'error', msg: 'Erro ao abrir email' })
    }
  }

  const handleShareModalWhatsApp = (tipo, titulo, dados) => {
    try {
      let texto = `📊 *${titulo}*\n\n`
      
      if (tipo === 'touros') {
        const totalDoses = dados.reduce((s, t) => s + t.doses || s + t.embrioes, 0)
        const totalLotes = dados.reduce((s, t) => s + t.registros, 0)
        texto += `🐂 Total: ${dados.length} touros\n`
        texto += `🧪 Doses: ${totalDoses}\n`
        texto += `📦 Lotes: ${totalLotes}\n\n`
        texto += '*Ranking:*\n'
        texto += dados.slice(0, 15).map((t, i) => {
          const doses = t.doses || t.embrioes || 0
          return `${i + 1}. ${t.touro || t.acasalamento}\n   • ${doses} doses (${t.registros} lote${t.registros > 1 ? 's' : ''})`
        }).join('\n')
        if (dados.length > 15) {
          texto += `\n... e mais ${dados.length - 15} touros`
        }
      } else if (tipo === 'acasalamentos' || tipo === 'estoque') {
        const totalEmbrioes = dados.reduce((s, a) => s + a.embrioes, 0)
        const totalLotes = dados.reduce((s, a) => s + a.registros, 0)
        texto += `� Total: ${dados.length} acasalamentos\n`
        texto += `🧬 Embriões: ${totalEmbrioes}\n`
        texto += `📦 Lotes: ${totalLotes}\n\n`
        texto += '*Ranking:*\n'
        texto += dados.slice(0, 15).map((a, i) => 
          `${i + 1}. ${a.acasalamento}\n   • ${a.embrioes} embriões (${a.registros} lote${a.registros > 1 ? 's' : ''})\n   • Local: R${a.rack} B${a.botijao} C${a.caneca}`
        ).join('\n')
        if (dados.length > 15) {
          texto += `\n... e mais ${dados.length - 15} acasalamentos`
        }
      }
      
      texto += '\n\n_Gerado pelo Beef-Sync_'
      
      const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
      window.open(url, '_blank')
      setToast({ type: 'success', msg: 'Abrindo WhatsApp...' })
    } catch (e) {
      setToast({ type: 'error', msg: 'Erro ao compartilhar' })
    }
  }

  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [shareModalMenuOpen, setShareModalMenuOpen] = useState(false)
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
    'mes_anterior': () => {
      const d = new Date()
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
      const end = new Date(d.getFullYear(), d.getMonth(), 0)
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
    },
    '3meses': () => {
      const end = new Date()
      const start = new Date(end); start.setMonth(start.getMonth() - 3)
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
        <title>Relatórios | Beef-Sync — Gestão Inteligente de Rebanho</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Painel de relatórios e visão geral da sua fazenda. Beef-Sync - Gestão inteligente de rebanho." />
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
                    {cardAnimalsList
                  .filter(row => (row.Animais ?? row.total ?? 0) > 0)
                  .map((row, idx) => {
                  const piqueteNome = (row.Piquete || row.piquete || '-').replace(/PROJETO\s*/i, 'PROJETO ')
                  const totalAnimais = row.Animais ?? row.total ?? 0
                  const machos = row.Machos ?? row.machos ?? 0
                  const femeas = row.Fêmeas ?? row.femeas ?? row.Femeas ?? 0
                  const mediaPeso = row['Média Peso (kg)'] ?? row.mediaPeso ?? row.media_peso
                  const cor = CORES_PIQUETE[idx % CORES_PIQUETE.length]
                  
                  // Cálculos para barra de proporção visual
                  const totalMF = machos + femeas
                  const percMachos = totalMF > 0 ? (machos / totalMF) * 100 : 0
                  const percFemeas = totalMF > 0 ? (femeas / totalMF) * 100 : 0
                  
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
                      
                      {machos > 0 && femeas > 0 && (
                        <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex" title={`Machos: ${percMachos.toFixed(0)}% | Fêmeas: ${percFemeas.toFixed(0)}%`}>
                          <div style={{ width: `${percMachos}%` }} className="bg-blue-400 dark:bg-blue-500 h-full" />
                          <div style={{ width: `${percFemeas}%` }} className="bg-pink-400 dark:bg-pink-500 h-full" />
                        </div>
                      )}
                          
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
                        <div
                          key={a.animal_id || a.id || idx}
                          className="block px-4 py-4 hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Cabeçalho com nome e sexo */}
                              <div className="flex items-center gap-2 mb-2">
                                {a.id || a.animal_id ? (
                                  <Link 
                                    href={`/animals/${a.id || a.animal_id}`}
                                    className="font-bold text-amber-600 dark:text-amber-400 text-base hover:underline"
                                  >
                                    {a.identificacao || a.animal || `${a.serie || ''}-${a.rg || ''}`.trim() || a.nome || '—'}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-gray-900 dark:text-white text-base">
                                    {a.identificacao || a.animal || `${a.serie || ''}-${a.rg || ''}`.trim() || a.nome || '—'}
                                  </span>
                                )}
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
                              {(a.pai || a.avo_materno || a.iabcz || a.deca || (a.iqg ?? a.genetica_2) || (a.pt_iqg ?? a.decile_2) || a.mgte || a.top) && (
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
                                  
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
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
                                    {a.mgte && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">MGTe:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{a.mgte}</span>
                                      </div>
                                    )}
                                    {a.top && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">TOP:</span>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{a.top}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </div>
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
      <CardInfoModal
        cardInfoModal={cardInfoModal}
        onClose={() => setCardInfoModal((m) => ({ ...m, open: false }))}
        onViewReport={() => {
          handleSelectTipo(cardInfoModal.reportKey)
          setViewMode('table')
          setCardInfoModal((m) => ({ ...m, open: false }))
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-24 relative overflow-hidden">
        {/* Decoração sutil de fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/20 via-transparent to-transparent dark:from-amber-900/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/10 dark:bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/20 dark:bg-amber-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <MobileReportsTopBar
          selectedTipo={selectedTipo}
          allTypes={allTypes}
          onBackToHome={() => setSelectedTipo(null)}
        />

        <div className="relative max-w-lg mx-auto px-4 py-6">
          {loading ? (
            <MobileReportsLoadingSkeleton />
          ) : !selectedTipo ? (
            <div className="pb-28 space-y-5 relative">
              {currentTab === 'home' && (
                <HomeHeroSection
                  dashboardData={dashboardData}
                  enabledReports={enabledReports}
                  favorites={favorites}
                  onSelectTipo={handleSelectTipo}
                  onGoToReports={() => setCurrentTab('reports')}
                  userName={userName}
                />
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
                    <ReportsSearchAndFilter
                      searchReports={searchReports}
                      onSearchChange={setSearchReports}
                      categoryFilter={categoryFilter}
                      onCategoryChange={setCategoryFilter}
                      categoriasComRelatorios={categoriasComRelatorios}
                    />
                  )}

                  {currentTab === 'home' && (
                    <HomeQuickAccessSection
                      allTypes={allTypes}
                      enabledReports={enabledReports}
                      favorites={favorites}
                      recentIds={recentIds}
                      categoriasComRelatorios={categoriasComRelatorios}
                      onSelectTipo={handleSelectTipo}
                      onToggleFavorite={toggleFavorite}
                      isAdelso={isAdelso}
                      onSetPeriodLastMonth={() => {
                        const today = new Date()
                        const start = new Date(today)
                        start.setMonth(start.getMonth() - 1)
                        setPeriod({
                          startDate: start.toISOString().split('T')[0],
                          endDate: today.toISOString().split('T')[0],
                        })
                      }}
                    />
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
                                              onClick={() => handleSelectTipo(tipo.key)}
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
                             {userInitials}
                           </div>
                           <div className="flex-1">
                             <p className="font-bold text-gray-900 dark:text-white text-lg">{userName}</p>
                             {userEmail && <p className="text-xs text-gray-600 dark:text-gray-400">{userEmail}</p>}
                           </div>
                        </div>
                        <button 
                           onClick={handleLogout}
                           className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                        >
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

              <BottomTabBar currentTab={currentTab} onTabChange={setCurrentTab} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {reportData && totalRegistros >= 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {lastUpdate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                      {(() => {
                        const diffMs = new Date().getTime() - new Date(lastUpdate).getTime()
                        const diffMin = Math.floor(diffMs / 60000)
                        return diffMin < 1 ? 'Atualizado agora' : `há ${diffMin}min`
                      })()}
                    </span>
                  )}
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
                  const labels = { '7d': '7 dias', '30d': '30 dias', 'mes': 'Mês', 'mes_anterior': 'Mês ant.', '3meses': '3 meses', 'ano': 'Ano' }
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
                  {['iABCZ', 'Peso', 'CE', 'IQG', 'MGTe'].map(tipo => {
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
                                 <motion.button
                                   key={j}
                                   type="button"
                                   onClick={() => handleCardClick(label, val)}
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                   className="text-left bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all cursor-pointer group min-w-0"
                                 >
                                   <div className="flex items-center justify-between gap-1">
                                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1 break-words flex-1 min-w-0">{label}</p>
                                     <ChevronRightIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                   </div>
                                   <p className="text-base font-bold text-gray-900 dark:text-white break-all min-w-0">{formatValue(val)}</p>
                                   <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Toque para ver detalhes</p>
                                 </motion.button>
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

                  {/* ══ PAINEL DE ANÁLISE COMPLETO: Boletim Campo ══ */}
                  {(ehBoletimCampo || ehBoletimRebanho) && dadosParaExibir.length > 0 && (() => {
                    const qtyKey = ehBoletimCampo ? 'quant' : 'total'
                    const rows = dadosParaExibir.filter(d =>
                      d.raca !== 'TOTAL GERAL' && d.local !== 'TOTAL GERAL' &&
                      d.local_1 !== 'TOTAL GERAL' && d.fazenda !== 'TOTAL GERAL'
                    )

                    // Categorias de área
                    const AREA_CATS = [
                      { key: 'Piquetes',     emoji: '🌿', test: s => /piquete|^piq[\s_-]/i.test(s), grad: 'from-green-500 to-emerald-600' },
                      { key: 'Cabanha',      emoji: '🏠', test: s => /cabanha/i.test(s),              grad: 'from-violet-500 to-purple-600' },
                      { key: 'Confinamento', emoji: '🏗️',  test: s => /confina|^conf\b/i.test(s),     grad: 'from-orange-500 to-amber-600' },
                      { key: 'Projetos',     emoji: '🔬', test: s => /projeto/i.test(s),              grad: 'from-cyan-500 to-teal-600' },
                    ]

                    // Categorias de animal
                    const CAT_ANIMAL = [
                      { key: 'Bezerros',   emoji: '🐮', test: s => /bezerr|cria/i.test(s),      color: 'yellow' },
                      { key: 'Vacas',      emoji: '🐄', test: s => /^vaca|vacas/i.test(s),      color: 'pink' },
                      { key: 'Novilhas',   emoji: '🐄', test: s => /novilha/i.test(s),           color: 'rose' },
                      { key: 'Touros',     emoji: '🐂', test: s => /touro/i.test(s),             color: 'blue' },
                      { key: 'Novilhos',   emoji: '🐃', test: s => /novilho/i.test(s),           color: 'indigo' },
                      { key: 'Receptoras', emoji: '💉', test: s => /recept/i.test(s),            color: 'purple' },
                    ]
                    const corAnimal = {
                      yellow: { bg:'bg-yellow-50 dark:bg-yellow-900/20', border:'border-yellow-300 dark:border-yellow-700', text:'text-yellow-700 dark:text-yellow-300', badge:'bg-yellow-400', num:'text-yellow-900 dark:text-yellow-100' },
                      pink:   { bg:'bg-pink-50 dark:bg-pink-900/20',     border:'border-pink-300 dark:border-pink-700',     text:'text-pink-700 dark:text-pink-300',     badge:'bg-pink-400',   num:'text-pink-900 dark:text-pink-100' },
                      rose:   { bg:'bg-rose-50 dark:bg-rose-900/20',     border:'border-rose-300 dark:border-rose-700',     text:'text-rose-700 dark:text-rose-300',     badge:'bg-rose-500',   num:'text-rose-900 dark:text-rose-100' },
                      blue:   { bg:'bg-blue-50 dark:bg-blue-900/20',     border:'border-blue-300 dark:border-blue-700',     text:'text-blue-700 dark:text-blue-400',     badge:'bg-blue-500',   num:'text-blue-900 dark:text-blue-100' },
                      indigo: { bg:'bg-indigo-50 dark:bg-indigo-900/20', border:'border-indigo-300 dark:border-indigo-700', text:'text-indigo-700 dark:text-indigo-300', badge:'bg-indigo-500', num:'text-indigo-900 dark:text-indigo-100' },
                      purple: { bg:'bg-purple-50 dark:bg-purple-900/20', border:'border-purple-300 dark:border-purple-700', text:'text-purple-700 dark:text-purple-300', badge:'bg-purple-500', num:'text-purple-900 dark:text-purple-100' },
                    }

                    // Aggregação completa
                    const porRaca = {}, porEra = {}, porSexo = {}
                    const porAreaCat = {}, porCatAnimal = {}
                    const piquetes = {}

                    let totalGeral = 0
                    rows.forEach(d => {
                      const qtd = parseInt(d[qtyKey] ?? d.quant ?? d.total) || 0
                      if (!qtd) return
                      totalGeral += qtd

                      const raca    = (d.raca || 'Não informado').trim()
                      const era     = (d.era  || '-').trim()
                      const sexoRaw = (d.sexo || '').toString().trim()
                      const cat     = (d.categoria || '').toString().trim()
                      const local   = (d.local   || d.local_1 || '').trim()
                      const local1  = (d.local_1 || d.local   || '').trim()
                      const sub2    = (d.sub_local_2 || '').trim()

                      const sexo = /^f/i.test(sexoRaw) ? 'F' : /^m/i.test(sexoRaw) ? 'M' : sexoRaw || '-'

                      porRaca[raca] = (porRaca[raca] || 0) + qtd
                      porEra[era]   = (porEra[era]   || 0) + qtd
                      porSexo[sexo] = (porSexo[sexo] || 0) + qtd

                      const areaCat = AREA_CATS.find(c => c.test(local))?.key || 'Outros'
                      porAreaCat[areaCat] = (porAreaCat[areaCat] || 0) + qtd

                      const catAnimal = CAT_ANIMAL.find(c => c.test(cat))?.key || (cat || 'Outros')
                      porCatAnimal[catAnimal] = (porCatAnimal[catAnimal] || 0) + qtd

                      const piqKey = sub2 || local || local1 || 'Não alocados'
                      if (!piquetes[piqKey]) piquetes[piqKey] = { total: 0, f: 0, m: 0, eras: {}, racas: {}, cats: {}, local1 }
                      piquetes[piqKey].total += qtd
                      if (sexo === 'F') piquetes[piqKey].f += qtd
                      if (sexo === 'M') piquetes[piqKey].m += qtd
                      piquetes[piqKey].eras[era]        = (piquetes[piqKey].eras[era]        || 0) + qtd
                      piquetes[piqKey].racas[raca]      = (piquetes[piqKey].racas[raca]      || 0) + qtd
                      piquetes[piqKey].cats[catAnimal]  = (piquetes[piqKey].cats[catAnimal]  || 0) + qtd
                    })

                    const racasTop      = Object.entries(porRaca).sort(([,a],[,b])=>b-a).slice(0,6)
                    const erasAll       = Object.entries(porEra).sort(([,a],[,b])=>b-a)
                    const sexosTop      = Object.entries(porSexo).filter(([,q])=>q>0)
                    const piquetesOrd   = Object.entries(piquetes).sort(([,a],[,b])=>b.total-a.total)
                    const catsAnimalOrd = Object.entries(porCatAnimal).sort(([,a],[,b])=>b-a)

                    const totalF = porSexo['F'] || 0
                    const totalM = porSexo['M'] || 0
                    const pctF   = totalGeral > 0 ? Math.round(totalF/totalGeral*100) : 0
                    const pctM   = 100 - pctF

                    const top1 = obj => Object.entries(obj).sort(([,a],[,b])=>b-a)[0]?.[0] || '-'

                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 mb-2">

                        {/* 1. HEADER DARK — total + F/M + tiles de área */}
                        <div className="rounded-2xl overflow-hidden shadow-xl">
                          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 pb-3">
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Boletim Campo</p>
                            <div className="flex items-end justify-between mb-3">
                              <div>
                                <p className="text-5xl font-black text-white leading-none">{totalGeral.toLocaleString('pt-BR')}</p>
                                <p className="text-slate-400 text-xs mt-1">{rows.length} registros · {piquetesOrd.length} locais</p>
                              </div>
                              <div className="flex gap-3">
                                <div className="text-center bg-pink-500/20 rounded-xl px-3 py-2 border border-pink-500/30">
                                  <p className="text-pink-300 text-[10px] font-bold tracking-wide">♀ FÊMEAS</p>
                                  <p className="text-2xl font-black text-pink-200">{totalF.toLocaleString('pt-BR')}</p>
                                  <p className="text-pink-400 text-xs">{pctF}%</p>
                                </div>
                                <div className="text-center bg-blue-500/20 rounded-xl px-3 py-2 border border-blue-500/30">
                                  <p className="text-blue-300 text-[10px] font-bold tracking-wide">♂ MACHOS</p>
                                  <p className="text-2xl font-black text-blue-200">{totalM.toLocaleString('pt-BR')}</p>
                                  <p className="text-blue-400 text-xs">{pctM}%</p>
                                </div>
                              </div>
                            </div>
                            <div className="h-3 rounded-full overflow-hidden bg-white/10 flex gap-0.5">
                              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400" style={{ width:`${pctF}%` }} />
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400" style={{ width:`${pctM}%` }} />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                              <span>♀ {pctF}% fêmeas</span>
                              <span>♂ {pctM}% machos</span>
                            </div>
                          </div>
                          {ehBoletimCampo && (
                            <div className="grid grid-cols-4 divide-x divide-black/20">
                              {AREA_CATS.map(cat => {
                                const qtd = porAreaCat[cat.key] || 0
                                const pct = totalGeral > 0 ? Math.round(qtd/totalGeral*100) : 0
                                return (
                                  <motion.button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => qtd > 0 && setResumoDetalheModal({ open: true, tipo: 'area', valor: cat.key, titulo: `${cat.emoji} ${cat.key}`, qtd })}
                                    whileTap={qtd > 0 ? { scale: 0.96 } : {}}
                                    className={`bg-gradient-to-b ${cat.grad} p-2 text-center ${qtd > 0 ? 'cursor-pointer active:brightness-90' : 'cursor-default opacity-70'}`}
                                  >
                                    <p className="text-white/80 text-sm">{cat.emoji}</p>
                                    <p className="text-white/70 text-[9px] font-medium">{cat.key}</p>
                                    <p className="text-xl font-black text-white">{qtd || '–'}</p>
                                    {qtd > 0 && <p className="text-white/60 text-[9px]">{pct}%</p>}
                                  </motion.button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. CATEGORIA DE ANIMAL */}
                        {ehBoletimCampo && catsAnimalOrd.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">🏷️</span>
                              <h4 className="font-bold text-gray-900 dark:text-white">Categoria do Animal</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {catsAnimalOrd.map(([cat, qtd], idx) => {
                                const def = CAT_ANIMAL.find(c => c.key === cat)
                                const c   = corAnimal[def?.color] || corAnimal.indigo
                                const pct = totalGeral > 0 ? Math.round(qtd/totalGeral*100) : 0
                                return (
                                  <motion.button
                                    key={cat}
                                    type="button"
                                    onClick={() => setResumoDetalheModal({ open: true, tipo: 'categoria', valor: cat, titulo: `${def?.emoji || ''} ${cat}`, qtd })}
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.04 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`text-left ${c.bg} border-2 ${c.border} rounded-xl p-2.5`}
                                  >
                                    <p className="text-base mb-0.5">{def?.emoji || '🐄'}</p>
                                    <p className={`text-[10px] font-semibold ${c.text} leading-tight truncate`}>{cat}</p>
                                    <p className={`text-xl font-black ${c.num}`}>{qtd}</p>
                                    <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                                      <div className={`h-full rounded-full ${c.badge}`} style={{ width:`${pct}%` }} />
                                    </div>
                                  </motion.button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. PIQUETES / LOCAIS DETALHADOS */}
                        {ehBoletimCampo && piquetesOrd.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="flex items-center gap-2 p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-xl">🌿</span>
                              <h4 className="font-bold text-gray-900 dark:text-white">Piquetes / Locais</h4>
                              <span className="ml-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full">{piquetesOrd.length} locais</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                              {piquetesOrd.map(([piq, data], idx) => {
                                const pctPiq  = totalGeral > 0 ? Math.round(data.total/totalGeral*100) : 0
                                const pctFPiq = data.total > 0 ? Math.round(data.f/data.total*100) : 0
                                const pctMPiq = 100 - pctFPiq
                                const mainEra  = top1(data.eras)
                                const mainRaca = top1(data.racas)
                                const mainCat  = top1(data.cats)
                                const PALETTE  = [
                                  'bg-emerald-500','bg-violet-500','bg-orange-500','bg-cyan-500',
                                  'bg-rose-500','bg-indigo-500','bg-amber-500','bg-teal-500',
                                  'bg-pink-500','bg-sky-500','bg-lime-500','bg-fuchsia-500',
                                ]
                                const barColor = PALETTE[idx % PALETTE.length]
                                return (
                                  <motion.button
                                    key={piq}
                                    type="button"
                                    onClick={() => setResumoDetalheModal({ open: true, tipo: 'local', valor: piq, titulo: piq, qtd: data.total })}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.025 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${barColor}`} />
                                      <p className="text-xs font-semibold text-gray-900 dark:text-white flex-1 truncate">{piq}</p>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {data.f > 0 && <span className="text-[10px] text-pink-500 font-medium">Fêmeas {data.f}</span>}
                                        {data.m > 0 && <span className="text-[10px] text-blue-500 font-medium">Machos {data.m}</span>}
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{data.total}</span>
                                        <span className="text-[10px] text-gray-400 w-7 text-right">{pctPiq}%</span>
                                      </div>
                                    </div>
                                  </motion.button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* 4. ERAS com F/M por era (visual simplificado) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">📅</span>
                            <h4 className="font-bold text-gray-900 dark:text-white">Eras dos Animais</h4>
                            <span className="ml-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {erasAll.length} eras
                            </span>
                          </div>
                          {(() => {
                            const eraFM = {}
                            rows.forEach(d => {
                              const era = (d.era || '-').trim()
                              const qtd = parseInt(d[qtyKey] ?? d.quant ?? d.total) || 0
                              const sx  = (d.sexo || '').toString()
                              if (!eraFM[era]) eraFM[era] = { f:0, m:0, total:0 }
                              eraFM[era].total += qtd
                              if (/^f/i.test(sx)) eraFM[era].f += qtd
                              else if (/^m/i.test(sx)) eraFM[era].m += qtd
                            })

                            const parseEraKey = (eraLabel) => {
                              const txt = String(eraLabel || '').trim()
                              const plus = txt.match(/^\+?\s*(\d+)$/)
                              if (plus) return Number(plus[1]) * 1000
                              const range = txt.match(/^(\d+)\s*\/\s*(\d+)$/)
                              if (range) return Number(range[1]) * 100 + Number(range[2])
                              const nums = txt.match(/(\d+)/)
                              if (nums) return Number(nums[1]) * 10
                              return Number.MAX_SAFE_INTEGER
                            }

                            const eraEntries = Object.entries(eraFM)
                              .sort((a, b) => {
                                const byTotal = (b[1]?.total || 0) - (a[1]?.total || 0)
                                if (byTotal !== 0) return byTotal
                                return parseEraKey(a[0]) - parseEraKey(b[0])
                              })
                              .slice(0, 10)

                            return (
                              <div className="space-y-2">
                                {eraEntries.map(([era, fm]) => {
                                  const qtd = fm.total || 0
                                  const pct  = totalGeral > 0 ? Math.round(qtd/totalGeral*100) : 0
                                  const pctF2 = fm.total > 0 ? Math.round((fm.f / fm.total) * 100) : 0
                                  const pctM2 = fm.total > 0 ? 100 - pctF2 : 0
                                  return (
                                    <motion.button
                                      key={era}
                                      type="button"
                                      onClick={() => setResumoDetalheModal({ open: true, tipo: 'era', valor: era, titulo: `Era: ${era}`, qtd })}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="w-full text-left rounded-xl p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                                    >
                                      <div className="rounded-lg p-2 shrink-0 text-center min-w-[58px] bg-gradient-to-b from-amber-500 to-orange-500">
                                        <p className="text-[9px] text-white/80 font-bold uppercase">Era</p>
                                        <p className="text-sm font-black text-white leading-tight">{era || '-'}</p>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex gap-2 text-[10px] font-semibold">
                                            <span className="text-pink-600 dark:text-pink-400">Fêmeas {fm.f || 0}</span>
                                            <span className="text-blue-600 dark:text-blue-400">Machos {fm.m || 0}</span>
                                          </div>
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{pct}%</span>
                                        </div>
                                        <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200/70 dark:bg-slate-700">
                                          {fm.f > 0 && <div className="bg-pink-400 h-full" style={{ width:`${pctF2}%` }} />}
                                          {fm.m > 0 && <div className="bg-blue-400 h-full" style={{ width:`${pctM2}%` }} />}
                                        </div>
                                      </div>
                                      <p className="text-2xl font-black text-slate-900 dark:text-white shrink-0">{qtd}</p>
                                    </motion.button>
                                  )
                                })}
                                {erasAll.length > eraEntries.length && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                                    Exibindo as 10 eras mais relevantes.
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                        </div>

                        {/* 5. RAÇAS */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🐄</span>
                            <h4 className="font-bold text-gray-900 dark:text-white">Por Raça</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {racasTop.map(([raca, qtd], idx) => {
                              const pct = totalGeral > 0 ? Math.round(qtd/totalGeral*100) : 0
                              return (
                                <motion.button
                                  key={raca}
                                  type="button"
                                  onClick={() => setResumoDetalheModal({ open: true, tipo: 'raca', valor: raca, titulo: `Raça: ${raca}`, qtd })}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  whileTap={{ scale: 0.96 }}
                                  className="text-left bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3"
                                >
                                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5 truncate">{raca}</p>
                                  <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{qtd}</p>
                                  <div className="h-1.5 bg-blue-200/60 dark:bg-blue-900/40 rounded-full overflow-hidden mt-1.5">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width:`${racasTop[0]?.[1]>0?Math.round(qtd/racasTop[0][1]*100):0}%` }} />
                                  </div>
                                  <p className="text-[10px] text-blue-500 mt-0.5">{pct}% do total</p>
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>

                      </motion.div>
                    )
                  })()}

                  {/* Modal de detalhes ao clicar nos cards do resumo (raça, era, sexo) */}
                  {resumoDetalheModal.open && resumoDetalheModal.tipo && (ehBoletimCampo || ehBoletimRebanho) && (() => {
                    const { tipo, valor, titulo, qtd } = resumoDetalheModal
                    const rows = dadosParaExibir.filter(d =>
                      d.raca !== 'TOTAL GERAL' && d.local !== 'TOTAL GERAL' &&
                      d.local_1 !== 'TOTAL GERAL' && d.fazenda !== 'TOTAL GERAL'
                    )
                    const CAT_ANIMAL_MODAL = [
                      { key: 'Bezerros',   test: s => /bezerr|cria/i.test(s) },
                      { key: 'Vacas',      test: s => /^vaca|vacas/i.test(s) },
                      { key: 'Novilhas',   test: s => /novilha/i.test(s) },
                      { key: 'Touros',     test: s => /touro/i.test(s) },
                      { key: 'Novilhos',   test: s => /novilho/i.test(s) },
                      { key: 'Receptoras', test: s => /recept/i.test(s) },
                    ]
                    const filtered = rows.filter(d => {
                      if (tipo === 'raca') return (d.raca || 'Não informado').trim() === valor
                      if (tipo === 'era')  return (d.era || '-').trim() === valor
                      if (tipo === 'area') {
                        const local = (d.local || d.local_1 || '').trim()
                        const AREA_CATS_MODAL = [
                          { key: 'Piquetes',     test: s => /piquete|^piq[\s_-]/i.test(s) },
                          { key: 'Cabanha',      test: s => /cabanha/i.test(s) },
                          { key: 'Confinamento', test: s => /confina|^conf\b/i.test(s) },
                          { key: 'Projetos',     test: s => /projeto|^proj\b/i.test(s) },
                        ]
                        const areaCat = AREA_CATS_MODAL.find(c => c.test(local))?.key || 'Outros'
                        return areaCat === valor
                      }
                      if (tipo === 'local_1') return (d.local_1 || d.local || '').trim() === valor
                      if (tipo === 'local') {
                        const sub2  = (d.sub_local_2 || '').trim()
                        const loc   = (d.local || d.local_1 || '').trim()
                        return sub2 === valor || loc === valor
                      }
                      if (tipo === 'categoria') {
                        const cat = (d.categoria || '').toString().trim()
                        const def = CAT_ANIMAL_MODAL.find(c => c.key === valor)
                        return def ? def.test(cat) : cat === valor
                      }
                      if (tipo === 'sexo') {
                        const s = (d.sexo || '-').toString()
                        if (valor === 'F' && /^f/i.test(s)) return true
                        if (valor === 'M' && /^m/i.test(s)) return true
                        if (s === valor) return true
                        if (valor.toLowerCase().includes('macho') && /^m/i.test(s)) return true
                        if (valor.toLowerCase().includes('fêmea') && /^f/i.test(s)) return true
                        return false
                      }
                      return false
                    })
                    const cols = filtered[0] ? Object.keys(filtered[0]).filter(c => !['_resumo', 'animal_id', 'id'].includes(c) && typeof (filtered[0][c]) !== 'object') : []
                    const qtyKey = ehBoletimCampo ? 'quant' : 'total'
                    return (
                      <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setResumoDetalheModal(m => ({ ...m, open: false }))}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 100 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 100 }}
                          onClick={e => e.stopPropagation()}
                          className="w-full max-h-[85vh] sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{titulo} ({qtd})</h3>
                            <button
                              type="button"
                              onClick={() => setResumoDetalheModal(m => ({ ...m, open: false }))}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </button>
                          </div>
                          <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {filtered.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum registro</p>
                            ) : (
                              filtered.map((row, i) => {
                                const medRow = ultimoMedRow(row.id, row)
                                return (
                                <div
                                  key={i}
                                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-1"
                                >
                                  {cols.map(k => {
                                    const v = row[k]
                                    const label = getColumnLabel(k)
                                    const display = k.toLowerCase().includes('data') && v ? formatDate(v) : String(v ?? '-')
                                    if (label === 'Qtd' && row.quant != null && !(isAdelso && tipo === 'local')) return (
                                      <div key={k} className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                                        <span className="font-semibold">{row.quant ?? row.total ?? display}</span>
                                      </div>
                                    )
                                    return (
                                      <div key={k} className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[60%]">{display}</span>
                                      </div>
                                    )
                                  })}
                                  {medRow && (
                                    <div className="mt-1.5 pt-1.5 border-t border-purple-200 dark:border-purple-800/40 flex items-center gap-1.5">
                                      <span className="text-[10px]">💉</span>
                                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 truncate">{medRow.medicamento}</span>
                                      <span className="text-[10px] text-purple-500 dark:text-purple-400 shrink-0">
                                        {medRow.data_aplicacao ? new Date(medRow.data_aplicacao).toLocaleDateString('pt-BR') : ''}
                                        {medRow.usuario ? ` · ${medRow.usuario}` : ''}
                                      </span>
                                    </div>
                                  )}
                                  {isAdelso && ehBoletimCampo && tipo === 'local' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalMed({ row })
                                        setFormMed({ medicamento: '', dataAplicacao: new Date().toISOString().split('T')[0], dataProxima: '', observacao: '' })
                                      }}
                                      className="mt-2 w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                      <BeakerIcon className="w-4 h-4" />
                                      Medicamentos deste local
                                    </button>
                                  )}
                                  {isAdelso && ehBoletimCampo && tipo === 'local' && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Quantidade do local</p>
                                        <input
                                          type="number"
                                          min="0"
                                          value={boletimQuantDraft[row.id] ?? (parseInt(row.quant) || 0)}
                                          onChange={(e) => {
                                            const v = parseInt(e.target.value) || 0
                                            setBoletimQuantDraft(m => ({ ...m, [row.id]: v }))
                                          }}
                                          onBlur={(e) => {
                                            const novoQuant = parseInt(e.target.value) || 0
                                            const antigoQuant = parseInt(row.quant) || 0
                                            if (novoQuant === antigoQuant) return

                                            const operacao = novoQuant < antigoQuant ? 'saida' : 'entrada'
                                            const deltaAbs = Math.abs(novoQuant - antigoQuant)

                                            setModalMovBoletimCampo({
                                              step: 'qtd_choice',
                                              operacao,
                                              origemRow: row,
                                              oldQuant: antigoQuant,
                                              deltaAbs,
                                              qtdOption: operacao === 'saida' ? 'escolher' : 'lote_todo',
                                              qtdMov: deltaAbs,
                                              qtdEscolhida: deltaAbs
                                            })
                                          }}
                                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                      </div>
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                        Digite ao lado para registrar entrada/saída.
                                      </p>
                                    </div>
                                  )}
                                </div>
                                )
                              })
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )
                  })()}

                  {reportData.resumo && typeof reportData.resumo === 'object' && (
                    <div className="space-y-3">
                      {ehBoletimRebanho && (
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          📊 Resumo (conforme Boletim Campo)
                        </p>
                      )}
                      <div className={`grid gap-3 ${ehBoletimRebanho ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        <AnimatePresence>
                          {Object.entries(reportData.resumo)
                            .filter(([k, v]) => {
                              // Filtrar apenas campos que definitivamente não devem aparecer
                              if (k === 'graficos' || k === 'erro') return false
                              return true
                            })
                            .slice(0, 6)
                            .map(([k, v], i) => {
                            const isPeso = /peso|kg/i.test(k)
                            const isAnimais = /animais|machos|fêmeas|total|piquetes|raças/i.test(k)
                            const isTaxa = /taxa|prenhez/i.test(k)
                            const isClicavel = true
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
                            const cardPadding = ehBoletimRebanho ? 'p-5' : 'p-4'
                            const valSize = ehBoletimRebanho ? 'text-2xl' : 'text-xl'
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
                                className={`${cardPadding} rounded-xl border-2 shadow-sm relative overflow-hidden group ${cardCls} ${isClicavel ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
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
                                  <p className={`font-medium text-gray-600 dark:text-gray-400 flex-1 break-words ${ehBoletimRebanho ? 'text-sm' : 'text-xs'}`}>{k}</p>
                                  <span className={`ml-1 flex-shrink-0 ${ehBoletimRebanho ? 'text-lg' : 'text-base'}`}>{icon}</span>
                                </div>
                                <p className={`font-bold ${valSize} ${valCls}`}>{formatValue(v)}</p>
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
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Total Geral
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {tourosRaca.length} touros • {tourosRaca.reduce((sum, t) => sum + t.registros, 0)} lotes
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-amber-500 text-white shadow-md">
                                  {tourosRaca.reduce((sum, t) => sum + t.doses, 0)}
                                </div>
                                <button
                                  onClick={() => handleShareModalWhatsApp('touros', `Touros - ${racaSelecionada}`, tourosRaca)}
                                  className="p-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                                  title="Compartilhar no WhatsApp"
                                >
                                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                </button>
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
                                {modalEhEmbriao ? '🧬 Acasalamentos' : '🐂 Touros'} - {racaEmbriaoSelecionada}
                              </h3>
                              <p className="text-sm text-amber-100 mt-1">
                                {acasalamentosRaca.length} {acasalamentosRaca.length === 1 ? 'item' : 'itens'} • {(() => {
                                  const totalEmbrioes = acasalamentosRaca.filter(a => itemEhEmbriao(a.acasalamento)).reduce((s, a) => s + a.embrioes, 0)
                                  const totalDoses    = acasalamentosRaca.filter(a => !itemEhEmbriao(a.acasalamento)).reduce((s, a) => s + a.embrioes, 0)
                                  if (totalEmbrioes > 0 && totalDoses > 0) return `${totalEmbrioes} embriões • ${totalDoses} doses`
                                  if (totalEmbrioes > 0) return `${totalEmbrioes} embriões`
                                  return `${totalDoses} doses`
                                })()}
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
                                <p>Nenhum item encontrado para esta raça</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {acasalamentosRaca.map((item, idx) => (
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
                                            {item.acasalamento}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {item.registros} {item.registros === 1 ? 'lote' : 'lotes'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-amber-600 text-white shadow-md">
                                          {item.embrioes}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {itemEhEmbriao(item.acasalamento) ? 'embriões' : 'doses'}
                                        </p>
                                      </div>
                                    </div>
                                    {item.rack && item.botijao && item.caneca && 
                                     item.rack !== '-' && item.botijao !== '-' && item.caneca !== '-' && (
                                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Localização:</p>
                                        <div className="flex items-center gap-2 text-sm font-mono">
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Rack: {item.rack}
                                          </span>
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Botijão: {item.botijao}
                                          </span>
                                          <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            Caneca: {item.caneca}
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
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  Total Geral
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {acasalamentosRaca.length} {acasalamentosRaca.length === 1 ? 'item' : 'itens'} • {acasalamentosRaca.reduce((sum, a) => sum + a.registros, 0)} lotes
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-amber-500 text-white shadow-md">
                                  {acasalamentosRaca.reduce((sum, a) => sum + a.embrioes, 0)}
                                </div>
                                <button
                                  onClick={() => handleShareModalWhatsApp(
                                    'estoque',
                                    `Estoque - ${racaEmbriaoSelecionada}`,
                                    acasalamentosRaca
                                  )}
                                  className="p-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                                  title="Compartilhar no WhatsApp"
                                >
                                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                </button>
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar animais (RG ou número)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  {searchQuery.trim() && selectedTipo === 'resumo_pesagens' && (() => {
                    const q = searchQuery.trim().toLowerCase()
                    const matches = (reportData?.data || []).filter(d => !d._resumo && (d.animais || []).some(a =>
                      String(a.rg ?? '').toLowerCase().includes(q) || String(a.serie ?? '').toLowerCase().includes(q) ||
                      String(a.animal ?? '').toLowerCase().includes(q) || String(a.identificacao ?? '').toLowerCase().includes(q)
                    )).flatMap(d => (d.animais || []).filter(a =>
                      String(a.rg ?? '').toLowerCase().includes(q) || String(a.serie ?? '').toLowerCase().includes(q) ||
                      String(a.animal ?? '').toLowerCase().includes(q) || String(a.identificacao ?? '').toLowerCase().includes(q)
                    ).map(a => ({ ...a, piquete: d.Piquete || d.piquete })))
                    if (matches.length > 0) return (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Animal(is) encontrado(s):</p>
                        {matches.slice(0, 5).map((m, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 py-1">
                            <span className="text-gray-600 dark:text-gray-300">{m.animal || `${(m.serie || '')} ${(m.rg || '')}`.trim()} - {m.piquete}</span>
                            <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                          </div>
                        ))}
                        {matches.length > 5 && <p className="text-xs text-gray-500 mt-1">+{matches.length - 5} mais</p>}
                      </div>
                    )
                    return null
                  })()}

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
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <img src="/emoji-semen.png" alt="Sêmen" className="w-5 h-5" />
                              Estoque de Sêmen por Touro
                            </p>
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
                                <img src="/emoji-semen.png" alt="Sêmen" className="w-5 h-5" />
                                Estoque por Raça
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
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">� Estoque de Embriões por Acasalamento</p>
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
                                � Estoque por Raça
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
                      <div className={`overflow-y-auto max-h-[55vh] ${ehBoletim ? 'p-3 space-y-3' : 'overflow-x-auto'}`}>
                        {dadosParaExibir.length > 0 ? (() => {
                          const firstRow = reportData.data?.find(d => !d._resumo)
                          const columns = firstRow ? Object.keys(firstRow).filter(c => {
                            if (c === '_resumo' || c === 'animal_id' || c === 'id') return false
                            const val = firstRow[c]
                            // Ocultar colunas com objetos/arrays (como a lista de animais)
                            if (typeof val === 'object' && val !== null) return false
                            return true
                          }) : []

                          // Layout em cards para Boletim Campo e Boletim Defesa - melhor leitura no mobile
                          if (ehBoletim) {
                            const getQtd = (row) => {
                              const val = row.quant ?? row.total ?? row.qtd ?? row.quantidade
                              return Number(val) || 0
                            }
                            const hasAnimais = (row) =>
                              Boolean(row?.animal_id) || (Array.isArray(row?.animais) && row.animais.length > 0)

                            const boletimRows = dadosParaExibir.filter((row) => {
                              const isTotalGeral = row.local === 'TOTAL GERAL' || row.fazenda === 'TOTAL GERAL' || row.local_1 === 'TOTAL GERAL' || row.raca === 'TOTAL GERAL'
                              if (!ehBoletimCampo || isTotalGeral) return true
                              const qtd = getQtd(row)
                              if (qtd > 0) return true
                              // Mantém somente linhas zeradas quando há vínculo de animal.
                              return hasAnimais(row)
                            })

                            if (boletimRows.length === 0) {
                              return (
                                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-5 text-center text-sm text-gray-500 dark:text-gray-400">
                                  Nenhum registro com quantidade disponível para exibir.
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {boletimRows.map((row, i) => {
                                  const isTotalGeral = row.local === 'TOTAL GERAL' || row.fazenda === 'TOTAL GERAL' || row.local_1 === 'TOTAL GERAL' || row.raca === 'TOTAL GERAL'
                                  return (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.02 }}
                                      className={`rounded-xl border-2 p-4 shadow-sm ${
                                        isTotalGeral
                                          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600'
                                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                      }`}
                                    >
                                      <div className="space-y-2">
                                        {columns.map(k => {
                                          const v = row[k]
                                          let display = k.toLowerCase().includes('data') && v ? formatDate(v) : String(v ?? '-')
                                          const label = getColumnLabel(k)
                                          if (label === 'Qtd' && isTotalGeral) {
                                            display = row.quant ?? display
                                          }
                                          return (
                                            <div key={k} className="flex justify-between items-start gap-3 text-base">
                                              <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0 min-w-[100px]">
                                                {label}:
                                              </span>
                                              <span className={`text-right break-words ${isTotalGeral ? 'font-bold text-amber-800 dark:text-amber-200' : 'text-gray-900 dark:text-white'}`}>
                                                {display}
                                              </span>
                                            </div>
                                          )
                                        })}
                                        {ehBoletimDefesa && row.quantidades && typeof row.quantidades === 'object' && (
                                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Por faixa etária:</p>
                                            <div className="flex flex-wrap gap-2">
                                              {Object.entries(row.quantidades).map(([faixa, vals]) => {
                                                const m = vals?.M || 0
                                                const f = vals?.F || 0
                                                const tot = m + f
                                                if (tot === 0) return null
                                                const label = faixa.replace('a', '-').replace('acima', '>')
                                                return (
                                                  <span key={faixa} className="inline-flex px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-xs">
                                                    {label}: {tot} (M:{m} F:{f})
                                                  </span>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {/* Botão de Medicamentos — registro apenas para Adelso */}
                                        {ehBoletimCampo && !isTotalGeral && row.id && (() => {
                                          const ult = ultimoMedRow(row)
                                          const totalAplicacoes = medsDoRow(row).length
                                          const dias = ult ? diasDesde(ult.data_aplicacao) : null
                                          const proxDias = ult?.data_proxima_aplicacao ? diasAte(ult.data_proxima_aplicacao) : null
                                          const vencida = proxDias !== null && proxDias < 0
                                          const proxima = proxDias !== null && proxDias >= 0 && proxDias <= 7
                                          const podeConsultar = isAdelso || Boolean(ult)
                                          if (!podeConsultar) return null
                                          return (
                                            <button
                                              onClick={() => {
                                                setModalMed({ row })
                                                setFormMed({ medicamento: '', dataAplicacao: new Date().toISOString().split('T')[0], dataProxima: '', observacao: '' })
                                              }}
                                              className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                                vencida
                                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                                                  : proxima
                                                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                                  : ult
                                                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                                              }`}
                                            >
                                              {vencida ? <ExclamationCircleIcon className="w-4 h-4 shrink-0" /> : <BeakerIcon className="w-4 h-4 shrink-0" />}
                                              {ult
                                                ? <>
                                                    <span className="truncate max-w-[130px]">{ult.medicamento}</span>
                                                    <span>·</span>
                                                    <span className="shrink-0">
                                                      {totalAplicacoes} aplicaç{totalAplicacoes === 1 ? 'ão' : 'ões'}
                                                      {' · '}
                                                      {dias === 0 ? 'hoje' : `${dias}d atrás`}
                                                      {vencida ? ' ⚠️' : proxima ? ` · próx. ${proxDias}d` : ''}
                                                    </span>
                                                  </>
                                                : 'Medicamento'
                                              }
                                            </button>
                                          )
                                        })()}
                                      </div>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            )
                          }
                          
                          return (
                          <table className="w-full text-base min-w-[500px]">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                              <tr>
                                {columns.map(col => (
                                  <th key={col} className="px-3 py-3 text-left text-gray-600 dark:text-gray-400 font-semibold whitespace-nowrap">
                                    {getColumnLabel(col)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dadosParaExibir.map((row, i) => {
                                // Buscar a linha original completa do reportData para ter acesso ao campo animais
                                const originalRow = reportData.data?.find(d => 
                                  d.piquete === row.piquete || 
                                  d.Piquete === row.Piquete ||
                                  (d.animal_id && d.animal_id === row.animal_id)
                                ) || row
                                
                                const piqueteNome = row.Piquete || row.piquete
                                const animaisResumo = originalRow.animais || row.animais
                                const ehClicavelPiquete = selectedTipo === 'resumo_pesagens' && piqueteNome
                                return (
                                <tr 
                                  key={i} 
                                  onClick={() => {
                                    // Resumo de Pesagens: clicar no piquete abre modal com animais (da própria API)
                                    if (selectedTipo === 'resumo_pesagens' && piqueteNome) {
                                      if (animaisResumo && Array.isArray(animaisResumo) && animaisResumo.length > 0) {
                                        setCardFilterModal({
                                          open: true,
                                          title: `Animais em ${piqueteNome}`,
                                          filter: { piquete: piqueteNome },
                                          dataType: 'piquete_animais',
                                          skipFetch: true
                                        })
                                        setCardAnimalsList(animaisResumo.map(a => ({
                                          ...a,
                                          id: a.animal_id,
                                          identificacao: a.animal || `${(a.serie || '')} ${(a.rg || '')}`.trim()
                                        })))
                                      } else {
                                        setCardFilterModal({
                                          open: true,
                                          title: `Animais em ${piqueteNome}`,
                                          filter: { piquete: piqueteNome },
                                          dataType: 'piquete_animais'
                                        })
                                        setCardAnimalsList([])
                                      }
                                      return
                                    }
                                    // Se for o relatorio de animais por piquete e tiver a lista de animais
                                    if (selectedTipo === 'animais_piquetes' && originalRow.animais && Array.isArray(originalRow.animais)) {
                                      setCardFilterModal({
                                        open: true,
                                        title: `Animais em ${originalRow.piquete || 'Piquete'}`,
                                        filter: { piquete: originalRow.piquete },
                                        dataType: 'piquete_animais',
                                        skipFetch: true
                                      })
                                      // Preservar todos os campos dos animais
                                      setCardAnimalsList(originalRow.animais.map(a => ({
                                        ...a,
                                        id: a.animal_id,
                                        identificacao: a.animal || `${a.serie || ''} ${a.rg || ''}`.trim()
                                      })))
                                      return
                                    }
                                    // Navegação para ficha do animal desativada no mobile
                                  }}
                                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${(row.animal_id || (selectedTipo === 'animais_piquetes' && originalRow.animais) || ehClicavelPiquete) ? 'cursor-pointer' : ''}`}
                                >
                                  {columns.map(k => {
                                    const v = row[k]
                                    let display = k.toLowerCase().includes('data') && v ? formatDate(v) : String(v ?? '-')
                                    if (ehRanking && k === 'posicao' && [1, 2, 3].includes(Number(v))) {
                                      const trofeus = { 1: '🥇', 2: '🥈', 3: '🥉' }
                                      display = `${trofeus[Number(v)]} ${v}º`
                                    }
                                    
                                    // Tornar o número do animal clicável
                                    const isAnimalColumn = k.toLowerCase() === 'animal' || k.toLowerCase() === 'identificacao'
                                    const animalId = row.animal_id || row.id || originalRow.animal_id || originalRow.id
                                    const consultaAnimalId = isAnimalColumn && ehRanking
                                      ? buildConsultaAnimalId(row.identificacao || row.animal || display)
                                      : null
                                    
                                    if (isAnimalColumn && consultaAnimalId) {
                                      return (
                                        <td key={k} className="px-3 py-2.5 text-gray-900 dark:text-white break-words min-w-0">
                                          <Link
                                            href={`/consulta-animal/${consultaAnimalId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                                          >
                                            {display}
                                          </Link>
                                        </td>
                                      )
                                    }

                                    if (isAnimalColumn && animalId) {
                                      return (
                                        <td key={k} className="px-3 py-2.5 text-gray-900 dark:text-white break-words min-w-0">
                                          <Link 
                                            href={`/animals/${animalId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                                          >
                                            {display}
                                          </Link>
                                        </td>
                                      )
                                    }
                                    
                                    return (
                                      <td key={k} className="px-3 py-2.5 text-gray-900 dark:text-white break-words min-w-0">
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
            <ReportActionBar
              onBack={() => setSelectedTipo(null)}
              onExportCSV={exportCSV}
              sharing={sharing}
              shareMenuOpen={shareMenuOpen}
              onToggleShareMenu={() => setShareMenuOpen(!shareMenuOpen)}
              onShareWhatsApp={handleShareWhatsApp}
              onShareEmail={handleShareEmail}
              onShareSummary={handleShareSummary}
            />
          )}
        </div>
      </div>

      {/* ════ Modal Medicamentos (mobile-relatorios) ════ */}
      {modalMed && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-3xl sm:rounded-t-2xl shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5 text-purple-100 shrink-0" />
                  <h3 className="text-white font-bold text-base">
                    Medicamentos ({medsDoRow(modalMed.row).length})
                  </h3>
                </div>
                <p className="text-purple-200 text-xs mt-0.5 truncate">
                  {[modalMed.row.local, modalMed.row.local_1, modalMed.row.sub_local_2].filter(Boolean).join(' / ')}
                </p>
              </div>
              <button onClick={() => { setModalMed(null); setFormMed({ medicamento: '', dataAplicacao: '', dataProxima: '', observacao: '' }) }} className="p-1 rounded-full hover:bg-purple-500 transition-colors">
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Histórico */}
              {medsDoRow(modalMed.row).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Histórico de aplicações</h4>
                  <div className="space-y-2">
                    {medsDoRow(modalMed.row).map((m, idx) => {
                      const dias = diasDesde(m.data_aplicacao)
                      const proxDias = m.data_proxima_aplicacao ? diasAte(m.data_proxima_aplicacao) : null
                      const vencida = proxDias !== null && proxDias < 0
                      return (
                        <div key={m.id} className={`rounded-xl border-2 p-3 ${idx === 0 ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'}`}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{m.medicamento}</p>
                                {idx === 0 && <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full font-medium">último</span>}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {new Date(m.data_aplicacao + 'T12:00:00').toLocaleDateString('pt-BR')} · <span className={`font-semibold ${idx === 0 ? 'text-purple-600 dark:text-purple-400' : ''}`}>{dias === 0 ? 'hoje' : `${dias} dias atrás`}</span>
                              </p>
                              {m.usuario && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                  Lançado por: {m.usuario}
                                </p>
                              )}
                              {m.data_proxima_aplicacao && (
                                <p className="text-xs mt-1 flex items-center gap-1">
                                  {vencida
                                    ? <><ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500" /><span className="text-red-600 dark:text-red-400 font-semibold">Renovar! vencida há {Math.abs(proxDias)}d</span></>
                                    : <><CheckCircleOutlineIcon className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 dark:text-green-400">Próxima: {proxDias === 0 ? 'hoje' : `em ${proxDias}d`} ({new Date(m.data_proxima_aplicacao + 'T12:00:00').toLocaleDateString('pt-BR')})</span></>
                                  }
                                </p>
                              )}
                              {m.observacao && <p className="text-xs text-gray-400 mt-1 italic">{m.observacao}</p>}
                            </div>
                            {isAdelso && idx === 0 && (
                              <button onClick={() => setFormMed(f => ({ ...f, medicamento: m.medicamento, dataAplicacao: new Date().toISOString().split('T')[0] }))} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-medium shrink-0">
                                Renovar
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Form — só para Adelso */}
              {isAdelso ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {medsDoRow(modalMed.row).length === 0 ? 'Registrar medicamento' : 'Nova aplicação'}
                  </h4>
                  <div className="space-y-3">
                    <input type="text" value={formMed.medicamento} onChange={e => setFormMed(f => ({ ...f, medicamento: e.target.value }))} placeholder="Nome do medicamento *" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Data aplicação *</label>
                        <input type="date" value={formMed.dataAplicacao} onChange={e => setFormMed(f => ({ ...f, dataAplicacao: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Próxima aplicação</label>
                        <input type="date" value={formMed.dataProxima} onChange={e => setFormMed(f => ({ ...f, dataProxima: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    <textarea value={formMed.observacao} onChange={e => setFormMed(f => ({ ...f, observacao: e.target.value }))} placeholder="Observação (dose, produto...)" rows={2} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none" />
                    <button onClick={salvarMedicamentoRel} disabled={salvandoMed || !formMed.medicamento.trim() || !formMed.dataAplicacao} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      <BeakerIcon className="w-4 h-4" />
                      {salvandoMed ? 'Salvando...' : 'Salvar aplicação'}
                    </button>
                  </div>
                </div>
              ) : (
                medsDoRow(modalMed.row).length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <BeakerIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum medicamento registrado ainda</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ Modal Movimentação Boletim Campo (mobile-relatorios) ════ */}
      {modalMovBoletimCampo && (
        <div className="fixed inset-0 bg-black/60 z-[91] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-700 rounded-t-3xl sm:rounded-2xl shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5 text-amber-100 shrink-0" />
                  <h3 className="text-white font-bold text-base">
                    Movimentação Boletim Campo
                  </h3>
                </div>
                <p className="text-amber-100/80 text-xs mt-0.5 truncate">
                  {modalMovBoletimCampo?.origemRow
                    ? [modalMovBoletimCampo.origemRow.local, modalMovBoletimCampo.origemRow.local_1, modalMovBoletimCampo.origemRow.sub_local_2]
                      .filter(Boolean).join(' / ')
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (salvandoMovBoletimCampo) return
                  setModalMovBoletimCampo(null)
                  setBoletimQuantDraft({})
                }}
                className="p-1 rounded-full hover:bg-amber-500 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {modalMovBoletimCampo.step === 'qtd_choice' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {modalMovBoletimCampo.operacao === 'saida' ? 'Saída de animais' : 'Entrada de animais'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {modalMovBoletimCampo.operacao === 'saida'
                      ? `Você está reduzindo o lote. Atual: ${modalMovBoletimCampo.oldQuant}.`
                      : `Você está aumentando o lote. Atual: ${modalMovBoletimCampo.oldQuant}.`}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() => {
                        if (salvandoMovBoletimCampo) return
                        if (modalMovBoletimCampo.operacao === 'saida') {
                          setModalMovBoletimCampo(m => ({ ...m, qtdOption: 'lote_todo', qtdMov: m.oldQuant, qtdEscolhida: m.oldQuant }))
                        } else {
                          setModalMovBoletimCampo(m => ({ ...m, qtdOption: 'lote_todo', qtdMov: m.deltaAbs, qtdEscolhida: m.deltaAbs }))
                        }
                      }}
                      className={`px-3 py-2 rounded-xl font-semibold text-sm transition-colors border ${modalMovBoletimCampo.qtdOption === 'lote_todo'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'} `}
                    >
                      {modalMovBoletimCampo.operacao === 'saida' ? 'Tirar lote todo' : 'Adicionar lote todo'}
                    </button>

                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() => {
                        if (salvandoMovBoletimCampo) return
                        setModalMovBoletimCampo(m => ({ ...m, qtdOption: 'escolher', qtdMov: m.qtdEscolhida ?? m.deltaAbs, qtdEscolhida: m.qtdEscolhida ?? m.deltaAbs }))
                      }}
                      className={`px-3 py-2 rounded-xl font-semibold text-sm transition-colors border ${modalMovBoletimCampo.qtdOption === 'escolher'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'} `}
                    >
                      Escolher quantidade
                    </button>
                  </div>

                  {modalMovBoletimCampo.qtdOption === 'escolher' && (
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Quantidade a {modalMovBoletimCampo.operacao === 'saida' ? 'tirar' : 'entrar'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={modalMovBoletimCampo.operacao === 'saida' ? modalMovBoletimCampo.oldQuant : undefined}
                        value={modalMovBoletimCampo.qtdMov ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0
                          setModalMovBoletimCampo(m => ({ ...m, qtdMov: v, qtdEscolhida: v }))
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={salvandoMovBoletimCampo || !modalMovBoletimCampo.qtdMov || modalMovBoletimCampo.qtdMov <= 0}
                    onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'motivo' }))} 
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {modalMovBoletimCampo.step === 'motivo' && modalMovBoletimCampo.operacao === 'saida' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Para onde vão os animais?</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                    onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'dest_piquete', motivo: 'piquete' }))}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Entrar em outro local/piquete
                    </button>
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() =>
                        registrarMovimentacaoBoletimCampo({
                          tipo: 'saida',
                          motivo: 'morte',
                          quantidade: modalMovBoletimCampo.qtdMov,
                          origemRow: modalMovBoletimCampo.origemRow,
                          destinoRow: null
                        })
                      }
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Morte
                    </button>
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() =>
                        registrarMovimentacaoBoletimCampo({
                          tipo: 'saida',
                          motivo: 'venda',
                          quantidade: modalMovBoletimCampo.qtdMov,
                          origemRow: modalMovBoletimCampo.origemRow,
                          destinoRow: null
                        })
                      }
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Venda
                    </button>
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'qtd_choice' }))}
                      className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-bold text-sm"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}

              {modalMovBoletimCampo.step === 'motivo' && modalMovBoletimCampo.operacao === 'entrada' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Qual a origem?</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() =>
                        registrarMovimentacaoBoletimCampo({
                          tipo: 'entrada',
                          motivo: 'nascimento',
                          quantidade: modalMovBoletimCampo.qtdMov,
                          origemRow: modalMovBoletimCampo.origemRow,
                          destinoRow: null
                        })
                      }
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Nascimento
                    </button>
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() =>
                        registrarMovimentacaoBoletimCampo({
                          tipo: 'entrada',
                          motivo: 'entrada_externa',
                          quantidade: modalMovBoletimCampo.qtdMov,
                          origemRow: modalMovBoletimCampo.origemRow,
                          destinoRow: null
                        })
                      }
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      Entrada de fora
                    </button>
                    <button
                      type="button"
                      disabled={salvandoMovBoletimCampo}
                      onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'qtd_choice' }))}
                      className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-bold text-sm"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}

              {modalMovBoletimCampo.step === 'dest_piquete' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Escolha o destino (piquete)</h4>
                  {(() => {
                    const boletimRowsAll = (reportData?.data || []).filter(r =>
                      r && r.local !== 'TOTAL GERAL' && r.local_1 !== 'TOTAL GERAL' && r.sub_local_2 !== 'TOTAL GERAL'
                    )
                    const piqKeyOf = (r) => (String(r.sub_local_2 || r.local || r.local_1 || 'Não alocados').trim())
                    const map = {}
                    boletimRowsAll.forEach(r => {
                      const k = piqKeyOf(r)
                      if (!map[k]) map[k] = { chave: k, total: 0, count: 0 }
                      map[k].total += parseInt(r.quant) || 0
                      map[k].count += 1
                    })
                    const piquetes = Object.values(map).sort((a, b) => (b.total || 0) - (a.total || 0))

                    return piquetes.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum destino cadastrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {piquetes.map((p) => (
                          <button
                            key={p.chave}
                            type="button"
                            disabled={salvandoMovBoletimCampo}
                            onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'dest_local', destPiquete: p.chave }))}
                            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-gray-900 dark:text-white">{p.chave}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{p.count} locais</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })()}

                  <button
                    type="button"
                    disabled={salvandoMovBoletimCampo}
                    onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'motivo' }))} 
                    className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-bold text-sm"
                  >
                    Voltar
                  </button>
                </div>
              )}

              {modalMovBoletimCampo.step === 'dest_local' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Escolha o local dentro do piquete {modalMovBoletimCampo.destPiquete}
                  </h4>
                  {(() => {
                    const boletimRowsAll = (reportData?.data || []).filter(r =>
                      r && r.local !== 'TOTAL GERAL' && r.local_1 !== 'TOTAL GERAL' && r.sub_local_2 !== 'TOTAL GERAL'
                    )
                    const piqKeyOf = (r) => (String(r.sub_local_2 || r.local || r.local_1 || 'Não alocados').trim())
                    const destRows = boletimRowsAll.filter(r => piqKeyOf(r) === String(modalMovBoletimCampo.destPiquete))
                    return destRows.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum local encontrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {destRows.map((r) => {
                          const label = [r.local, r.local_1, r.sub_local_2].filter(Boolean).join(' / ')
                          const place = (r.local_1 && String(r.local_1).trim() !== '-' ? r.local_1 : r.sub_local_2) || r.local
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={salvandoMovBoletimCampo}
                              onClick={() => {
                                registrarMovimentacaoBoletimCampo({
                                  tipo: 'saida',
                                  motivo: 'piquete',
                                  quantidade: modalMovBoletimCampo.qtdMov,
                                  origemRow: modalMovBoletimCampo.origemRow,
                                  destinoRow: r
                                })
                              }}
                              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-gray-900 dark:text-white truncate">{place}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{parseInt(r.quant) || 0} no local</span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{label}</p>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}

                  <button
                    type="button"
                    disabled={salvandoMovBoletimCampo}
                    onClick={() => setModalMovBoletimCampo(m => ({ ...m, step: 'dest_piquete' }))}
                    className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-bold text-sm"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}
