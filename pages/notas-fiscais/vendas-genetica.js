/**
 * Relatório de Vendas de Embriões e Sêmen - Beef-Sync
 * Importação de Excel, análise por cliente, gráficos e exportação detalhada
 */
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'

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
const parseValor = (v) => {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const s = String(v).replace(/[R$\s]/g, '')
  if (/\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  return parseFloat(s.replace(',', '.')) || 0
}

// ─── Mapeamento de colunas do Excel ─────────────────────────────────────────
const COL_MAP = {
  ano: ['ano', 'ANO', 'Ano', 'year'],
  notaFiscal: ['nota fiscal', 'NOTA FISCAL', 'Nota Fiscal', 'nf', 'NF', 'numero_nf'],
  cliente: ['cliente', 'Cliente', 'CLIENTE', 'comprador', 'Comprador', 'destino'],
  uf: ['uf', 'UF', 'estado', 'Estado', 'ESTADO'],
  produto: ['produto', 'Produto', 'PRODUTO', 'descricao', 'Descrição'],
  valorUnitario: ['valor unitário', 'valor unitario', 'VALOR UNITÁRIO', 'Valor Unitário', 'valor_unitario', 'preco', 'preço'],
  quantidade: ['quantidade', 'Quantidade', 'QUANTIDADE', 'qtd', 'Qtd', 'QTD'],
  vlTotal: ['vl total', 'VL TOTAL', 'Vl Total', 'valor total', 'Valor Total', 'VALOR TOTAL', 'valor_total', 'total'],
}

function mapRow(raw, headers) {
  const find = (aliases) => {
    for (const a of aliases) {
      const idx = headers.findIndex(h => h.trim().toLowerCase() === a.toLowerCase())
      if (idx >= 0) return raw[idx] ?? raw[headers[idx]]
    }
    for (const a of aliases) { if (raw[a] !== undefined) return raw[a] }
    return null
  }
  const produto = String(find(COL_MAP.produto) || '').trim()
  const tipo = /embri/i.test(produto) ? 'embriao' : /semen|sêmen/i.test(produto) ? 'semen' : 'outro'
  return {
    ano: String(find(COL_MAP.ano) || '').trim(),
    notaFiscal: String(find(COL_MAP.notaFiscal) || '').trim(),
    cliente: String(find(COL_MAP.cliente) || '').trim(),
    uf: String(find(COL_MAP.uf) || '').trim(),
    produto,
    tipo,
    valorUnitario: parseValor(find(COL_MAP.valorUnitario)),
    quantidade: parseValor(find(COL_MAP.quantidade)),
    vlTotal: parseValor(find(COL_MAP.vlTotal)),
  }
}

// ─── Análise de clientes ────────────────────────────────────────────────────
function analisarClientes(vendas) {
  const hoje = new Date()
  const porCliente = {}
  vendas.forEach(v => {
    const nome = v.cliente || 'Não informado'
    if (!porCliente[nome]) porCliente[nome] = { nome, vendas: [], estados: new Set() }
    porCliente[nome].vendas.push(v)
    if (v.uf) porCliente[nome].estados.add(v.uf)
  })

  return Object.values(porCliente).map(c => {
    const totalGasto = c.vendas.reduce((s, v) => s + v.vlTotal, 0)
    const totalQtd = c.vendas.reduce((s, v) => s + v.quantidade, 0)
    const ticketMedio = totalGasto / c.vendas.length
    const embrioes = c.vendas.filter(v => v.tipo === 'embriao')
    const semen = c.vendas.filter(v => v.tipo === 'semen')
    const qtdEmbrioes = embrioes.reduce((s, v) => s + v.quantidade, 0)
    const qtdSemen = semen.reduce((s, v) => s + v.quantidade, 0)
    const totalEmbrioes = embrioes.reduce((s, v) => s + v.vlTotal, 0)
    const totalSemen = semen.reduce((s, v) => s + v.vlTotal, 0)
    const notas = [...new Set(c.vendas.map(v => v.notaFiscal).filter(Boolean))]
    const anos = [...new Set(c.vendas.map(v => v.ano).filter(Boolean))].sort()
    const ultimoAno = anos.length > 0 ? parseInt(anos[anos.length - 1]) : null
    const diasSemComprar = ultimoAno ? diasEntre(new Date(ultimoAno, 11, 31), hoje) : 9999

    // Classificação de atenção
    const baixoValorAntigo = totalGasto <= 3000 && diasSemComprar > 1825
    let atencao = 'normal', atencaoLabel = '✅ Ativo', atencaoCor = 'green'
    if (baixoValorAntigo) {
      atencao = 'baixa'; atencaoLabel = '⚪ Baixa prioridade'; atencaoCor = 'gray'
    } else if (diasSemComprar > 365) {
      atencao = 'critica'; atencaoLabel = '🔴 Inativo (+1 ano)'; atencaoCor = 'red'
    } else if (diasSemComprar > 180) {
      atencao = 'alta'; atencaoLabel = '🟠 Atenção (+6 meses)'; atencaoCor = 'orange'
    } else if (diasSemComprar > 90) {
      atencao = 'media'; atencaoLabel = '🟡 Acompanhar (+3 meses)'; atencaoCor = 'yellow'
    }

    const preferencia = qtdSemen > qtdEmbrioes ? 'Sêmen' : qtdEmbrioes > qtdSemen ? 'Embriões' : 'Ambos'
    const score = Math.min(100, Math.round((c.vendas.length * 15) + (totalGasto / 1000) + (diasSemComprar < 90 ? 20 : 0)))

    return {
      nome: c.nome, totalCompras: c.vendas.length, totalGasto, totalQtd, ticketMedio,
      qtdEmbrioes, qtdSemen, totalEmbrioes, totalSemen, preferencia,
      estados: [...c.estados], notas, anos, ultimoAno, diasSemComprar,
      atencao, atencaoLabel, atencaoCor, score, vendas: c.vendas,
    }
  }).sort((a, b) => b.totalGasto - a.totalGasto)
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function VendasGenetica() {
  const router = useRouter()
  const [vendas, setVendas] = useState([])
  const [importando, setImportando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [tab, setTab] = useState('clientes')
  const [search, setSearch] = useState('')
  const [filtroAtencao, setFiltroAtencao] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos') // todos | semen | embriao
  const [clienteExpandido, setClienteExpandido] = useState(null)
  const [toast, setToast] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const [showSenhaModal, setShowSenhaModal] = useState(false)
  const [senhaInput, setSenhaInput] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDark(document.documentElement.classList.contains('dark'))
    try {
      const saved = localStorage.getItem('beef-vendas-genetica')
      if (saved) setVendas(JSON.parse(saved))
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const salvarVendas = useCallback((novas) => {
    setVendas(novas)
    try { localStorage.setItem('beef-vendas-genetica', JSON.stringify(novas)) } catch (_) {}
  }, [])

  const handleLimparTudo = useCallback(() => {
    if (senhaInput !== 'dev2026') {
      setToast({ type: 'error', msg: 'Senha incorreta' }); return
    }
    salvarVendas([])
    setShowSenhaModal(false); setSenhaInput('')
    setToast({ type: 'success', msg: 'Todos os dados foram apagados' })
  }, [senhaInput, salvarVendas])

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
      if (rows.length < 2) { setToast({ type: 'error', msg: 'Planilha vazia' }); return }

      const headers = rows[0].map(h => String(h).trim())
      const mapped = rows.slice(1)
        .filter(r => r.some(c => c !== '' && c != null))
        .map(r => mapRow(r, headers))
        .filter(r => r.cliente || r.notaFiscal || r.vlTotal > 0)

      if (mapped.length === 0) { setToast({ type: 'error', msg: 'Nenhum dado válido' }); return }

      // Mesclar com existentes (evitar duplicatas por NF+produto)
      const existentes = new Set(vendas.map(v => `${v.notaFiscal}|${v.produto}|${v.cliente}`))
      const novos = mapped.filter(v => !existentes.has(`${v.notaFiscal}|${v.produto}|${v.cliente}`))
      salvarVendas([...vendas, ...novos])
      setToast({ type: 'success', msg: `${novos.length} registro(s) importado(s) (${mapped.length - novos.length} duplicados ignorados)` })
    } catch (err) {
      console.error('Erro ao importar:', err)
      setToast({ type: 'error', msg: err.message || 'Erro ao importar' })
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }, [vendas, salvarVendas])

  // ─── Análise ────────────────────────────────────────────────────────────
  const vendasFiltradas = useMemo(() => {
    if (filtroTipo === 'todos') return vendas
    return vendas.filter(v => v.tipo === filtroTipo)
  }, [vendas, filtroTipo])

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
        (v.cliente && v.cliente.toLowerCase().includes(q)) ||
        (v.produto && v.produto.toLowerCase().includes(q)) ||
        (v.uf && v.uf.toLowerCase().includes(q))
      )
    }
    return list
  }, [vendasFiltradas, search, tab])

  const resumoGeral = useMemo(() => {
    const total = vendasFiltradas.reduce((s, v) => s + v.vlTotal, 0)
    const totalQtd = vendasFiltradas.reduce((s, v) => s + v.quantidade, 0)
    const notas = [...new Set(vendasFiltradas.map(v => v.notaFiscal).filter(Boolean))].length
    const semen = vendasFiltradas.filter(v => v.tipo === 'semen')
    const embrioes = vendasFiltradas.filter(v => v.tipo === 'embriao')
    const criticos = clientes.filter(c => c.atencao === 'critica').length
    const atencaoAlta = clientes.filter(c => c.atencao === 'alta').length
    return {
      total, totalQtd, notas, totalClientes: clientes.length,
      qtdSemen: semen.reduce((s, v) => s + v.quantidade, 0),
      totalSemen: semen.reduce((s, v) => s + v.vlTotal, 0),
      qtdEmbrioes: embrioes.reduce((s, v) => s + v.quantidade, 0),
      totalEmbrioes: embrioes.reduce((s, v) => s + v.vlTotal, 0),
      criticos, atencaoAlta,
    }
  }, [vendasFiltradas, clientes])

  const topClientes = useMemo(() => clientes.slice(0, 10), [clientes])

  const vendasPorAno = useMemo(() => {
    const anos = {}
    vendasFiltradas.forEach(v => {
      const a = v.ano || 'N/I'
      if (!anos[a]) anos[a] = { ano: a, total: 0, qtd: 0, semen: 0, embrioes: 0 }
      anos[a].total += v.vlTotal; anos[a].qtd += v.quantidade
      if (v.tipo === 'semen') anos[a].semen += v.vlTotal
      else if (v.tipo === 'embriao') anos[a].embrioes += v.vlTotal
    })
    return Object.values(anos).sort((a, b) => a.ano.localeCompare(b.ano))
  }, [vendasFiltradas])

  const vendasPorEstado = useMemo(() => {
    const estados = {}
    vendasFiltradas.forEach(v => {
      const e = v.uf || 'N/I'
      if (!estados[e]) estados[e] = { estado: e, total: 0, qtd: 0 }
      estados[e].total += v.vlTotal; estados[e].qtd += v.quantidade
    })
    return Object.values(estados).sort((a, b) => b.total - a.total)
  }, [vendasFiltradas])

  const vendasPorTipo = useMemo(() => {
    const semen = vendasFiltradas.filter(v => v.tipo === 'semen')
    const embrioes = vendasFiltradas.filter(v => v.tipo === 'embriao')
    const outros = vendasFiltradas.filter(v => v.tipo === 'outro')
    return {
      semen: { qtd: semen.reduce((s, v) => s + v.quantidade, 0), total: semen.reduce((s, v) => s + v.vlTotal, 0) },
      embrioes: { qtd: embrioes.reduce((s, v) => s + v.quantidade, 0), total: embrioes.reduce((s, v) => s + v.vlTotal, 0) },
      outros: { qtd: outros.reduce((s, v) => s + v.quantidade, 0), total: outros.reduce((s, v) => s + v.vlTotal, 0) },
    }
  }, [vendasFiltradas])

  // Top produtos mais vendidos
  const topProdutos = useMemo(() => {
    const prods = {}
    vendasFiltradas.forEach(v => {
      const p = v.produto || 'N/I'
      if (!prods[p]) prods[p] = { produto: p, total: 0, qtd: 0, tipo: v.tipo }
      prods[p].total += v.vlTotal; prods[p].qtd += v.quantidade
    })
    return Object.values(prods).sort((a, b) => b.total - a.total).slice(0, 15)
  }, [vendasFiltradas])

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

  const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
  const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '99')

  // ─── Exportar Excel completo ────────────────────────────────────────────
  const exportarExcel = useCallback(async () => {
    if (vendasFiltradas.length === 0) return
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Beef-Sync'; wb.created = new Date()
      const headerStyle = (color) => ({
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color } },
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thin', color: { argb: 'FF000000' } } },
      })
      const applyHeader = (sheet, color) => {
        const row = sheet.getRow(1); row.height = 28
        row.eachCell(cell => Object.assign(cell, headerStyle(color)))
      }

      // Aba 1: Resumo Executivo
      const ws1 = wb.addWorksheet('📊 Resumo Executivo')
      ws1.columns = [{ key: 'ind', width: 35 }, { key: 'val', width: 25 }]
      ws1.addRow({ ind: 'Indicador', val: 'Valor' }); applyHeader(ws1, 'FFE67E22')
      const totalVendido = resumoGeral.total || 1
      ;[
        ['Total de Vendas', fmt(resumoGeral.total)],
        ['Total de Unidades Vendidas', resumoGeral.totalQtd],
        ['Total de Clientes', resumoGeral.totalClientes],
        ['Total de Notas Fiscais', resumoGeral.notas],
        ['Sêmen - Unidades', resumoGeral.qtdSemen],
        ['Sêmen - Valor Total', fmt(resumoGeral.totalSemen)],
        ['Embriões - Unidades', resumoGeral.qtdEmbrioes],
        ['Embriões - Valor Total', fmt(resumoGeral.totalEmbrioes)],
        ['% Sêmen (valor)', `${((resumoGeral.totalSemen / totalVendido) * 100).toFixed(1)}%`],
        ['% Embriões (valor)', `${((resumoGeral.totalEmbrioes / totalVendido) * 100).toFixed(1)}%`],
        ['Ticket Médio por Venda', fmt(resumoGeral.total / (vendasFiltradas.length || 1))],
        ['Ticket Médio por Cliente', fmt(resumoGeral.total / (resumoGeral.totalClientes || 1))],
        ['Clientes Inativos (+1 ano)', resumoGeral.criticos],
        ['Clientes que Precisam Atenção', resumoGeral.atencaoAlta],
        ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
      ].forEach(([ind, val]) => ws1.addRow({ ind, val }))

      // Aba 2: Análise por Cliente
      const ws2 = wb.addWorksheet('👥 Análise por Cliente')
      ws2.columns = [
        { key: 'nome', width: 35 }, { key: 'compras', width: 12 }, { key: 'total', width: 18 },
        { key: 'ticket', width: 18 }, { key: 'qtdSemen', width: 14 }, { key: 'totalSemen', width: 18 },
        { key: 'qtdEmbrioes', width: 14 }, { key: 'totalEmbrioes', width: 18 },
        { key: 'preferencia', width: 14 }, { key: 'estados', width: 12 },
        { key: 'anos', width: 20 }, { key: 'status', width: 22 }, { key: 'recomendacao', width: 50 },
      ]
      ws2.addRow({ nome: 'Cliente', compras: 'Compras', total: 'Valor Total', ticket: 'Ticket Médio',
        qtdSemen: 'Qtd Sêmen', totalSemen: 'Valor Sêmen', qtdEmbrioes: 'Qtd Embriões', totalEmbrioes: 'Valor Embriões',
        preferencia: 'Preferência', estados: 'UF', anos: 'Anos', status: 'Status', recomendacao: 'Recomendação IA' })
      applyHeader(ws2, 'FF3B82F6')
      clientes.forEach(c => {
        let rec = ''
        if (c.atencao === 'baixa') rec = `Baixa prioridade. Total: ${fmt(c.totalGasto)}. Manter cadastro.`
        else if (c.atencao === 'critica') rec = `URGENTE: Inativo desde ${c.ultimoAno}. Já comprou ${c.totalCompras}x totalizando ${fmt(c.totalGasto)}. Prefere ${c.preferencia}. Contato imediato.`
        else if (c.atencao === 'alta') rec = `Sem compras recentes. Enviar oferta de ${c.preferencia}. Ticket médio: ${fmt(c.ticketMedio)}.`
        else if (c.atencao === 'media') rec = `Acompanhar. Última compra em ${c.ultimoAno}. Prefere ${c.preferencia}.`
        else rec = `Cliente ativo. ${c.totalCompras > 3 ? 'Fiel, considerar condições especiais.' : 'Manter relacionamento.'} Prefere ${c.preferencia}.`
        ws2.addRow({ nome: c.nome, compras: c.totalCompras, total: c.totalGasto, ticket: c.ticketMedio,
          qtdSemen: c.qtdSemen, totalSemen: c.totalSemen, qtdEmbrioes: c.qtdEmbrioes, totalEmbrioes: c.totalEmbrioes,
          preferencia: c.preferencia, estados: c.estados.join(', '), anos: c.anos.join(', '),
          status: c.atencaoLabel, recomendacao: rec })
      })
      ws2.getColumn('total').numFmt = 'R$ #,##0.00'
      ws2.getColumn('ticket').numFmt = 'R$ #,##0.00'
      ws2.getColumn('totalSemen').numFmt = 'R$ #,##0.00'
      ws2.getColumn('totalEmbrioes').numFmt = 'R$ #,##0.00'

      // Aba 3: Histórico Completo
      const ws3 = wb.addWorksheet('📋 Histórico de Vendas')
      ws3.columns = [
        { key: 'ano', width: 8 }, { key: 'nf', width: 16 }, { key: 'cliente', width: 35 },
        { key: 'uf', width: 6 }, { key: 'produto', width: 50 }, { key: 'tipo', width: 12 },
        { key: 'valorUnit', width: 16 }, { key: 'qtd', width: 10 }, { key: 'total', width: 18 },
      ]
      ws3.addRow({ ano: 'Ano', nf: 'Nota Fiscal', cliente: 'Cliente', uf: 'UF', produto: 'Produto',
        tipo: 'Tipo', valorUnit: 'Valor Unit.', qtd: 'Qtd', total: 'Valor Total' })
      applyHeader(ws3, 'FF10B981')
      vendasFiltradas.forEach(v => ws3.addRow({ ano: v.ano, nf: v.notaFiscal, cliente: v.cliente, uf: v.uf,
        produto: v.produto, tipo: v.tipo === 'semen' ? 'Sêmen' : v.tipo === 'embriao' ? 'Embrião' : 'Outro',
        valorUnit: v.valorUnitario, qtd: v.quantidade, total: v.vlTotal }))
      ws3.getColumn('valorUnit').numFmt = 'R$ #,##0.00'
      ws3.getColumn('total').numFmt = 'R$ #,##0.00'

      // Aba 4: Vendas por Ano
      const ws4 = wb.addWorksheet('📅 Vendas por Ano')
      ws4.columns = [{ key: 'ano', width: 10 }, { key: 'qtd', width: 12 }, { key: 'total', width: 18 },
        { key: 'semen', width: 18 }, { key: 'embrioes', width: 18 }]
      ws4.addRow({ ano: 'Ano', qtd: 'Qtd', total: 'Total', semen: 'Sêmen', embrioes: 'Embriões' })
      applyHeader(ws4, 'FF8B5CF6')
      vendasPorAno.forEach(a => ws4.addRow({ ano: a.ano, qtd: a.qtd, total: a.total, semen: a.semen, embrioes: a.embrioes }))
      ws4.getColumn('total').numFmt = 'R$ #,##0.00'
      ws4.getColumn('semen').numFmt = 'R$ #,##0.00'
      ws4.getColumn('embrioes').numFmt = 'R$ #,##0.00'

      // Aba 5: Vendas por Estado
      const ws5 = wb.addWorksheet('🗺️ Vendas por Estado')
      ws5.columns = [{ key: 'estado', width: 10 }, { key: 'qtd', width: 12 }, { key: 'total', width: 18 }]
      ws5.addRow({ estado: 'UF', qtd: 'Qtd', total: 'Total' }); applyHeader(ws5, 'FF059669')
      vendasPorEstado.forEach(e => ws5.addRow({ estado: e.estado, qtd: e.qtd, total: e.total }))
      ws5.getColumn('total').numFmt = 'R$ #,##0.00'

      // Aba 6: Clientes que Precisam Atenção
      const ws6 = wb.addWorksheet('⚠️ Atenção Especial')
      ws6.columns = [
        { key: 'nome', width: 35 }, { key: 'status', width: 22 }, { key: 'ultimoAno', width: 12 },
        { key: 'total', width: 18 }, { key: 'compras', width: 10 }, { key: 'preferencia', width: 14 }, { key: 'acao', width: 55 },
      ]
      ws6.addRow({ nome: 'Cliente', status: 'Status', ultimoAno: 'Último Ano', total: 'Valor Total', compras: 'Compras', preferencia: 'Preferência', acao: 'Ação Sugerida' })
      applyHeader(ws6, 'FFDC2626')
      clientes.filter(c => c.atencao !== 'normal').forEach(c => {
        let acao = ''
        if (c.atencao === 'baixa') acao = 'Baixa prioridade — manter cadastro'
        else if (c.atencao === 'critica') acao = `URGENTE: Ligar, oferecer ${c.preferencia} com condições especiais`
        else if (c.atencao === 'alta') acao = `Enviar WhatsApp com ofertas de ${c.preferencia}`
        else acao = 'Manter contato, enviar novidades'
        ws6.addRow({ nome: c.nome, status: c.atencaoLabel, ultimoAno: c.ultimoAno || '-', total: c.totalGasto, compras: c.totalCompras, preferencia: c.preferencia, acao })
      })
      ws6.getColumn('total').numFmt = 'R$ #,##0.00'

      // Aba 7: Top Produtos
      const ws7 = wb.addWorksheet('🧬 Top Produtos')
      ws7.columns = [{ key: 'pos', width: 6 }, { key: 'produto', width: 55 }, { key: 'tipo', width: 12 },
        { key: 'qtd', width: 10 }, { key: 'total', width: 18 }]
      ws7.addRow({ pos: '#', produto: 'Produto', tipo: 'Tipo', qtd: 'Qtd', total: 'Total' })
      applyHeader(ws7, 'FF7C3AED')
      topProdutos.forEach((p, i) => ws7.addRow({ pos: i + 1, produto: p.produto,
        tipo: p.tipo === 'semen' ? 'Sêmen' : p.tipo === 'embriao' ? 'Embrião' : 'Outro', qtd: p.qtd, total: p.total }))
      ws7.getColumn('total').numFmt = 'R$ #,##0.00'

      // Aba 8: Ranking de Clientes
      const ws8 = wb.addWorksheet('🏆 Ranking Clientes')
      ws8.columns = [
        { key: 'pos', width: 6 }, { key: 'nome', width: 35 }, { key: 'total', width: 18 },
        { key: 'compras', width: 10 }, { key: 'ticket', width: 18 }, { key: 'preferencia', width: 14 },
        { key: 'fidelidade', width: 18 }, { key: 'classificacao', width: 16 },
      ]
      ws8.addRow({ pos: '#', nome: 'Cliente', total: 'Valor Total', compras: 'Compras', ticket: 'Ticket Médio', preferencia: 'Preferência', fidelidade: 'Fidelidade', classificacao: 'Classificação' })
      applyHeader(ws8, 'FFD97706')
      clientes.forEach((c, i) => {
        const fid = c.totalCompras >= 10 ? '⭐ VIP' : c.totalCompras >= 5 ? '🥇 Fiel' : c.totalCompras >= 3 ? '🥈 Recorrente' : c.totalCompras >= 2 ? '🥉 Retornou' : '🆕 Novo'
        const classif = c.totalGasto >= 100000 ? 'Platinum' : c.totalGasto >= 50000 ? 'Gold' : c.totalGasto >= 20000 ? 'Silver' : 'Bronze'
        ws8.addRow({ pos: i + 1, nome: c.nome, total: c.totalGasto, compras: c.totalCompras, ticket: c.ticketMedio, preferencia: c.preferencia, fidelidade: fid, classificacao: classif })
      })
      ws8.getColumn('total').numFmt = 'R$ #,##0.00'
      ws8.getColumn('ticket').numFmt = 'R$ #,##0.00'

      // Download
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `Vendas_Embrioes_Semen_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click(); URL.revokeObjectURL(url)
      setToast({ type: 'success', msg: 'Excel exportado com 8 abas detalhadas' })
    } catch (err) {
      console.error('Erro ao exportar:', err)
      setToast({ type: 'error', msg: 'Erro ao gerar Excel' })
    } finally { setExportando(false) }
  }, [vendasFiltradas, clientes, resumoGeral, vendasPorAno, vendasPorEstado, topProdutos])

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Vendas Embriões e Sêmen | Beef-Sync</title></Head>
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
        <div className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-3">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    🧬 Vendas de Embriões e Sêmen
                  </h1>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    {vendasFiltradas.length} registros · {clientes.length} clientes
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${importando ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20'}`}>
                <ArrowUpTrayIcon className="h-4 w-4" />
                {importando ? 'Importando...' : 'Importar Excel'}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" disabled={importando} />
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
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6">
          {/* Filtro de tipo */}
          {vendas.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'todos', label: `Todos (${vendas.length})`, color: 'violet' },
                { key: 'semen', label: `🧪 Sêmen (${vendas.filter(v => v.tipo === 'semen').length})`, color: 'blue' },
                { key: 'embriao', label: `🧬 Embriões (${vendas.filter(v => v.tipo === 'embriao').length})`, color: 'pink' },
              ].map(f => (
                <button key={f.key} onClick={() => setFiltroTipo(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroTipo === f.key
                    ? f.color === 'violet' ? 'bg-violet-500 text-white' : f.color === 'blue' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Cards de resumo */}
          {vendas.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-1">
                  <CurrencyDollarIcon className="h-4 w-4 text-violet-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Vendido</span>
                </div>
                <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white truncate">{fmt(resumoGeral.total)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🧪</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Sêmen</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{fmt(resumoGeral.totalSemen)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.qtdSemen.toLocaleString('pt-BR')} doses</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-pink-100 dark:border-pink-900/50 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">🧬</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400">Embriões</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{fmt(resumoGeral.totalEmbrioes)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.qtdEmbrioes.toLocaleString('pt-BR')} unid.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">Precisam Atenção</span>
                </div>
                <p className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400">{resumoGeral.criticos + resumoGeral.atencaoAlta}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{resumoGeral.totalClientes} clientes</p>
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
                  <t.icon className="h-4 w-4" /> <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {vendas.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <span className="text-4xl">🧬</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importe sua planilha de vendas genéticas</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">Colunas esperadas:</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 rounded-xl p-3 inline-block">
                ANO · NOTA FISCAL · CLIENTE · UF · PRODUTO · VALOR UNITÁRIO · QUANTIDADE · VL TOTAL
              </p>
              <div className="mt-6">
                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-semibold cursor-pointer hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/30">
                  <ArrowUpTrayIcon className="h-5 w-5" /> Selecionar Arquivo Excel
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </motion.div>
          )}

          {/* ─── Tab: Clientes ─────────────────────────────────────────── */}
          {vendas.length > 0 && tab === 'clientes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou estado..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
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

              <div className="space-y-3">
                {clientesFiltrados.map((c, i) => (
                  <motion.div key={c.nome} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <button onClick={() => setClienteExpandido(clienteExpandido === c.nome ? null : c.nome)}
                      className="w-full p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        c.atencao === 'critica' ? 'bg-red-500' : c.atencao === 'alta' ? 'bg-orange-500' : c.atencao === 'media' ? 'bg-yellow-500' : c.atencao === 'baixa' ? 'bg-gray-400' : 'bg-green-500'
                      }`}>
                        {c.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{c.nome}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{
                            background: c.atencaoCor === 'red' ? '#FEE2E2' : c.atencaoCor === 'orange' ? '#FFEDD5' : c.atencaoCor === 'yellow' ? '#FEF9C3' : c.atencaoCor === 'gray' ? '#F3F4F6' : '#DCFCE7',
                            color: c.atencaoCor === 'red' ? '#DC2626' : c.atencaoCor === 'orange' ? '#EA580C' : c.atencaoCor === 'yellow' ? '#CA8A04' : c.atencaoCor === 'gray' ? '#6B7280' : '#16A34A',
                          }}>{c.atencaoLabel}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {c.totalCompras} compras · {fmt(c.totalGasto)} · Prefere: {c.preferencia}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-lg font-black text-gray-900 dark:text-white">{fmt(c.totalGasto)}</p>
                        {clienteExpandido === c.nome ? <ChevronUpIcon className="h-4 w-4 text-gray-400 ml-auto" /> : <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-auto" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {clienteExpandido === c.nome && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="p-3 sm:p-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Ticket Médio</span><span className="font-bold text-gray-900 dark:text-white">{fmt(c.ticketMedio)}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Último Ano</span><span className="font-bold text-gray-900 dark:text-white">{c.ultimoAno || '-'}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Sêmen</span><span className="font-bold text-blue-600 dark:text-blue-400">{c.qtdSemen} un · {fmt(c.totalSemen)}</span></div>
                              <div><span className="text-gray-500 dark:text-gray-400 text-xs block">Embriões</span><span className="font-bold text-pink-600 dark:text-pink-400">{c.qtdEmbrioes} un · {fmt(c.totalEmbrioes)}</span></div>
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
                              {c.atencao === 'baixa' && <p>Cliente com baixo volume ({fmt(c.totalGasto)}). Baixa prioridade de contato.</p>}
                              {c.atencao === 'critica' && <p>Inativo desde {c.ultimoAno}. Já investiu {fmt(c.totalGasto)} em {c.totalCompras} compras. Prefere {c.preferencia}. Contato urgente.</p>}
                              {c.atencao === 'alta' && <p>Sem compras recentes. Enviar oferta de {c.preferencia}. Ticket médio: {fmt(c.ticketMedio)}.</p>}
                              {c.atencao === 'media' && <p>Acompanhar. Última compra em {c.ultimoAno}. Prefere {c.preferencia}.</p>}
                              {c.atencao === 'normal' && <p>Cliente ativo. {c.totalCompras > 3 ? 'Fiel, considerar condições especiais.' : 'Manter relacionamento.'} Prefere {c.preferencia}.</p>}
                            </div>
                            {/* Últimas compras */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Compras</p>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {c.vendas.map((v, j) => (
                                  <div key={j} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 gap-2">
                                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{v.produto}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white shrink-0">{v.quantidade}x · {fmt(v.vlTotal)}</span>
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
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por NF, cliente ou produto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{historicoFiltrado.length} registros</p>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {historicoFiltrado.slice(0, 200).map((v, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{v.cliente}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">NF {v.notaFiscal} · {v.ano} · {v.uf}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-green-700 dark:text-green-400">{fmt(v.vlTotal)}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${v.tipo === 'semen' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : v.tipo === 'embriao' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                          {v.tipo === 'semen' ? 'Sêmen' : v.tipo === 'embriao' ? 'Embrião' : 'Outro'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight truncate">{v.produto}</p>
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span>Unit: {fmt(v.valorUnitario)}</span>
                      <span>Qtd: {v.quantidade.toLocaleString('pt-BR')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        {['Ano', 'NF', 'Cliente', 'UF', 'Produto', 'Tipo', 'V.Unit', 'Qtd', 'Total'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {historicoFiltrado.slice(0, 200).map((v, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300">{v.ano}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300">{v.notaFiscal}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{v.cliente}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{v.uf}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-[250px] truncate">{v.produto}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${v.tipo === 'semen' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : v.tipo === 'embriao' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                              {v.tipo === 'semen' ? 'Sêmen' : v.tipo === 'embriao' ? 'Embrião' : 'Outro'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{fmt(v.valorUnitario)}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{v.quantidade.toLocaleString('pt-BR')}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400">{fmt(v.vlTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historicoFiltrado.length > 200 && (
                  <p className="text-center text-xs text-gray-400 py-3">Mostrando 200 de {historicoFiltrado.length}. Exporte o Excel para ver todos.</p>
                )}
              </div>
            </div>
          )}

          {/* ─── Tab: Gráficos ─────────────────────────────────────────── */}
          {vendas.length > 0 && tab === 'graficos' && (
            <div className="space-y-6">
              {/* Evolução por Ano - Line */}
              {vendasPorAno.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-blue-500" /> Evolução de Vendas por Ano
                  </h3>
                  <div className="h-64">
                    <Line data={{
                      labels: vendasPorAno.map(a => a.ano),
                      datasets: [
                        { label: 'Total (R$)', data: vendasPorAno.map(a => a.total), borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.15)', fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#8B5CF6' },
                        { label: 'Sêmen (R$)', data: vendasPorAno.map(a => a.semen), borderColor: '#3B82F6', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderDash: [5, 5] },
                        { label: 'Embriões (R$)', data: vendasPorAno.map(a => a.embrioes), borderColor: '#EC4899', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4, borderDash: [5, 5] },
                      ]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12 } } },
                      scales: { y: { beginAtZero: true, ticks: { callback: v => `R$${(v/1000).toFixed(0)}k` } } },
                    }} />
                  </div>
                </div>
              )}

              {/* Top Clientes - Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-violet-500" /> Top 10 Clientes por Valor
                </h3>
                <div className="h-72">
                  <Bar data={{
                    labels: topClientes.map(c => c.nome.length > 20 ? c.nome.slice(0, 18) + '...' : c.nome),
                    datasets: [{
                      label: 'Valor Total (R$)', data: topClientes.map(c => c.totalGasto),
                      backgroundColor: CHART_COLORS_ALPHA.slice(0, topClientes.length),
                      borderColor: CHART_COLORS.slice(0, topClientes.length), borderWidth: 1, borderRadius: 6,
                    }]
                  }} options={{
                    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, ticks: { callback: v => `R$${(v/1000).toFixed(0)}k` } } },
                  }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sêmen vs Embriões - Doughnut */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Sêmen vs Embriões (Valor)</h3>
                  <div className="h-56 flex items-center justify-center">
                    <Doughnut data={{
                      labels: ['Sêmen', 'Embriões', ...(vendasPorTipo.outros.qtd > 0 ? ['Outros'] : [])],
                      datasets: [{
                        data: [vendasPorTipo.semen.total, vendasPorTipo.embrioes.total, ...(vendasPorTipo.outros.qtd > 0 ? [vendasPorTipo.outros.total] : [])],
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
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{vendasPorTipo.semen.qtd.toLocaleString('pt-BR')} doses</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{fmt(vendasPorTipo.semen.total)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                      <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold">{vendasPorTipo.embrioes.qtd.toLocaleString('pt-BR')} unid.</p>
                      <p className="text-sm font-bold text-pink-800 dark:text-pink-200">{fmt(vendasPorTipo.embrioes.total)}</p>
                    </div>
                  </div>
                </div>

                {/* Vendas por Estado - Pie */}
                {vendasPorEstado.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Vendas por Estado</h3>
                    <div className="h-56 flex items-center justify-center">
                      <Pie data={{
                        labels: vendasPorEstado.slice(0, 8).map(e => e.estado),
                        datasets: [{
                          data: vendasPorEstado.slice(0, 8).map(e => e.total),
                          backgroundColor: CHART_COLORS_ALPHA, borderColor: CHART_COLORS, borderWidth: 1,
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
                {/* Top Produtos - Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Top Produtos por Valor</h3>
                  <div className="h-64">
                    <Bar data={{
                      labels: topProdutos.slice(0, 8).map(p => p.produto.length > 25 ? p.produto.slice(0, 23) + '...' : p.produto),
                      datasets: [{
                        label: 'Valor (R$)', data: topProdutos.slice(0, 8).map(p => p.total),
                        backgroundColor: topProdutos.slice(0, 8).map(p => p.tipo === 'semen' ? 'rgba(59,130,246,0.7)' : p.tipo === 'embriao' ? 'rgba(236,72,153,0.7)' : 'rgba(156,163,175,0.7)'),
                        borderRadius: 6,
                      }]
                    }} options={{
                      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                      plugins: { legend: { display: false } },
                      scales: { x: { beginAtZero: true, ticks: { callback: v => `R$${(v/1000).toFixed(0)}k` } } },
                    }} />
                  </div>
                </div>

                {/* Frequência de Compra - Doughnut */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Frequência de Compra</h3>
                  <div className="h-56 flex items-center justify-center">
                    <Doughnut data={{
                      labels: frequenciaClientes.map(f => f.faixa),
                      datasets: [{
                        data: frequenciaClientes.map(f => f.qtd),
                        backgroundColor: CHART_COLORS_ALPHA.slice(0, 5), borderColor: CHART_COLORS.slice(0, 5), borderWidth: 1,
                      }]
                    }} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } } },
                      cutout: '50%',
                    }} />
                  </div>
                </div>
              </div>

              {/* Status dos Clientes */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
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

      {/* Modal de senha */}
      {showSenhaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🔒 Limpar todos os dados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Digite a senha de desenvolvedor para confirmar.</p>
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

VendasGenetica.getLayout = (page) => page
