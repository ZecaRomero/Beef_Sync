/**
 * Relatório de Vendas e Clientes - Beef-Sync
 * Importação de Excel, análise por cliente, gráficos e exportação detalhada
 */
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { AnimatePresence, motion } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

if (typeof window !== 'undefined') {
  ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend)
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => {
  if (!d) return '-'
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt)) return String(d)
  return dt.toLocaleDateString('pt-BR')
}
const diasEntre = (a, b) => Math.round((b - a) / 86400000)
const parseDate = (v) => {
  if (!v) return null
  if (v instanceof Date) return isNaN(v) ? null : v
  const s = String(v).trim()
  // dd/mm/yyyy
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1])
  // yyyy-mm-dd
  const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3])
  // Excel serial number
  if (/^\d{5}$/.test(s)) {
    const d = new Date((+s - 25569) * 86400000)
    return isNaN(d) ? null : d
  }
  const d = new Date(s)
  return isNaN(d) ? null : d
}
const parseValor = (v) => {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const s = String(v).replace(/[R$\s]/g, '')
  // 1.234,56 → 1234.56
  if (/\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  return parseFloat(s.replace(',', '.')) || 0
}

// ─── Mapeamento de colunas do Excel ─────────────────────────────────────────
const COL_MAP = {
  serie: ['série', 'serie', 'SÉRIE', 'SERIE'],
  rg: ['rg', 'RG', 'Rg'],
  sexo: ['sexo', 'Sexo', 'SEXO'],
  comprador: ['comprador', 'Comprador', 'COMPRADOR', 'cliente', 'Cliente', 'CLIENTE', 'destino', 'Destino'],
  estado: ['estado', 'Estado', 'ESTADO', 'uf', 'UF'],
  dataVenda: ['data venda', 'Data Venda', 'DATA VENDA', 'data_venda', 'dataVenda', 'data'],
  dataNasc: ['datanasc', 'DataNasc', 'DATANASC', 'data_nasc', 'data nascimento', 'Data Nascimento'],
  idade: ['idade', 'Idade', 'IDADE'],
  notaFiscal: ['nº nota fiscal', 'Nº Nota Fiscal', 'nota fiscal', 'Nota Fiscal', 'NOTA FISCAL', 'nf', 'NF', 'numero_nf'],
  valor: ['valor', 'Valor', 'VALOR', 'valor_total', 'valorTotal'],
}

function mapRow(raw, headers) {
  const find = (aliases) => {
    for (const a of aliases) {
      const idx = headers.findIndex(h => h.trim().toLowerCase() === a.toLowerCase())
      if (idx >= 0) return raw[idx] ?? raw[headers[idx]]
    }
    // fallback: try raw object keys
    for (const a of aliases) {
      if (raw[a] !== undefined) return raw[a]
    }
    return null
  }
  return {
    serie: String(find(COL_MAP.serie) || '').trim(),
    rg: String(find(COL_MAP.rg) || '').trim(),
    sexo: String(find(COL_MAP.sexo) || '').trim(),
    comprador: String(find(COL_MAP.comprador) || '').trim(),
    estado: String(find(COL_MAP.estado) || '').trim(),
    dataVenda: parseDate(find(COL_MAP.dataVenda)),
    dataNasc: parseDate(find(COL_MAP.dataNasc)),
    idade: String(find(COL_MAP.idade) || '').trim(),
    notaFiscal: String(find(COL_MAP.notaFiscal) || '').trim(),
    valor: parseValor(find(COL_MAP.valor)),
  }
}

// ─── Análise de clientes ────────────────────────────────────────────────────
function analisarClientes(vendas) {
  const hoje = new Date()
  const porCliente = {}
  vendas.forEach(v => {
    const nome = v.comprador || 'Não informado'
    if (!porCliente[nome]) porCliente[nome] = { nome, vendas: [], estados: new Set() }
    porCliente[nome].vendas.push(v)
    if (v.estado) porCliente[nome].estados.add(v.estado)
  })

  return Object.values(porCliente).map(c => {
    const vendasOrdenadas = c.vendas.sort((a, b) => (b.dataVenda || 0) - (a.dataVenda || 0))
    const ultimaCompra = vendasOrdenadas[0]?.dataVenda
    const primeiraCompra = vendasOrdenadas[vendasOrdenadas.length - 1]?.dataVenda
    const diasSemComprar = ultimaCompra ? diasEntre(ultimaCompra, hoje) : 9999
    const totalGasto = c.vendas.reduce((s, v) => s + v.valor, 0)
    const ticketMedio = totalGasto / c.vendas.length
    const machos = c.vendas.filter(v => /^m/i.test(v.sexo)).length
    const femeas = c.vendas.filter(v => /^f/i.test(v.sexo)).length
    const notas = [...new Set(c.vendas.map(v => v.notaFiscal).filter(Boolean))]

    // Classificação de atenção
    // Clientes com total ≤ R$3.000 e última compra há +5 anos → baixa prioridade
    const baixoValorAntigo = totalGasto <= 3000 && diasSemComprar > 1825
    let atencao = 'normal'
    let atencaoLabel = '✅ Ativo'
    let atencaoCor = 'green'
    if (baixoValorAntigo) {
      atencao = 'baixa'
      atencaoLabel = '⚪ Baixa prioridade'
      atencaoCor = 'gray'
    } else if (diasSemComprar > 365) {
      atencao = 'critica'
      atencaoLabel = '🔴 Inativo (+1 ano)'
      atencaoCor = 'red'
    } else if (diasSemComprar > 180) {
      atencao = 'alta'
      atencaoLabel = '🟠 Atenção (+6 meses)'
      atencaoCor = 'orange'
    } else if (diasSemComprar > 90) {
      atencao = 'media'
      atencaoLabel = '🟡 Acompanhar (+3 meses)'
      atencaoCor = 'yellow'
    }

    // Score de valor (0-100)
    const score = Math.min(100, Math.round(
      (c.vendas.length * 15) + (totalGasto / 1000) + (diasSemComprar < 90 ? 20 : 0)
    ))

    return {
      nome: c.nome,
      totalCompras: c.vendas.length,
      totalGasto,
      ticketMedio,
      ultimaCompra,
      primeiraCompra,
      diasSemComprar,
      machos,
      femeas,
      estados: [...c.estados],
      notas,
      atencao,
      atencaoLabel,
      atencaoCor,
      score,
      vendas: vendasOrdenadas,
    }
  }).sort((a, b) => b.totalGasto - a.totalGasto)
}

function buildRelatorioIdentityHeaders(user, permissions) {
  const isDev = user?.user_metadata?.role === 'desenvolvedor' || permissions?.isDeveloper
  const userRole = isDev ? 'desenvolvedor' : 'externo'
  const userName =
    user?.user_metadata?.nome ||
    user?.email?.split('@')[0] ||
    (permissions?.userName && permissions.userName !== 'Carregando...' ? permissions.userName : '') ||
    ''
  const userEmail = user?.email || ''
  return {
    'x-user-role': userRole,
    'x-user-name': userName,
    'x-user-email': userEmail,
  }
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function RelatorioVendas() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const permissions = usePermissions()
  const [vendas, setVendas] = useState([])
  const [carregandoBase, setCarregandoBase] = useState(false)
  const [importando, setImportando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [tab, setTab] = useState('clientes') // clientes | historico | graficos
  const [search, setSearch] = useState('')
  const [filtroAtencao, setFiltroAtencao] = useState('todos')
  const [filtroOrigem, setFiltroOrigem] = useState('todos') // todos | excel | base
  const [clienteExpandido, setClienteExpandido] = useState(null)
  const [toast, setToast] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const [showSenhaModal, setShowSenhaModal] = useState(false)
  const [senhaInput, setSenhaInput] = useState('')
  const [isLocal, setIsLocal] = useState(false)
  const [sincronizandoBaixas, setSincronizandoBaixas] = useState(false)

  const syncTimerRef = useRef(null)
  const userRef = useRef(user)
  const permissionsRef = useRef(permissions)
  useEffect(() => {
    userRef.current = user
    permissionsRef.current = permissions
  }, [user, permissions])

  const canPushRelatorioCloudSnapshot = useCallback((u, p) => {
    if (!u) return false
    const isDev = u?.user_metadata?.role === 'desenvolvedor' || p?.isDeveloper
    const email = String(u?.email || '').toLowerCase()
    const nome = String(u?.user_metadata?.nome || '').toLowerCase()
    const isZecaIdentity = email.includes('zeca') || nome.includes('zeca')
    return isDev || isZecaIdentity
  }, [])

  const schedulePushRelatorioCloud = useCallback((lista) => {
    if (typeof window === 'undefined') return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      const u = userRef.current
      const p = permissionsRef.current
      if (!canPushRelatorioCloudSnapshot(u, p)) return
      try {
        await fetch('/api/notas-fiscais/vendas-relatorio-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildRelatorioIdentityHeaders(u, p),
          },
          body: JSON.stringify({ vendas: lista }),
        })
      } catch (_) {}
    }, 1000)
  }, [canPushRelatorioCloudSnapshot])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDark(document.documentElement.classList.contains('dark'))
    setIsLocal(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    // Carregar vendas salvas
    try {
      const saved = localStorage.getItem('beef-vendas-historico')
      if (saved) setVendas(JSON.parse(saved, (k, v) => {
        if (k === 'dataVenda' || k === 'dataNasc') return v ? new Date(v) : null
        return v
      }))
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const salvarVendas = useCallback((novas) => {
    setVendas(novas)
    try { localStorage.setItem('beef-vendas-historico', JSON.stringify(novas)) } catch (_) {}
    schedulePushRelatorioCloud(novas)
  }, [schedulePushRelatorioCloud])

  // ─── Limpar tudo com senha de desenvolvedor ─────────────────────────────
  const handleLimparTudo = useCallback(async () => {
    if (senhaInput !== 'dev2026') {
      setToast({ type: 'error', msg: 'Senha incorreta' })
      return
    }
    try {
      // Apagar do banco online
      const resp = await fetch('/api/notas-fiscais/limpar-todas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaInput })
      })
      const json = await resp.json()
      if (!resp.ok || !json.success) throw new Error(json.message || 'Erro ao apagar')

      // Limpar localStorage
      salvarVendas([])
      setShowSenhaModal(false)
      setSenhaInput('')
      setToast({ type: 'success', msg: `Tudo apagado (${json.deletados} notas removidas do banco)` })
    } catch (err) {
      console.error('Erro ao limpar:', err)
      setToast({ type: 'error', msg: err.message || 'Erro ao apagar dados' })
    }
  }, [senhaInput, salvarVendas])

  const carregarResumoDaBase = useCallback(async ({ showToast = false } = {}) => {
    setCarregandoBase(true)
    try {
      const hoje = new Date()
      const endDate = new Date(hoje)
      endDate.setFullYear(endDate.getFullYear() + 2)
      const params = new URLSearchParams({
        tipo: 'notas_fiscais',
        startDate: '2015-01-01',
        endDate: endDate.toISOString().split('T')[0],
        t: Date.now().toString()
      })
      const response = await fetch(`/api/mobile-reports?${params}`, { cache: 'no-store' })
      const json = await response.json()
      const rows = json?.data?.data || []
      if (!json?.success || !Array.isArray(rows) || rows.length === 0) return

      // Converte linhas de NF em "vendas" mínimas para exibir o resumo no app.
      const vindasDaBase = rows
        .filter(r => String(r?.tipo || '').toLowerCase() === 'saida')
        .map(r => ({
          serie: '',
          rg: String(r?.nf ?? '').trim(),
          sexo: '',
          comprador: String(r?.fornecedor ?? 'Não informado').trim(),
          estado: '',
          dataVenda: parseDate(r?.data),
          dataNasc: null,
          idade: '',
          notaFiscal: String(r?.nf ?? '').trim(),
          valor: parseValor(r?.valor),
          origem: 'base',
        }))
        .filter(v => v.notaFiscal || v.comprador || v.valor > 0)

      if (vindasDaBase.length > 0) {
        // Estado funcional: sempre mescla com o Excel já carregado (evita closure obsoleta com vendas = []).
        setVendas(prev => {
          const excelExistentes = prev.filter(v => v.origem === 'excel')
          const existentes = new Set(excelExistentes.map(v => `${v.notaFiscal}|${v.rg}`))
          const baseSemDuplicatas = vindasDaBase.filter(v => !existentes.has(`${v.notaFiscal}|${v.rg}`))
          const merged = [...excelExistentes, ...baseSemDuplicatas]
          try { localStorage.setItem('beef-vendas-historico', JSON.stringify(merged)) } catch (_) {}
          schedulePushRelatorioCloud(merged)
          return merged
        })
        if (showToast) setToast({ type: 'success', msg: `${vindasDaBase.length} venda(s) carregada(s) da base` })
      }
    } catch (_) {
      // Sem bloquear a tela quando a API falhar.
    } finally {
      setCarregandoBase(false)
    }
  }, [schedulePushRelatorioCloud])

  useEffect(() => {
    if (typeof window === 'undefined') return
    carregarResumoDaBase()
  }, [carregarResumoDaBase])

  /** Buscar snapshot na nuvem (PostgreSQL) para alinhar Vercel/mobile com localhost após o 1º save por desenvolvedor. */
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || !user?.email) return
    const canReadCloud =
      String(user.email).toLowerCase().includes('zeca') ||
      String(user?.user_metadata?.nome || '').toLowerCase().includes('zeca')
    if (!canReadCloud) return

    let cancelled = false
    const t = setTimeout(() => {
      ;(async () => {
        try {
          const r = await fetch('/api/notas-fiscais/vendas-relatorio-sync', {
            headers: buildRelatorioIdentityHeaders(user, permissions),
            cache: 'no-store',
          })
          const j = await r.json()
          if (cancelled || !r.ok || !j.success) return
          const serverList = j.data?.vendas
          if (!Array.isArray(serverList) || serverList.length === 0) return

          setVendas(prev => {
            const revived = JSON.parse(JSON.stringify(serverList), (key, v) => {
              if (key === 'dataVenda' || key === 'dataNasc') return v ? new Date(v) : null
              return v
            })
            if (revived.length > prev.length) {
              try { localStorage.setItem('beef-vendas-historico', JSON.stringify(revived)) } catch (_) {}
              return revived
            }
            if (prev.length > revived.length && prev.length > 0) schedulePushRelatorioCloud(prev)
            return prev
          })
        } catch (_) {}
      })()
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [authLoading, user?.email, user?.user_metadata?.nome, permissions.isDeveloper, permissions.userName, schedulePushRelatorioCloud])

  /**
   * Ao logar: se já existir histórico grande só no localStorage, envia snapshot (antes só subia após salvar/editar e só como Desenvolvedor).
   */
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading || !user?.email) return
    if (!canPushRelatorioCloudSnapshot(user, permissions)) return
    try {
      const raw = localStorage.getItem('beef-vendas-historico')
      if (!raw) return
      const parsed = JSON.parse(raw, (k, v) => {
        if (k === 'dataVenda' || k === 'dataNasc') return v ? new Date(v) : null
        return v
      })
      if (!Array.isArray(parsed) || parsed.length === 0) return
      schedulePushRelatorioCloud(parsed)
    } catch (_) {}
  }, [authLoading, user?.id, user?.email, user?.user_metadata?.nome, user?.user_metadata?.role, permissions.isDeveloper, canPushRelatorioCloudSnapshot, schedulePushRelatorioCloud])

  // ─── Importar Excel ─────────────────────────────────────────────────────
  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportando(true)
    try {
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      if (rows.length < 2) { setToast({ type: 'error', msg: 'Planilha vazia ou sem dados' }); return }

      const headers = rows[0].map(h => String(h).trim())
      const mapped = rows.slice(1)
        .filter(r => r.some(c => c !== '' && c != null))
        .map(r => ({ ...mapRow(r, headers), origem: 'excel' }))
        .filter(r => r.comprador || r.notaFiscal || r.valor > 0)

      if (mapped.length === 0) { setToast({ type: 'error', msg: 'Nenhum dado válido encontrado na planilha' }); return }

      // Sincronizar com banco online para aparecer em qualquer dispositivo/ambiente.
      const payload = mapped.map(v => ({
        numero_nf: v.notaFiscal || `${v.rg || ''}`.trim(),
        tipo: 'saida',
        data: v.dataVenda ? new Date(v.dataVenda).toISOString().split('T')[0] : null,
        fornecedor: 'Planilha de vendas',
        destino: v.comprador || null,
        valor_total: Number(v.valor || 0)
      })).filter(v => v.numero_nf)

      const isDev = user?.user_metadata?.role === 'desenvolvedor' || permissions.isDeveloper
      const userRole = isDev ? 'desenvolvedor' : 'externo'
      const userName =
        user?.user_metadata?.nome ||
        user?.email?.split('@')[0] ||
        (permissions.userName && permissions.userName !== 'Carregando...' ? permissions.userName : '') ||
        ''
      const userEmail = user?.email || ''

      const importResp = await fetch('/api/notas-fiscais/import-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': userName,
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          data: payload,
          userRole,
          userName,
          userEmail,
        })
      })
      const importJson = await importResp.json().catch(() => ({}))
      if (!importResp.ok || !importJson?.success) {
        throw new Error(importJson?.message || 'Falha ao salvar no banco online')
      }

      await carregarResumoDaBase({ showToast: false })

      // Unir base já gravada no storage (após merge da API) com linhas Excel novas — não usar `vendas` do render (pode estar defasado).
      const saved = JSON.parse(localStorage.getItem('beef-vendas-historico') || '[]', (k, v) => {
        if (k === 'dataVenda' || k === 'dataNasc') return v ? new Date(v) : null
        return v
      })
      const excelExistentes = saved.filter(v => v.origem === 'excel')
      const existentesKeys = new Set(excelExistentes.map(v => `${v.notaFiscal}|${v.rg}`))
      const novosExcel = mapped.filter(v => !existentesKeys.has(`${v.notaFiscal}|${v.rg}`))
      const baseData = saved.filter(v => v.origem === 'base')
      salvarVendas([...baseData, ...excelExistentes, ...novosExcel])

      setToast({ type: 'success', msg: `${payload.length} registro(s) enviado(s) para o banco · ${novosExcel.length} novos do Excel` })
    } catch (err) {
      console.error('Erro ao importar:', err)
      setToast({ type: 'error', msg: err.message || 'Erro ao importar para o banco online' })
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }, [carregarResumoDaBase, salvarVendas, permissions.isDeveloper, permissions.userName, user?.email, user?.user_metadata?.role, user?.user_metadata?.nome])

  // ─── Análise ────────────────────────────────────────────────────────────
  const vendasFiltradas = useMemo(() => {
    if (filtroOrigem === 'todos') return vendas
    return vendas.filter(v => v.origem === filtroOrigem)
  }, [vendas, filtroOrigem])

  const clientes = useMemo(() => analisarClientes(vendasFiltradas), [vendasFiltradas])

  const clientesFiltrados = useMemo(() => {
    let list = clientes
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.nome.toLowerCase().includes(q) || c.estados.some(e => e.toLowerCase().includes(q)))
    }
    if (filtroAtencao !== 'todos') list = list.filter(c => c.atencao === filtroAtencao)
    return list
  }, [clientes, search, filtroAtencao])

  const historicoFiltrado = useMemo(() => {
    let list = vendasFiltradas
    if (search && tab === 'historico') {
      const q = search.toLowerCase()
      list = list.filter(v => 
        (v.notaFiscal && v.notaFiscal.toLowerCase().includes(q)) ||
        (v.rg && v.rg.toLowerCase().includes(q)) ||
        (v.comprador && v.comprador.toLowerCase().includes(q)) ||
        (v.estado && v.estado.toLowerCase().includes(q))
      )
    }
    return list
  }, [vendasFiltradas, search, tab])

  /** Linhas com série+RG (necessário para baixa bater com o cadastro de animais). */
  const qtdComSerieRg = useMemo(() =>
    vendasFiltradas.filter(v => String(v.serie || '').trim() && String(v.rg || '').trim()).length,
  [vendasFiltradas])

  const sincronizarBaixasNoApp = useCallback(async () => {
    const comChave = vendasFiltradas.filter(v => String(v.serie || '').trim() && String(v.rg || '').trim())
    if (comChave.length === 0) {
      setToast({ type: 'error', msg: 'Nenhuma linha com Série e RG. Importe a planilha com essas colunas preenchidas.' })
      return
    }
    setSincronizandoBaixas(true)
    try {
      const payload = comChave.map(v => ({
        serie: v.serie,
        rg: v.rg,
        dataVenda: v.dataVenda instanceof Date ? v.dataVenda.toISOString() : v.dataVenda,
        valor: v.valor,
        comprador: v.comprador,
        notaFiscal: v.notaFiscal,
      }))
      const resp = await fetch('/api/animals/sincronizar-vendas-relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendas: payload }),
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || json.success === false) {
        throw new Error(json.error || json.message || 'Falha ao sincronizar baixas')
      }
      const partes = [
        json.inseridos > 0 ? `${json.inseridos} venda(s) lançada(s) em Baixas` : null,
        json.animais_atualizados > 0 ? `${json.animais_atualizados} animal(is) marcado(s) como vendido` : null,
        json.ignorados_ja_vendidos > 0 ? `${json.ignorados_ja_vendidos} já tinham baixa de venda` : null,
        json.ignorados_duplicados_no_lote > 0 ? `${json.ignorados_duplicados_no_lote} duplicado(s) na lista` : null,
      ].filter(Boolean)
      if (partes.length === 0 && json.inseridos === 0) {
        partes.push('Nenhuma baixa nova (todos já vendidos ou sem alteração)')
      }
      const msg = partes.join(' · ') + (json.erros?.length ? ` · Aviso: ${json.erros.length} linha(s) com erro (veja o console)` : '')
      setToast({ type: json.erros?.length && json.inseridos === 0 ? 'error' : 'success', msg })
      if (json.erros?.length) console.warn('Sincronizar baixas:', json.erros)
    } catch (err) {
      console.error(err)
      setToast({ type: 'error', msg: err.message || 'Erro ao lançar baixas' })
    } finally {
      setSincronizandoBaixas(false)
    }
  }, [vendasFiltradas])

  const resumoGeral = useMemo(() => {
    const total = vendasFiltradas.reduce((s, v) => s + v.valor, 0)
    const machos = vendasFiltradas.filter(v => /^m/i.test(v.sexo)).length
    const femeas = vendasFiltradas.filter(v => /^f/i.test(v.sexo)).length
    const notas = [...new Set(vendasFiltradas.map(v => v.notaFiscal).filter(Boolean))].length
    const criticos = clientes.filter(c => c.atencao === 'critica').length
    const atencaoAlta = clientes.filter(c => c.atencao === 'alta').length
    return { total, machos, femeas, notas, totalAnimais: vendasFiltradas.length, totalClientes: clientes.length, criticos, atencaoAlta }
  }, [vendasFiltradas, clientes])

  // ─── Dados para gráficos simples (barras CSS) ──────────────────────────
  const topClientes = useMemo(() => clientes.slice(0, 8), [clientes])
  const vendasPorMes = useMemo(() => {
    const meses = {}
    vendasFiltradas.forEach(v => {
      if (!v.dataVenda) return
      const key = `${v.dataVenda.getFullYear()}-${String(v.dataVenda.getMonth() + 1).padStart(2, '0')}`
      if (!meses[key]) meses[key] = { mes: key, total: 0, qtd: 0 }
      meses[key].total += v.valor
      meses[key].qtd++
    })
    return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes))
  }, [vendasFiltradas])
  const vendasPorEstado = useMemo(() => {
    const estados = {}
    vendasFiltradas.forEach(v => {
      const e = v.estado || 'N/I'
      if (!estados[e]) estados[e] = { estado: e, total: 0, qtd: 0 }
      estados[e].total += v.valor
      estados[e].qtd++
    })
    return Object.values(estados).sort((a, b) => b.total - a.total)
  }, [vendasFiltradas])

  // Vendas por sexo com valor
  const vendasPorSexo = useMemo(() => {
    const machos = vendasFiltradas.filter(v => /^m/i.test(v.sexo))
    const femeas = vendasFiltradas.filter(v => /^f/i.test(v.sexo))
    const outros = vendasFiltradas.filter(v => !/^[mf]/i.test(v.sexo))
    return {
      machos: { qtd: machos.length, total: machos.reduce((s, v) => s + v.valor, 0) },
      femeas: { qtd: femeas.length, total: femeas.reduce((s, v) => s + v.valor, 0) },
      outros: { qtd: outros.length, total: outros.reduce((s, v) => s + v.valor, 0) },
    }
  }, [vendasFiltradas])

  // Vendas por faixa de valor
  const vendasPorFaixa = useMemo(() => {
    const faixas = { 'Até R$5k': 0, 'R$5k-10k': 0, 'R$10k-20k': 0, 'R$20k-50k': 0, 'R$50k+': 0 }
    const faixasVal = { 'Até R$5k': 0, 'R$5k-10k': 0, 'R$10k-20k': 0, 'R$20k-50k': 0, 'R$50k+': 0 }
    vendasFiltradas.forEach(v => {
      if (v.valor <= 5000) { faixas['Até R$5k']++; faixasVal['Até R$5k'] += v.valor }
      else if (v.valor <= 10000) { faixas['R$5k-10k']++; faixasVal['R$5k-10k'] += v.valor }
      else if (v.valor <= 20000) { faixas['R$10k-20k']++; faixasVal['R$10k-20k'] += v.valor }
      else if (v.valor <= 50000) { faixas['R$20k-50k']++; faixasVal['R$20k-50k'] += v.valor }
      else { faixas['R$50k+']++; faixasVal['R$50k+'] += v.valor }
    })
    return Object.entries(faixas).map(([faixa, qtd]) => ({ faixa, qtd, total: faixasVal[faixa] }))
  }, [vendasFiltradas])

  // Frequência de compra por cliente
  const frequenciaClientes = useMemo(() => {
    const freq = { '1 compra': 0, '2-3 compras': 0, '4-5 compras': 0, '6-10 compras': 0, '10+ compras': 0 }
    clientes.forEach(c => {
      if (c.totalCompras === 1) freq['1 compra']++
      else if (c.totalCompras <= 3) freq['2-3 compras']++
      else if (c.totalCompras <= 5) freq['4-5 compras']++
      else if (c.totalCompras <= 10) freq['6-10 compras']++
      else freq['10+ compras']++
    })
    return Object.entries(freq).map(([faixa, qtd]) => ({ faixa, qtd }))
  }, [clientes])

  // Cores para gráficos
  const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
  const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '99')

  // ─── Exportar Excel completo ────────────────────────────────────────────
  const exportarExcel = useCallback(async () => {
    if (vendasFiltradas.length === 0) return
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Beef-Sync'
      wb.created = new Date()

      const headerStyle = (color) => ({
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color } },
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thin', color: { argb: 'FF000000' } } },
      })
      const applyHeader = (sheet, color) => {
        const row = sheet.getRow(1)
        row.height = 28
        row.eachCell(cell => Object.assign(cell, headerStyle(color)))
      }

      // ── Aba 1: Resumo Executivo ──
      const ws1 = wb.addWorksheet('📊 Resumo Executivo')
      ws1.columns = [{ key: 'ind', width: 35 }, { key: 'val', width: 25 }]
      ws1.addRow({ ind: 'Indicador', val: 'Valor' })
      applyHeader(ws1, 'FFE67E22')
      const dados1 = [
        ['Total de Vendas', fmt(resumoGeral.total)],
        ['Total de Animais Vendidos', resumoGeral.totalAnimais],
        ['Total de Clientes', resumoGeral.totalClientes],
        ['Total de Notas Fiscais', resumoGeral.notas],
        ['Machos Vendidos', resumoGeral.machos],
        ['Fêmeas Vendidas', resumoGeral.femeas],
        ['Ticket Médio por Animal', fmt(resumoGeral.total / (resumoGeral.totalAnimais || 1))],
        ['Ticket Médio por Cliente', fmt(resumoGeral.total / (resumoGeral.totalClientes || 1))],
        ['Clientes Inativos (+1 ano)', resumoGeral.criticos],
        ['Clientes que Precisam Atenção (+6m)', resumoGeral.atencaoAlta],
        ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
      ]
      dados1.forEach(([ind, val]) => ws1.addRow({ ind, val }))

      // ── Aba 2: Análise por Cliente ──
      const ws2 = wb.addWorksheet('👥 Análise por Cliente')
      ws2.columns = [
        { key: 'nome', width: 30 },
        { key: 'compras', width: 12 },
        { key: 'total', width: 18 },
        { key: 'ticket', width: 18 },
        { key: 'ultima', width: 14 },
        { key: 'primeira', width: 14 },
        { key: 'dias', width: 16 },
        { key: 'machos', width: 10 },
        { key: 'femeas', width: 10 },
        { key: 'estados', width: 15 },
        { key: 'status', width: 22 },
        { key: 'score', width: 10 },
        { key: 'recomendacao', width: 45 },
      ]
      ws2.addRow({
        nome: 'Cliente', compras: 'Compras', total: 'Valor Total', ticket: 'Ticket Médio',
        ultima: 'Última Compra', primeira: '1ª Compra', dias: 'Dias s/ Comprar',
        machos: 'Machos', femeas: 'Fêmeas', estados: 'Estados', status: 'Status',
        score: 'Score', recomendacao: 'Recomendação IA',
      })
      applyHeader(ws2, 'FF3B82F6')
      clientes.forEach(c => {
        let rec = ''
        if (c.atencao === 'baixa') rec = `⚪ Baixa prioridade. Total gasto: ${fmt(c.totalGasto)} há ${Math.round(c.diasSemComprar / 365)} anos. Manter no cadastro sem ação urgente.`
        else if (c.atencao === 'critica') rec = `⚠️ Cliente inativo há ${c.diasSemComprar} dias. Recomenda-se contato urgente para reativação. Já comprou ${c.totalCompras} vezes totalizando ${fmt(c.totalGasto)}.`
        else if (c.atencao === 'alta') rec = `🔔 Sem compras há ${c.diasSemComprar} dias. Enviar oferta personalizada. Perfil: ${c.machos > c.femeas ? 'prefere machos' : c.femeas > c.machos ? 'prefere fêmeas' : 'compra ambos os sexos'}.`
        else if (c.atencao === 'media') rec = `📋 Acompanhar. Última compra há ${c.diasSemComprar} dias. Ticket médio: ${fmt(c.ticketMedio)}.`
        else rec = `✅ Cliente ativo e recorrente. Manter relacionamento. ${c.totalCompras > 3 ? 'Cliente fiel, considerar condições especiais.' : ''}`
        ws2.addRow({
          nome: c.nome, compras: c.totalCompras, total: c.totalGasto, ticket: c.ticketMedio,
          ultima: fmtDate(c.ultimaCompra), primeira: fmtDate(c.primeiraCompra), dias: c.diasSemComprar,
          machos: c.machos, femeas: c.femeas, estados: c.estados.join(', '),
          status: c.atencaoLabel, score: c.score, recomendacao: rec,
        })
      })
      ws2.getColumn('total').numFmt = 'R$ #,##0.00'
      ws2.getColumn('ticket').numFmt = 'R$ #,##0.00'

      // ── Aba 3: Histórico Completo ──
      const ws3 = wb.addWorksheet('📋 Histórico de Vendas')
      ws3.columns = [
        { key: 'nf', width: 15 }, { key: 'serie', width: 10 }, { key: 'rg', width: 10 },
        { key: 'sexo', width: 10 }, { key: 'comprador', width: 28 }, { key: 'estado', width: 8 },
        { key: 'dataVenda', width: 14 }, { key: 'dataNasc', width: 14 }, { key: 'idade', width: 10 },
        { key: 'valor', width: 16 },
      ]
      ws3.addRow({ nf: 'Nota Fiscal', serie: 'Série', rg: 'RG', sexo: 'Sexo', comprador: 'Comprador', estado: 'Estado', dataVenda: 'Data Venda', dataNasc: 'Data Nasc.', idade: 'Idade', valor: 'Valor' })
      applyHeader(ws3, 'FF10B981')
      vendasFiltradas.forEach(v => ws3.addRow({
        nf: v.notaFiscal, serie: v.serie, rg: v.rg, sexo: v.sexo, comprador: v.comprador,
        estado: v.estado, dataVenda: fmtDate(v.dataVenda), dataNasc: fmtDate(v.dataNasc),
        idade: v.idade, valor: v.valor,
      }))
      ws3.getColumn('valor').numFmt = 'R$ #,##0.00'

      // ── Aba 4: Vendas por Mês ──
      const ws4 = wb.addWorksheet('📅 Vendas por Mês')
      ws4.columns = [{ key: 'mes', width: 15 }, { key: 'qtd', width: 12 }, { key: 'total', width: 18 }]
      ws4.addRow({ mes: 'Mês', qtd: 'Qtd Animais', total: 'Valor Total' })
      applyHeader(ws4, 'FF8B5CF6')
      vendasPorMes.forEach(m => ws4.addRow({ mes: m.mes, qtd: m.qtd, total: m.total }))
      ws4.getColumn('total').numFmt = 'R$ #,##0.00'

      // ── Aba 5: Vendas por Estado ──
      const ws5 = wb.addWorksheet('🗺️ Vendas por Estado')
      ws5.columns = [{ key: 'estado', width: 15 }, { key: 'qtd', width: 12 }, { key: 'total', width: 18 }]
      ws5.addRow({ estado: 'Estado', qtd: 'Qtd Animais', total: 'Valor Total' })
      applyHeader(ws5, 'FFEF4444')
      vendasPorEstado.forEach(e => ws5.addRow({ estado: e.estado, qtd: e.qtd, total: e.total }))
      ws5.getColumn('total').numFmt = 'R$ #,##0.00'

      // ── Aba 6: Clientes que Precisam Atenção ──
      const ws6 = wb.addWorksheet('⚠️ Atenção Especial')
      ws6.columns = [
        { key: 'nome', width: 30 }, { key: 'status', width: 22 }, { key: 'dias', width: 16 },
        { key: 'ultima', width: 14 }, { key: 'total', width: 18 }, { key: 'compras', width: 12 },
        { key: 'acao', width: 50 },
      ]
      ws6.addRow({ nome: 'Cliente', status: 'Status', dias: 'Dias s/ Comprar', ultima: 'Última Compra', total: 'Valor Total', compras: 'Compras', acao: 'Ação Sugerida' })
      applyHeader(ws6, 'FFDC2626')
      clientes.filter(c => c.atencao !== 'normal').forEach(c => {
        let acao = ''
        if (c.atencao === 'baixa') acao = 'Baixa prioridade — manter cadastro, sem ação urgente'
        else if (c.atencao === 'critica') acao = 'URGENTE: Ligar para o cliente, oferecer condições especiais de reativação'
        else if (c.atencao === 'alta') acao = 'Enviar mensagem/WhatsApp com ofertas personalizadas'
        else acao = 'Manter contato, enviar novidades do rebanho'
        ws6.addRow({ nome: c.nome, status: c.atencaoLabel, dias: c.diasSemComprar, ultima: fmtDate(c.ultimaCompra), total: c.totalGasto, compras: c.totalCompras, acao })
      })
      ws6.getColumn('total').numFmt = 'R$ #,##0.00'

      // ── Aba 7: Vendas por Sexo ──
      const ws7 = wb.addWorksheet('⚧ Vendas por Sexo')
      ws7.columns = [{ key: 'sexo', width: 15 }, { key: 'qtd', width: 15 }, { key: 'total', width: 20 }, { key: 'percentual', width: 15 }, { key: 'ticketMedio', width: 20 }]
      ws7.addRow({ sexo: 'Sexo', qtd: 'Qtd Animais', total: 'Valor Total', percentual: '% do Total', ticketMedio: 'Ticket Médio' })
      applyHeader(ws7, 'FF8B5CF6')
      const totalVendido = resumoGeral.total || 1
      ;[
        { sexo: 'Machos', ...vendasPorSexo.machos },
        { sexo: 'Fêmeas', ...vendasPorSexo.femeas },
        { sexo: 'Outros/N.I.', ...vendasPorSexo.outros },
      ].filter(s => s.qtd > 0).forEach(s => {
        ws7.addRow({ sexo: s.sexo, qtd: s.qtd, total: s.total, percentual: `${((s.total / totalVendido) * 100).toFixed(1)}%`, ticketMedio: s.qtd > 0 ? s.total / s.qtd : 0 })
      })
      ws7.getColumn('total').numFmt = 'R$ #,##0.00'
      ws7.getColumn('ticketMedio').numFmt = 'R$ #,##0.00'

      // ── Aba 8: Faixa de Valor ──
      const ws8 = wb.addWorksheet('💰 Faixa de Valor')
      ws8.columns = [{ key: 'faixa', width: 18 }, { key: 'qtd', width: 15 }, { key: 'total', width: 20 }, { key: 'percentual', width: 15 }]
      ws8.addRow({ faixa: 'Faixa', qtd: 'Qtd Animais', total: 'Valor Total', percentual: '% do Total' })
      applyHeader(ws8, 'FF059669')
      vendasPorFaixa.forEach(f => {
        ws8.addRow({ faixa: f.faixa, qtd: f.qtd, total: f.total, percentual: `${((f.total / totalVendido) * 100).toFixed(1)}%` })
      })
      ws8.getColumn('total').numFmt = 'R$ #,##0.00'

      // ── Aba 9: Ranking de Clientes ──
      const ws9 = wb.addWorksheet('🏆 Ranking Clientes')
      ws9.columns = [
        { key: 'pos', width: 8 }, { key: 'nome', width: 30 }, { key: 'total', width: 18 },
        { key: 'compras', width: 12 }, { key: 'ticket', width: 18 }, { key: 'preferencia', width: 20 },
        { key: 'fidelidade', width: 18 }, { key: 'classificacao', width: 20 },
      ]
      ws9.addRow({ pos: '#', nome: 'Cliente', total: 'Valor Total', compras: 'Compras', ticket: 'Ticket Médio', preferencia: 'Preferência', fidelidade: 'Fidelidade', classificacao: 'Classificação' })
      applyHeader(ws9, 'FFD97706')
      clientes.forEach((c, i) => {
        const pref = c.machos > c.femeas ? 'Machos' : c.femeas > c.machos ? 'Fêmeas' : 'Ambos'
        const fid = c.totalCompras >= 10 ? '⭐ VIP' : c.totalCompras >= 5 ? '🥇 Fiel' : c.totalCompras >= 3 ? '🥈 Recorrente' : c.totalCompras >= 2 ? '🥉 Retornou' : '🆕 Novo'
        const classif = c.totalGasto >= 100000 ? 'Platinum' : c.totalGasto >= 50000 ? 'Gold' : c.totalGasto >= 20000 ? 'Silver' : 'Bronze'
        ws9.addRow({ pos: i + 1, nome: c.nome, total: c.totalGasto, compras: c.totalCompras, ticket: c.ticketMedio, preferencia: pref, fidelidade: fid, classificacao: classif })
      })
      ws9.getColumn('total').numFmt = 'R$ #,##0.00'
      ws9.getColumn('ticket').numFmt = 'R$ #,##0.00'

      // ── Aba 10: Vendas por Nota Fiscal ──
      const ws10 = wb.addWorksheet('🧾 Por Nota Fiscal')
      ws10.columns = [
        { key: 'nf', width: 15 }, { key: 'data', width: 14 }, { key: 'comprador', width: 28 },
        { key: 'estado', width: 8 }, { key: 'qtdAnimais', width: 14 }, { key: 'valorTotal', width: 18 },
        { key: 'machos', width: 10 }, { key: 'femeas', width: 10 },
      ]
      ws10.addRow({ nf: 'Nota Fiscal', data: 'Data', comprador: 'Comprador', estado: 'Estado', qtdAnimais: 'Qtd Animais', valorTotal: 'Valor Total', machos: 'Machos', femeas: 'Fêmeas' })
      applyHeader(ws10, 'FF2563EB')
      const porNF = {}
      vendasFiltradas.forEach(v => {
        const k = v.notaFiscal || 'S/N'
        if (!porNF[k]) porNF[k] = { nf: k, data: v.dataVenda, comprador: v.comprador, estado: v.estado, qtd: 0, total: 0, machos: 0, femeas: 0 }
        porNF[k].qtd++
        porNF[k].total += v.valor
        if (/^m/i.test(v.sexo)) porNF[k].machos++
        else if (/^f/i.test(v.sexo)) porNF[k].femeas++
      })
      Object.values(porNF).sort((a, b) => (b.data || 0) - (a.data || 0)).forEach(n => {
        ws10.addRow({ nf: n.nf, data: fmtDate(n.data), comprador: n.comprador, estado: n.estado, qtdAnimais: n.qtd, valorTotal: n.total, machos: n.machos, femeas: n.femeas })
      })
      ws10.getColumn('valorTotal').numFmt = 'R$ #,##0.00'

      // Download
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Relatorio_Vendas_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ type: 'success', msg: 'Relatório Excel exportado com 10 abas detalhadas' })
    } catch (err) {
      console.error('Erro ao exportar:', err)
      setToast({ type: 'error', msg: 'Erro ao gerar Excel' })
    } finally {
      setExportando(false)
    }
  }, [vendasFiltradas, clientes, resumoGeral, vendasPorMes, vendasPorEstado, vendasPorSexo, vendasPorFaixa])

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Relatório de Vendas | Beef-Sync</title></Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 overflow-x-hidden">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Relatório de Vendas
                  </h1>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    {vendasFiltradas.length} registros · {clientes.length} clientes
                  </p>
                </div>
              </div>
            </div>
            {isLocal && (
            <div className="flex flex-col sm:flex-row gap-2">
              <label className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${(importando || carregandoBase) ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'}`}>
                <ArrowUpTrayIcon className="h-4 w-4" />
                {importando ? 'Importando...' : carregandoBase ? 'Carregando base...' : 'Importar Excel'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" disabled={importando || carregandoBase} />
              </label>
              {vendas.length > 0 && (
                <div className="flex gap-2 w-full sm:flex-1">
                  <button onClick={exportarExcel} disabled={exportando}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    {exportando ? 'Gerando...' : 'Exportar Excel'}
                  </button>
                  <button onClick={() => setShowSenhaModal(true)}
                    className="p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 shrink-0" title="Limpar tudo">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              )}
            </div>
            )}
            {isLocal && vendas.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <button type="button" onClick={sincronizarBaixasNoApp} disabled={sincronizandoBaixas || qtdComSerieRg === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowPathIcon className={`h-4 w-4 ${sincronizandoBaixas ? 'animate-spin' : ''}`} />
                  {sincronizandoBaixas ? 'Lançando...' : `Lançar no cadastro (${qtdComSerieRg})`}
                </button>
                <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70 text-center mt-2 leading-tight">
                  Vincula vendas ao cadastro de animais (Série+RG). Linhas sem identificação não entram.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Filtro de origem */}
          {isLocal && vendas.length > 0 && (
            <div className="flex items-center gap-2">
              {(() => {
                const qtdExcel = vendas.filter(v => v.origem === 'excel').length
                const qtdBase = vendas.filter(v => v.origem === 'base').length
                return (
                  <>
                    <button onClick={() => setFiltroOrigem('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroOrigem === 'todos' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      Todos ({vendas.length})
                    </button>
                    {qtdExcel > 0 && (
                      <button onClick={() => setFiltroOrigem('excel')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroOrigem === 'excel' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        📊 Excel ({qtdExcel})
                      </button>
                    )}
                    {qtdBase > 0 && (
                      <button onClick={() => setFiltroOrigem('base')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroOrigem === 'base' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        🗄️ App ({qtdBase})
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Cards de resumo */}
          {vendas.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-1">
                  <CurrencyDollarIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Vendido</span>
                </div>
                <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white truncate">{fmt(resumoGeral.total)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TableCellsIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Animais</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{resumoGeral.totalAnimais}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.machos}M · {resumoGeral.femeas}F</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <UserGroupIcon className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clientes</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{resumoGeral.totalClientes}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.notas} notas</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Precisam Atenção</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400">{resumoGeral.criticos + resumoGeral.atencaoAlta}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.criticos} inativos · {resumoGeral.atencaoAlta} atenção</p>
              </motion.div>
            </div>
          )}

          {/* Tabs */}
          {vendas.length > 0 && (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {[
                { key: 'clientes', label: 'Clientes', icon: UserGroupIcon },
                { key: 'historico', label: 'Histórico', icon: TableCellsIcon },
                { key: 'graficos', label: 'Gráficos', icon: ChartBarIcon },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {vendas.length === 0 && !carregandoBase && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 px-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                {isLocal ? <ArrowUpTrayIcon className="h-10 w-10 text-amber-600" /> : <ChartBarIcon className="h-10 w-10 text-amber-600" />}
              </div>
              {isLocal ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importe sua planilha de vendas</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">Colunas esperadas:</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 rounded-xl p-3 inline-block">
                    SÉRIE · RG · Sexo · Comprador · Estado · Data Venda · DataNasc · Idade · Nº Nota Fiscal · Valor
                  </p>
                  <div className="mt-6">
                    <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 text-white font-semibold cursor-pointer hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/30">
                      <ArrowUpTrayIcon className="h-5 w-5" /> Selecionar Arquivo Excel
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum dado de vendas disponível</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Os dados são importados pelo sistema local.</p>
                </>
              )}
            </motion.div>
          )}

          {/* ─── Tab: Clientes ─────────────────────────────────────────── */}
          {vendas.length > 0 && tab === 'clientes' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou estado..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <select value={filtroAtencao} onChange={e => setFiltroAtencao(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                  <option value="todos">Todos</option>
                  <option value="normal">✅ Ativos</option>
                  <option value="media">🟡 Acompanhar</option>
                  <option value="alta">🟠 Atenção</option>
                  <option value="critica">🔴 Inativos</option>
                  <option value="baixa">⚪ Baixa prioridade</option>
                </select>
              </div>

              {/* Lista de clientes */}
              <div className="space-y-3">
                {clientesFiltrados.map((c, i) => (
                  <motion.div key={c.nome} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <button onClick={() => setClienteExpandido(clienteExpandido === c.nome ? null : c.nome)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        c.atencao === 'critica' ? 'bg-red-500' : c.atencao === 'alta' ? 'bg-orange-500' : c.atencao === 'media' ? 'bg-yellow-500' : c.atencao === 'baixa' ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        {c.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{c.nome}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{
                            background: c.atencaoCor === 'red' ? '#FEE2E2' : c.atencaoCor === 'orange' ? '#FFEDD5' : c.atencaoCor === 'yellow' ? '#FEF9C3' : c.atencaoCor === 'gray' ? '#F3F4F6' : '#DCFCE7',
                            color: c.atencaoCor === 'red' ? '#DC2626' : c.atencaoCor === 'orange' ? '#EA580C' : c.atencaoCor === 'yellow' ? '#CA8A04' : c.atencaoCor === 'gray' ? '#6B7280' : '#16A34A',
                          }}>{c.atencaoLabel}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {c.totalCompras} compras · {fmt(c.totalGasto)} · Última: {fmtDate(c.ultimaCompra)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-gray-900 dark:text-white">{fmt(c.totalGasto)}</p>
                        {clienteExpandido === c.nome ? <ChevronUpIcon className="h-4 w-4 text-gray-400 ml-auto" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-auto" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {clienteExpandido === c.nome && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Ticket Médio</span><span className="font-bold text-gray-900 dark:text-white">{fmt(c.ticketMedio)}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Dias s/ Comprar</span><span className="font-bold text-gray-900 dark:text-white">{c.diasSemComprar}d</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Machos / Fêmeas</span><span className="font-bold text-gray-900 dark:text-white">{c.machos}M / {c.femeas}F</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Estados</span><span className="font-bold text-gray-900 dark:text-white">{c.estados.join(', ') || '-'}</span></div>
                            </div>
                            {/* Recomendação IA */}
                            <div className={`p-3 rounded-xl text-sm ${
                              c.atencao === 'critica' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                              c.atencao === 'alta' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                              c.atencao === 'media' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                              c.atencao === 'baixa' ? 'bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400' :
                              'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            }`}>
                              <p className="font-semibold text-xs uppercase tracking-wider mb-1">💡 Recomendação</p>
                              {c.atencao === 'baixa' && <p>Cliente com baixo volume ({fmt(c.totalGasto)}) e sem compras há {Math.round(c.diasSemComprar / 365)} anos. Baixa prioridade de contato — manter no cadastro para referência.</p>}
                              {c.atencao === 'critica' && <p>Cliente inativo há {c.diasSemComprar} dias. Contato urgente recomendado. Já investiu {fmt(c.totalGasto)} em {c.totalCompras} compras. Alto potencial de reativação.</p>}
                              {c.atencao === 'alta' && <p>Sem compras há {c.diasSemComprar} dias. Enviar oferta personalizada. Perfil: {c.machos > c.femeas ? 'prefere machos' : c.femeas > c.machos ? 'prefere fêmeas' : 'compra ambos os sexos'}.</p>}
                              {c.atencao === 'media' && <p>Acompanhar de perto. Última compra há {c.diasSemComprar} dias. Ticket médio de {fmt(c.ticketMedio)}.</p>}
                              {c.atencao === 'normal' && <p>Cliente ativo e recorrente. {c.totalCompras > 3 ? 'Cliente fiel, considerar condições especiais.' : 'Manter bom relacionamento.'}</p>}
                            </div>
                            {/* Últimas compras */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Últimas compras</p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {c.vendas.slice(0, 10).map((v, j) => (
                                  <div key={j} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <span className="text-gray-600 dark:text-gray-300">{v.serie}-{v.rg} · {v.sexo} · NF {v.notaFiscal}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(v.dataVenda)} · {fmt(v.valor)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {clientesFiltrados.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhum cliente encontrado</p>
                )}
              </div>
            </div>
          )}

          {/* ─── Tab: Histórico ────────────────────────────────────────── */}
          {vendas.length > 0 && tab === 'historico' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por NF, RG ou comprador..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{historicoFiltrado.length} registros</p>
              </div>

              {/* View Mobile: Cards */}
              <div className="md:hidden space-y-3">
                {historicoFiltrado.slice(0, 200).map((v, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Comprador</p>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{v.comprador}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-700 dark:text-green-400">{fmt(v.valor)}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(v.dataVenda)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50 dark:border-gray-700/50">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">NF</p>
                        <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{v.notaFiscal || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Série-RG</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{v.serie}-{v.rg}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Sexo</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${/^m/i.test(v.sexo) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'}`}>
                          {v.sexo}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex gap-3">
                        <span className="text-gray-500 dark:text-gray-400"><span className="font-bold">UF:</span> {v.estado}</span>
                        <span className="text-gray-500 dark:text-gray-400"><span className="font-bold">Idade:</span> {v.idade}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${v.origem === 'excel' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                        {v.origem === 'excel' ? 'Excel' : 'App'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* View Desktop: Table */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        {['NF', 'Série', 'RG', 'Sexo', 'Comprador', 'UF', 'Data Venda', 'Idade', 'Valor', 'Origem'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {historicoFiltrado.slice(0, 200).map((v, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300">{v.notaFiscal}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300">{v.serie}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 font-medium">{v.rg}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${/^m/i.test(v.sexo) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'}`}>
                              {v.sexo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800 dark:text-gray-200">{v.comprador}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{v.estado}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{fmtDate(v.dataVenda)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{v.idade}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400">{fmt(v.valor)}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${v.origem === 'excel' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                              {v.origem === 'excel' ? 'Excel' : 'App'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historicoFiltrado.length > 200 && (
                  <p className="text-center text-xs text-gray-400 py-3">Mostrando 200 de {historicoFiltrado.length} registros. Exporte o Excel para ver todos.</p>
                )}
              </div>
            </div>
          )}

          {/* ─── Tab: Gráficos ─────────────────────────────────────────── */}
          {vendas.length > 0 && tab === 'graficos' && (
            <div className="space-y-6">
              {/* Evolução de Vendas por Mês - Line Chart */}
              {vendasPorMes.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-blue-500" /> Evolução de Vendas por Mês
                  </h3>
                  <div className="h-64">
                    <Line data={{
                      labels: vendasPorMes.map(m => { const [y, mo] = m.mes.split('-'); return `${mo}/${y.slice(2)}` }),
                      datasets: [
                        { label: 'Valor (R$)', data: vendasPorMes.map(m => m.total), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#3B82F6' },
                        { label: 'Qtd Animais', data: vendasPorMes.map(m => m.qtd), borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', fill: false, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#F59E0B', yAxisID: 'y1' },
                      ]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } } },
                      scales: {
                        y: { beginAtZero: true, ticks: { callback: v => `R$${(v/1000).toFixed(0)}k` } },
                        y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { stepSize: 1 } },
                      }
                    }} />
                  </div>
                </div>
              )}

              {/* Top Clientes - Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-amber-500" /> Top 10 Clientes por Valor
                </h3>
                <div className="h-72">
                  <Bar data={{
                    labels: topClientes.map(c => c.nome.length > 18 ? c.nome.slice(0, 16) + '...' : c.nome),
                    datasets: [{
                      label: 'Valor Total (R$)',
                      data: topClientes.map(c => c.totalGasto),
                      backgroundColor: CHART_COLORS_ALPHA.slice(0, topClientes.length),
                      borderColor: CHART_COLORS.slice(0, topClientes.length),
                      borderWidth: 1, borderRadius: 6,
                    }]
                  }} options={{
                    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, ticks: { callback: v => `R$${(v/1000).toFixed(0)}k` } } },
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distribuição por Sexo - Doughnut */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Vendas por Sexo</h3>
                  <div className="h-56 flex items-center justify-center">
                    <Doughnut data={{
                      labels: ['Machos', 'Fêmeas', ...(vendasPorSexo.outros.qtd > 0 ? ['Outros'] : [])],
                      datasets: [{
                        data: [vendasPorSexo.machos.qtd, vendasPorSexo.femeas.qtd, ...(vendasPorSexo.outros.qtd > 0 ? [vendasPorSexo.outros.qtd] : [])],
                        backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(236,72,153,0.8)', 'rgba(156,163,175,0.8)'],
                        borderWidth: 2, borderColor: '#fff',
                      }]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12 } } },
                      cutout: '55%',
                    }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{vendasPorSexo.machos.qtd} machos</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{fmt(vendasPorSexo.machos.total)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold">{vendasPorSexo.femeas.qtd} fêmeas</p>
                      <p className="text-sm font-bold text-pink-800 dark:text-pink-200">{fmt(vendasPorSexo.femeas.total)}</p>
                    </div>
                  </div>
                </div>

                {/* Vendas por Estado - Pie */}
                {vendasPorEstado.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Vendas por Estado</h3>
                    <div className="h-56 flex items-center justify-center">
                      <Pie data={{
                        labels: vendasPorEstado.slice(0, 8).map(e => e.estado),
                        datasets: [{
                          data: vendasPorEstado.slice(0, 8).map(e => e.total),
                          backgroundColor: CHART_COLORS_ALPHA,
                          borderColor: CHART_COLORS,
                          borderWidth: 1,
                        }]
                      }} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } } },
                      }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faixa de Valor - Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Distribuição por Faixa de Valor</h3>
                  <div className="h-56">
                    <Bar data={{
                      labels: vendasPorFaixa.map(f => f.faixa),
                      datasets: [{
                        label: 'Qtd Animais',
                        data: vendasPorFaixa.map(f => f.qtd),
                        backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'],
                        borderRadius: 6,
                      }]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                    }} />
                  </div>
                </div>

                {/* Frequência de Compra - Doughnut */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Frequência de Compra dos Clientes</h3>
                  <div className="h-56 flex items-center justify-center">
                    <Doughnut data={{
                      labels: frequenciaClientes.map(f => f.faixa),
                      datasets: [{
                        data: frequenciaClientes.map(f => f.qtd),
                        backgroundColor: CHART_COLORS_ALPHA.slice(0, 5),
                        borderColor: CHART_COLORS.slice(0, 5),
                        borderWidth: 1,
                      }]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } } },
                      cutout: '50%',
                    }} />
                  </div>
                </div>
              </div>

              {/* Status dos Clientes - Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" /> Status dos Clientes
                </h3>
                <div className="h-48">
                  <Bar data={{
                    labels: ['Ativos', 'Acompanhar', 'Atenção', 'Inativos', 'Baixa prior.'],
                    datasets: [{
                      label: 'Clientes',
                      data: [
                        clientes.filter(c => c.atencao === 'normal').length,
                        clientes.filter(c => c.atencao === 'media').length,
                        clientes.filter(c => c.atencao === 'alta').length,
                        clientes.filter(c => c.atencao === 'critica').length,
                        clientes.filter(c => c.atencao === 'baixa').length,
                      ],
                      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(234,179,8,0.8)', 'rgba(249,115,22,0.8)', 'rgba(239,68,68,0.8)', 'rgba(156,163,175,0.8)'],
                      borderRadius: 8,
                    }]
                  }} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de senha para limpar tudo */}
      {showSenhaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🔒 Limpar todos os dados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Digite a senha de desenvolvedor para confirmar a exclusão de todos os registros.</p>
            <input type="password" value={senhaInput} onChange={e => setSenhaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLimparTudo()}
              placeholder="Senha de desenvolvedor"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { setShowSenhaModal(false); setSenhaInput('') }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>
              <button onClick={handleLimparTudo}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                Apagar Tudo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

RelatorioVendas.getLayout = (page) => page
