import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  HeartIcon,
  MapPinIcon,
  ScaleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export function formatDate(d) {
  if (!d) return '-'
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

export function formatMoneyBR(val) {
  let n
  if (typeof val === 'number') {
    n = val
  } else {
    const s = String(val || '0').replace(/[^\d.,-]/g, '')
    n =
      s.includes(',') && s.lastIndexOf(',') > (s.lastIndexOf('.') || -1)
        ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
        : parseFloat(s.replace(',', '.'))
  }
  if (isNaN(n)) return '-'
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDisplayValue(v) {
  if (v == null) return '-'

  if (typeof v === 'object') {
    if (Array.isArray(v)) return v.length
    if (v.total !== undefined) return v.total
    if (v.valor !== undefined) return v.valor
    if (v.quantidade !== undefined) return v.quantidade
    if (v.count !== undefined) return v.count
    if (v.label !== undefined && v.valor !== undefined) return `${v.label}: ${v.valor}`

    const keys = Object.keys(v)
    if (keys.length === 1) return formatDisplayValue(v[keys[0]])
    if (keys.length <= 3) return keys.map((k) => `${k}: ${v[k]}`).join(', ')
    return `${keys.length} itens`
  }

  const s = String(v).trim()
  if (s.startsWith('R$')) {
    const numStr = s.replace(/[^\d,.-]/g, '').replace(',', '.')
    const n = parseFloat(numStr)
    if (!isNaN(n)) return formatMoneyBR(n)
  }

  return String(v)
}

export function matchReportSearch(label, key, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return String(label || '').toLowerCase().includes(q) || String(key || '').toLowerCase().includes(q)
}

export const CORES_PIQUETE = [
  'rgba(245, 158, 11, 0.85)',
  'rgba(34, 197, 94, 0.85)',
  'rgba(59, 130, 246, 0.85)',
  'rgba(168, 85, 247, 0.85)',
  'rgba(236, 72, 153, 0.85)',
  'rgba(20, 184, 166, 0.85)',
  'rgba(249, 115, 22, 0.85)',
]

export const ICONE_POR_CATEGORIA = {
  Manejo: ScaleIcon,
  Reprodução: HeartIcon,
  Sanidade: UserGroupIcon,
  Estoque: DocumentTextIcon,
  Localização: MapPinIcon,
  Financeiro: CurrencyDollarIcon,
  Gestão: ChartBarIcon,
  Documentos: DocumentTextIcon,
  Outros: ChartBarIcon,
}

export const DESCRICOES_ACESSO_RAPIDO = {
  resumo_geral: 'Resumo completo do rebanho',
  previsoes_parto: 'Datas previstas de partos',
  calendario_reprodutivo: 'Eventos e cronograma',
  ranking_pmgz: 'Top animais por desempenho',
}

export const MOBILE_RELATORIOS_CATS = [
  { key: 'Piquetes', emoji: '🌿', test: (s) => /piquete|^piq\s/i.test(s), colors: 'from-green-500 to-emerald-600' },
  { key: 'Cabanha', emoji: '🏠', test: (s) => /cabanha/i.test(s), colors: 'from-violet-500 to-purple-600' },
  { key: 'Confinamento', emoji: '🏗️', test: (s) => /confina|^conf\b/i.test(s), colors: 'from-orange-500 to-amber-600' },
  { key: 'Projetos', emoji: '🔬', test: (s) => /projeto/i.test(s), colors: 'from-cyan-500 to-teal-600' },
]

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export const ACESSO_RAPIDO_KEYS = ['resumo_geral', 'previsoes_parto', 'calendario_reprodutivo', 'ranking_pmgz']

export const LABELS_RANKING = {
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
  pt_iqg: 'Pt IQG',
  mgte: 'MGTe',
  top: 'TOP',
}

export const LABELS_BOLETIM_CAMPO = {
  local: 'Local',
  local_1: 'Local 1',
  sub_local_2: 'Sub Local',
  quant: 'Qtd',
  sexo: 'Sexo',
  categoria: 'Categoria',
  raca: 'Raça',
  era: 'Era',
  observacao: 'Observação',
}

export const LABELS_BOLETIM_DEFESA = {
  fazenda: 'Fazenda',
  cnpj: 'CNPJ',
  total: 'Total',
}

export const LABELS_BOLETIM_REBANHO = {
  raca: 'Raça',
  sexo: 'Sexo',
  era: 'Era',
  total: 'Total',
}

export function getColumnLabelByContext(col, { ehRanking, ehBoletimCampo, ehBoletimDefesa, ehBoletimRebanho }) {
  if (col === 'mgte') return 'MGTe'
  if (col === 'top') return 'TOP'
  if (ehRanking) return LABELS_RANKING[col] || col
  if (ehBoletimCampo) return LABELS_BOLETIM_CAMPO[col] || col
  if (ehBoletimDefesa) return LABELS_BOLETIM_DEFESA[col] || col
  if (ehBoletimRebanho) return LABELS_BOLETIM_REBANHO[col] || col
  return col
}

export function buildConsultaAnimalId(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const normalized = raw
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

  if (!normalized) return null

  const direct = normalized.match(/^([A-Z]+)-([A-Z0-9]+)$/)
  if (direct) return `${direct[1]}-${direct[2]}`

  const compact = normalized.match(/^([A-Z]+)\s+([A-Z0-9]+)$/)
  if (compact) return `${compact[1]}-${compact[2]}`

  return normalized.replace(/\s+/g, '-')
}

export const racaKey = (s) => ((s || 'Não informada').trim() || 'Não informada').toUpperCase()
export const racaDisplay = (s) => {
  const t = (s || 'Não informada').trim() || 'Não informada'
  if (t === 'NÃO INFORMADA') return 'Não informada'
  return t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export const DESCRICOES_CARDS = {
  Total: 'Total de cabeças no rebanho conforme o Boletim de Campo.',
  Machos: 'Quantidade de machos no rebanho.',
  Fêmeas: 'Quantidade de fêmeas no rebanho.',
  Bezerros: 'Animais com até 12 meses de idade.',
  Novilhas: 'Animais entre 12 e 24 meses de idade.',
  Adultos: 'Animais com mais de 24 meses de idade.',
  Custos: 'Soma dos custos registrados no período selecionado.',
  Vendas: 'Total de vendas de animais no período.',
  'Gestações Ativas': 'Fêmeas em gestação (gestações cadastradas + prenhas por IA).',
  'Para Parir (30d)': 'Partos previstos nos próximos 30 dias.',
  Nascimentos: 'Nascimentos registrados no período.',
  'Nascimentos (30d)': 'Nascimentos registrados nos últimos 30 dias.',
  'Média Recente': 'Peso médio das últimas pesagens (90 dias).',
  Vacinações: 'Vacinações aplicadas no período.',
  Mortes: 'Mortes registradas no período.',
  'Touros (sêmen)': 'Quantidade de touros com doses de sêmen em estoque.',
  'Doses Sêmen': 'Total de doses de sêmen disponíveis.',
  Acasalamentos: 'Quantidade de acasalamentos cadastrados.',
  'Embriões Disp.': 'Embriões disponíveis em estoque.',
  rebanho: 'Resumo do rebanho: total de animais, machos, fêmeas e distribuição por idade.',
  reproducao: 'Resumo reprodutivo: gestações ativas, nascimentos e partos previstos.',
  peso: 'Média de peso recente dos animais.',
  financeiro: 'Resumo financeiro: custos e vendas no período.',
  estoque: 'Estoque de sêmen e embriões disponíveis.',
  'Valor total': 'Soma total dos valores no relatório.',
  'Total de custos': 'Quantidade de registros de custos e valor total.',
}

export function diasDesde(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.floor((hoje - d) / (1000 * 60 * 60 * 24))
}

export function diasAte(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((d - hoje) / (1000 * 60 * 60 * 24))
}

export const normalizeLocalKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s/-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()

export function buildMedLocalKeys(local, local1, subLocal2) {
  const l = normalizeLocalKey(local)
  const l1 = normalizeLocalKey(local1)
  const s2 = normalizeLocalKey(subLocal2)
  const keys = []
  if (l && l1 && s2) keys.push(`L3:${l}||${l1}||${s2}`)
  if (l && l1) keys.push(`L2:${l}||${l1}`)
  if (l && s2) keys.push(`LS:${l}||${s2}`)
  if (l) keys.push(`L1:${l}`)
  return [...new Set(keys)]
}

export function sortMedsByDate(a, b) {
  const aDate = new Date(`${a?.data_aplicacao || ''}T12:00:00`).getTime() || 0
  const bDate = new Date(`${b?.data_aplicacao || ''}T12:00:00`).getTime() || 0
  if (bDate !== aDate) return bDate - aDate
  const aCreated = new Date(a?.created_at || 0).getTime() || 0
  const bCreated = new Date(b?.created_at || 0).getTime() || 0
  return bCreated - aCreated
}

export function dedupeMeds(items = []) {
  const seen = new Set()
  return items.filter((m, idx) => {
    const key =
      m?.id != null
        ? `id:${m.id}`
        : `fallback:${m?.boletim_campo_id || ''}:${m?.medicamento || ''}:${m?.data_aplicacao || ''}:${idx}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function medsDoRowFromMaps(rowOrId, fallbackRow = null, medicamentos = {}, medicamentosPorLocal = {}) {
  const row = typeof rowOrId === 'object' && rowOrId !== null ? rowOrId : fallbackRow
  const id = typeof rowOrId === 'object' && rowOrId !== null ? rowOrId.id : rowOrId
  const medsById = id != null ? medicamentos[id] || [] : []

  if (!row) return medsById

  const localKeys = buildMedLocalKeys(row.local, row.local_1, row.sub_local_2)
  const medsByLocal = localKeys.flatMap((k) => medicamentosPorLocal[k] || [])
  return dedupeMeds([...medsById, ...medsByLocal]).sort(sortMedsByDate)
}

export function ultimoMedRowFromMaps(rowOrId, fallbackRow = null, medicamentos = {}, medicamentosPorLocal = {}) {
  return medsDoRowFromMaps(rowOrId, fallbackRow, medicamentos, medicamentosPorLocal)[0] || null
}

