import { query } from '../../../lib/database'
import { sendEmail, generateEmailContent } from '../../../utils/emailService'
import { sendWhatsApp, sendWhatsAppMedia } from '../../../utils/whatsappService'
import ExcelJS from 'exceljs'
import { sendSuccess, sendError, sendValidationError, sendMethodNotAllowed } from '../../../utils/apiResponse'
import { Chart, registerables } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'

// Registrar todos os componentes do Chart.js
Chart.register(...registerables)

// Helper: adiciona aba Resumo ao início do workbook (chamar ANTES de adicionar a aba de dados)
function addResumoSheet(workbook, { titulo, periodo, totalRegistros, linhas = [], corPrimaria = '4472C4' }) {
  const sheet = workbook.addWorksheet('Resumo', { properties: { outlineLevelCol: 0 } })

  sheet.mergeCells('A1:D1')
  sheet.getCell('A1').value = `📊 RESUMO - ${titulo}`
  sheet.getCell('A1').font = { size: 18, bold: true }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + corPrimaria } }
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 35

  sheet.addRow([])
  sheet.addRow(['Gerado em:', new Date().toLocaleString('pt-BR')])
  if (periodo) sheet.addRow(['Período:', periodo])
  sheet.addRow(['Total de registros:', totalRegistros])
  sheet.addRow([])

  if (linhas.length > 0) {
    const headerResumo = sheet.addRow(['Indicador', 'Quantidade/Valor'])
    headerResumo.font = { bold: true }
    headerResumo.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    })
    linhas.forEach(l => sheet.addRow([l.label, l.valor]))
  }

  sheet.columns = [{ width: 35 }, { width: 25 }]
}

// Função auxiliar para normalizar datas
const toPgDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().split('T')[0]
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [d, m, y] = value.split('/')
      return `${y}-${m}-${d}`
    }
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return null
  }
  return null
}

// Extrair local das observações (igual ao dashboard de pesagem)
function extrairLocalObservacoes(obs) {
  if (!obs || typeof obs !== 'string') return null
  const s = obs.trim()
  if (!s) return null
  const sNorm = s.replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
  const m = sNorm.match(/(PIQUETE\s*\d+|PROJETO\s*[\dA-Za-z\-]+|LOTE\s*\d+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
  if (m) {
    let loc = m[1].trim().toUpperCase().replace(/\s+/g, ' ')
    if (/^CONFINA/.test(loc)) loc = 'CONFINA'
    return loc
  }
  return s.length <= 35 ? s.toUpperCase() : s.substring(0, 35).toUpperCase()
}

// Normalizar PIQUETE X e PROJETO X para o mesmo grupo (ex: PROJETO X) - alinha com dashboard
function normalizarPiqueteParaAgrupamento(piquete) {
  if (!piquete || piquete === 'Não informado') return piquete || 'Não informado'
  const s = String(piquete).trim().toUpperCase()
  const mPiq = s.match(/^PIQUETE\s*(\d+)$/i)
  const mProj = s.match(/^PROJETO\s*([\dA-Za-z\-]+)$/i)
  if (mPiq) return `PROJETO ${mPiq[1]}`
  if (mProj) return `PROJETO ${mProj[1]}`
  return s
}

// Função para formatar data no padrão brasileiro dd/mm/aaaa
const formatDateBR = (dateStr) => {
  if (!dateStr) return ''
  // Se já está no formato dd/mm/aaaa, retorna como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr
  // Se está no formato aaaa-mm-dd, converte
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }
  // Tenta converter de Date
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
  } catch (e) {
    // Ignora erro
  }
  return dateStr
}

// Descobrir o nome da coluna de data em inseminacoes (compatível com esquemas antigos/novos)
let _iaDateColumnCache = null
async function getIADataColumn() {
  if (_iaDateColumnCache) return _iaDateColumnCache
  try {
    const res = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'inseminacoes'
        AND column_name IN ('data_ia', 'data_inseminacao', 'data')
    `)
    const cols = res.rows.map(r => r.column_name)
    _iaDateColumnCache = cols.includes('data_ia') ? 'data_ia'
                        : cols.includes('data_inseminacao') ? 'data_inseminacao'
                        : cols.includes('data') ? 'data'
                        : 'data_ia'
  } catch (e) {
    _iaDateColumnCache = 'data_ia'
  }
  return _iaDateColumnCache
}

// Gerar relatório de NF Entrada e Saída
async function generateNFReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Buscar NFs e calcular quantidade real dos itens
  const result = await query(`
    SELECT 
      nf.*,
      COALESCE(
        (SELECT SUM(
          CASE 
            WHEN nfi.quantidade IS NOT NULL AND nfi.quantidade > 0 THEN nfi.quantidade
            WHEN nfi.dados_item->>'quantidade' IS NOT NULL AND nfi.dados_item->>'quantidade' != '' AND (nfi.dados_item->>'quantidade')::int > 0 
              THEN (nfi.dados_item->>'quantidade')::int
            WHEN nfi.dados_item->>'quantidadeAnimais' IS NOT NULL AND nfi.dados_item->>'quantidadeAnimais' != '' AND (nfi.dados_item->>'quantidadeAnimais')::int > 0
              THEN (nfi.dados_item->>'quantidadeAnimais')::int
            WHEN nfi.dados_item->>'qtd' IS NOT NULL AND nfi.dados_item->>'qtd' != '' AND (nfi.dados_item->>'qtd')::int > 0
              THEN (nfi.dados_item->>'qtd')::int
            WHEN (nfi.dados_item->>'modoCadastro') = 'categoria' AND nfi.dados_item->>'quantidade' IS NOT NULL
              THEN GREATEST(COALESCE((nfi.dados_item->>'quantidade')::int, 0), 1)
            ELSE 1
          END
        ) FROM notas_fiscais_itens nfi WHERE nfi.nota_fiscal_id = nf.id),
        (SELECT COUNT(*) FROM notas_fiscais_itens WHERE nota_fiscal_id = nf.id),
        nf.quantidade_receptoras,
        0
      ) as quantidade_calculada,
      ARRAY(
        SELECT 
          NULLIF(TRIM(COALESCE(
            nfi.dados_item->>'tatuagem', 
            nfi.dados_item->>'brinco', 
            nfi.dados_item->>'receptora',
            nfi.dados_item->>'identificacaoAnimal',
            nfi.dados_item->>'nome', 
            nfi.dados_item->>'identificacao',
            CASE WHEN nfi.dados_item->>'serie' IS NOT NULL AND nfi.dados_item->>'rg' IS NOT NULL 
              THEN TRIM(CONCAT(COALESCE(nfi.dados_item->>'serie',''), ' ', COALESCE(nfi.dados_item->>'rg','')))
              ELSE NULL END,
            CASE WHEN LENGTH(COALESCE(nfi.dados_item->>'descricao', nfi.descricao, '')) BETWEEN 1 AND 25 
              THEN COALESCE(nfi.dados_item->>'descricao', nfi.descricao)
              ELSE NULL END
          )), '')
        FROM notas_fiscais_itens nfi
        WHERE nfi.nota_fiscal_id = nf.id 
        AND (
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'tatuagem','')), '') IS NOT NULL OR 
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'brinco','')), '') IS NOT NULL OR 
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'receptora','')), '') IS NOT NULL OR
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'identificacaoAnimal','')), '') IS NOT NULL OR
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'nome','')), '') IS NOT NULL OR
          NULLIF(TRIM(COALESCE(nfi.dados_item->>'identificacao','')), '') IS NOT NULL OR
          (COALESCE(nfi.dados_item->>'serie','') != '' AND COALESCE(nfi.dados_item->>'rg','') != '') OR
          (LENGTH(TRIM(COALESCE(nfi.dados_item->>'descricao', nfi.descricao, ''))) BETWEEN 1 AND 25)
        )
      ) as identificacoes_itens
    FROM notas_fiscais nf
    WHERE (
      COALESCE(
        CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END,
        nf.data_compra
      ) >= $1
      AND COALESCE(
        CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END,
        nf.data_compra
      ) <= $2
    )
    ORDER BY COALESCE(
      CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END,
      nf.data_compra
    ) DESC
  `, [pgStart, pgEnd])

  const workbook = new ExcelJS.Workbook()
  const rows = result.rows || []
  const entradas = rows.filter(n => n.tipo === 'entrada')
  const saidas = rows.filter(n => n.tipo === 'saida')
  const valorEntradas = entradas.reduce((s, n) => s + (parseFloat(n.valor_total) || 0), 0)
  const valorSaidas = saidas.reduce((s, n) => s + (parseFloat(n.valor_total) || 0), 0)
  const totalItens = rows.reduce((s, n) => s + (n.quantidade_calculada || n.quantidade_receptoras || 0), 0)

  addResumoSheet(workbook, {
    titulo: 'Notas Fiscais - Entrada e Saída',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    linhas: [
      { label: 'Notas de Entrada', valor: entradas.length },
      { label: 'Notas de Saída', valor: saidas.length },
      { label: 'Valor Total Entradas (R$)', valor: valorEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
      { label: 'Valor Total Saídas (R$)', valor: valorSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
      { label: 'Total de Itens/Animais', valor: totalItens }
    ]
  })

  const sheet = workbook.addWorksheet('NF Entrada e Saída')

  // Cabeçalho
  sheet.mergeCells('A1:K1')
  sheet.getCell('A1').value = '📄 RELATÓRIO DE NOTAS FISCAIS - ENTRADA E SAÍDA'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:K2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  // Cabeçalho da tabela
  const headerRow = sheet.addRow([
    'Número NF', 'Data', 'Tipo', 'Fornecedor/Cliente', 'Valor Total', 
    'Quantidade', 'Animais/Itens', 'Natureza Operação', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  // Dados
  rows.forEach(nf => {
    // Usar quantidade calculada se disponível, senão usar quantidade_receptoras, senão 0
    const quantidade = nf.quantidade_calculada || nf.quantidade_receptoras || 0
    
    // Formatar identificações dos itens (filtrar null/undefined/vazio)
    let identificacoes = ''
    if (nf.identificacoes_itens && Array.isArray(nf.identificacoes_itens)) {
      const itensValidos = nf.identificacoes_itens.filter(i => i && String(i).trim())
      identificacoes = itensValidos.join(', ')
    }
    // Quando não há identificações individuais mas há quantidade (ex: modo categoria)
    if (!identificacoes && quantidade > 0) {
      identificacoes = `${quantidade} item(ns) - identificação por lote`
    }

    const dataExibir = (nf.tipo === 'saida' && nf.data_saida) ? nf.data_saida : nf.data_compra
    sheet.addRow([
      nf.numero_nf || '',
      dataExibir ? new Date(dataExibir).toLocaleDateString('pt-BR') : '',
      nf.tipo === 'entrada' ? 'Entrada' : 'Saída',
      nf.tipo === 'entrada' ? (nf.fornecedor || '') : (nf.destino || ''),
      nf.valor_total || 0,
      quantidade,
      identificacoes,
      nf.natureza_operacao || '',
      nf.observacoes || ''
    ])
  })

  // Ajustar colunas
  sheet.columns.forEach(col => { col.width = 15 })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Receptoras que Chegaram
async function generateReceptorasChegaramReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Buscar cada item individualmente para ter as informações corretas de cada receptora
  const result = await query(`
    SELECT 
      nf.numero_nf,
      COALESCE(nf.data_chegada_animais, nf.data_compra) as data_chegada,
      nf.fornecedor,
      nf.valor_total,
      item.dados_item,
      CASE 
        WHEN item.dados_item->>'tatuagem' IS NOT NULL THEN item.dados_item->>'tatuagem'
        WHEN item.dados_item->>'serie' IS NOT NULL AND item.dados_item->>'rg' IS NOT NULL 
          THEN CONCAT(item.dados_item->>'serie', item.dados_item->>'rg')
        ELSE CONCAT(COALESCE(nf.receptora_letra, ''), COALESCE(nf.receptora_numero, ''))
      END as receptora_identificacao,
      CASE 
        WHEN item.dados_item->>'tatuagem' IS NOT NULL THEN item.dados_item->>'tatuagem'
        ELSE NULL
      END as tatuagem
    FROM notas_fiscais nf
    INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
    WHERE nf.eh_receptoras = true 
      AND nf.tipo = 'entrada'
      AND COALESCE(nf.data_chegada_animais, nf.data_compra) >= $1
      AND COALESCE(nf.data_chegada_animais, nf.data_compra) <= $2
      AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
    ORDER BY nf.numero_nf, item.id
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const porFornecedor = {}
  rows.forEach(r => {
    const f = r.fornecedor || 'Não informado'
    porFornecedor[f] = (porFornecedor[f] || 0) + 1
  })
  const nfsUnicas = new Set(rows.map(r => r.numero_nf)).size

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Receptoras que Chegaram',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    linhas: [
      { label: 'Notas Fiscais distintas', valor: nfsUnicas },
      ...Object.entries(porFornecedor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([f, q]) => ({ label: `Fornecedor: ${f}`, valor: q }))
    ]
  })

  const sheet = workbook.addWorksheet('Receptoras que Chegaram')

  sheet.mergeCells('A1:G1')
  sheet.getCell('A1').value = '🐄 RECEPTORAS QUE CHEGARAM'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'NF', 'Data Chegada', 'Fornecedor', 'Receptora', 'Tatuagem', 'Quantidade', 'Valor Total'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  // Processar cada item como uma linha separada
  rows.forEach(row => {
    let dadosItem = null
    if (row.dados_item) {
      try {
        dadosItem = typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
      } catch (e) {
        dadosItem = {}
      }
    }

    const tatuagem = row.tatuagem || dadosItem?.tatuagem || ''
    let receptora = row.receptora_identificacao || ''
    
    // Se tem tatuagem, usar como identificação principal
    if (tatuagem) {
      receptora = tatuagem
    } else if (dadosItem?.serie && dadosItem?.rg) {
      receptora = `${dadosItem.serie}${dadosItem.rg}`
    }

    const quantidade = dadosItem?.quantidade || dadosItem?.quantidadeAnimais || 1
    const valorUnitario = dadosItem?.valorUnitario || dadosItem?.valor || 0

    sheet.addRow([
      row.numero_nf || '',
      row.data_chegada ? new Date(row.data_chegada).toLocaleDateString('pt-BR') : '',
      row.fornecedor || '',
      receptora,
      tatuagem,
      quantidade,
      valorUnitario
    ])
  })

  sheet.columns.forEach((col, idx) => { 
    if (idx === 0) col.width = 15 // NF
    else if (idx === 1) col.width = 12 // Data
    else if (idx === 2) col.width = 25 // Fornecedor
    else if (idx === 3) col.width = 15 // Receptora
    else if (idx === 4) col.width = 15 // Tatuagem
    else if (idx === 5) col.width = 12 // Quantidade
    else col.width = 15 // Valor
  })
  
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Agenda de Atividades (DGT) em Excel
async function generateAgendaAtividadesReport(baseUrl) {
  const res = await fetch(`${baseUrl}/api/planejamento/agenda-eventos`)
  if (!res.ok) {
    throw new Error(`Erro ao buscar agenda: ${res.status}`)
  }
  const json = await res.json()
  const data = json.data || json
  const dgt = data.dgt || []

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Agenda de Atividades',
    periodo: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    totalRegistros: dgt.length,
    linhas: [
      { label: 'Avaliação DGT (330-640 dias)', valor: dgt.length }
    ],
    corPrimaria: 'F59E0B'
  })

  // Aba DGT
  const sheetDGT = workbook.addWorksheet('DGT')
  sheetDGT.mergeCells('A1:I1')
  sheetDGT.getCell('A1').value = '📊 Avaliação DGT - Animais 330 a 640 dias'
  sheetDGT.getCell('A1').font = { size: 14, bold: true }
  sheetDGT.getCell('A1').alignment = { horizontal: 'center' }
  const headerDGT = sheetDGT.addRow(['Série', 'RG', 'Sexo', 'Raça', 'Data Nasc.', 'Idade (dias)', 'Idade (meses)', 'Peso', 'Piquete'])
  headerDGT.font = { bold: true }
  headerDGT.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
    cell.font = { color: { argb: 'FFFFFFFF' } }
  })
  dgt.forEach(a => {
    sheetDGT.addRow([
      a.serie || '',
      a.rg || '',
      a.sexo || '',
      a.raca || '',
      a.data_nascimento ? formatDateBR(a.data_nascimento) : '',
      a.idade_dias ?? '',
      a.idade_dias != null ? Math.floor(a.idade_dias / 30.44) : '',
      a.peso || '',
      a.piquete || a.piquete_localizacao || a.piquete_atual || a.pasto_atual || 'Não informado'
    ])
  })
  sheetDGT.columns.forEach((col, idx) => { col.width = idx === 8 ? 25 : 14 })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Receptoras que Faltam Parir
async function generateReceptorasFaltamParirReport() {
  const result = await query(`
    WITH gestacoes_te AS (
      SELECT 
        g.id as gestacao_id,
        g.receptora_nome,
        g.receptora_serie,
        g.receptora_rg,
        g.data_cobertura,
        COALESCE(g.situacao, 'Ativa') AS situacao,
        nf.numero_nf,
        nf.data_compra,
        nf.data_te
      FROM gestacoes g
      JOIN notas_fiscais nf
        ON (
          g.receptora_nome = CONCAT(nf.receptora_letra, nf.receptora_numero) OR 
          (g.receptora_serie = nf.receptora_letra AND g.receptora_rg = nf.receptora_numero)
        )
        AND g.data_cobertura::date = nf.data_te::date
      WHERE nf.eh_receptoras = true
        AND nf.tipo = 'entrada'
        AND nf.data_te IS NOT NULL
        AND COALESCE(g.situacao, 'Ativa') NOT IN ('Nasceu', 'Nascido', 'Cancelada', 'Cancelado', 'Perdeu', 'Aborto')
    )
    SELECT DISTINCT
      gt.numero_nf,
      gt.data_compra,
      gt.receptora_serie AS receptora_letra,
      gt.receptora_rg    AS receptora_numero,
      gt.data_te,
      (gt.data_te + INTERVAL '285 days')::date as previsao_parto,
      CASE 
        WHEN (gt.data_te + INTERVAL '285 days')::date < CURRENT_DATE THEN 'Atrasado'
        WHEN (gt.data_te + INTERVAL '285 days')::date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Próximo'
        ELSE 'Normal'
      END as status
    FROM gestacoes_te gt
    WHERE NOT EXISTS (
      SELECT 1 FROM nascimentos n 
      WHERE n.gestacao_id = gt.gestacao_id
    )
    ORDER BY previsao_parto ASC
  `)

  const rows = result.rows || []
  const porStatus = { Atrasado: 0, Próximo: 0, Normal: 0 }
  rows.forEach(r => {
    const s = r.status || 'Normal'
    if (porStatus[s] !== undefined) porStatus[s]++
    else porStatus.Normal++
  })

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Receptoras que Faltam Parir',
    totalRegistros: rows.length,
    corPrimaria: 'E67E22',
    linhas: [
      { label: 'Status: Atrasado (parto já passou)', valor: porStatus.Atrasado },
      { label: 'Status: Próximo (30 dias)', valor: porStatus.Próximo },
      { label: 'Status: Normal', valor: porStatus.Normal }
    ]
  })

  const sheet = workbook.addWorksheet('Receptoras Faltam Parir')

  sheet.mergeCells('A1:G1')
  sheet.getCell('A1').value = '⏰ RECEPTORAS QUE FALTAM PARIR'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'NF', 'Receptora', 'Data TE', 'Previsão Parto', 'Status', 'Dias Restantes'
  ])
  headerRow.font = { bold: true }

  rows.forEach(r => {
    const hoje = new Date()
    const previsao = new Date(r.previsao_parto)
    const diasRestantes = Math.ceil((previsao - hoje) / (1000 * 60 * 60 * 24))

    sheet.addRow([
      r.numero_nf || '',
      `${r.receptora_letra || ''}${r.receptora_numero || ''}`,
      r.data_te ? new Date(r.data_te).toLocaleDateString('pt-BR') : '',
      r.previsao_parto ? new Date(r.previsao_parto).toLocaleDateString('pt-BR') : '',
      r.status,
      diasRestantes
    ])
  })

  sheet.columns.forEach(col => { col.width = 15 })
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Previsões de Parto (FIV vs IA)
async function generatePrevisoesPartoReport(data) {
  const { previsoesFIV = [], previsoesIA = [], totalFIV = 0, totalIA = 0 } = data
  const total = totalFIV + totalIA

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Previsões de Parto - FIV vs IA',
    totalRegistros: total,
    corPrimaria: '059669',
    linhas: [
      { label: 'Receptoras para parir de FIV', valor: totalFIV },
      { label: 'Fêmeas para parir de IA', valor: totalIA },
      { label: 'Total de previsões', valor: total }
    ]
  })

  const sheet = workbook.addWorksheet('Previsões FIV')
  sheet.mergeCells('A1:F1')
  sheet.getCell('A1').value = '🔬 RECEPTORAS PARA PARIR DE FIV'
  sheet.getCell('A1').font = { size: 14, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.addRow(['Série', 'RG', 'Receptora', 'Data Prevista', 'Sexo']).font = { bold: true }
  previsoesFIV.forEach(p => {
    sheet.addRow([
      p.serie || '-',
      p.rg || '-',
      p.receptora || '-',
      p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-',
      p.sexo || '-'
    ])
  })

  const sheetIA = workbook.addWorksheet('Previsões IA')
  sheetIA.mergeCells('A1:F1')
  sheetIA.getCell('A1').value = '💉 FÊMEAS PARA PARIR DE IA'
  sheetIA.getCell('A1').font = { size: 14, bold: true }
  sheetIA.getCell('A1').alignment = { horizontal: 'center' }
  sheetIA.addRow(['Série', 'RG', 'Fêmea', 'Data Prevista', 'Touro']).font = { bold: true }
  previsoesIA.forEach(p => {
    sheetIA.addRow([
      p.serie || '-',
      p.rg || '-',
      p.receptora || '-',
      p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-',
      p.touro || '-'
    ])
  })

  sheet.columns.forEach(col => { col.width = 18 })
  sheetIA.columns.forEach(col => { col.width = 18 })
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Helper: conta receptoras que faltam DG (matching flexível - exclui animais/TE/história com DG)
async function countReceptorasFaltamDG(pgStart, pgEnd) {
  const result = await query(`
    SELECT nf.receptora_letra, nf.receptora_numero, item.dados_item
    FROM notas_fiscais nf
    INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
    WHERE nf.eh_receptoras = true AND nf.tipo = 'entrada'
      AND COALESCE(nf.data_chegada_animais, nf.data_compra) IS NOT NULL
      AND COALESCE(nf.data_chegada_animais, nf.data_compra)::date >= $1
      AND COALESCE(nf.data_chegada_animais, nf.data_compra)::date <= $2
      AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
  `, [pgStart, pgEnd])
  const jaTemDGKeys = new Set()
  const addKey = (letra, numero) => {
    const l = String(letra || '').trim().toUpperCase()
    const n = String(numero || '').trim()
    const nSemZero = n.replace(/^0+/, '') || '0'
    if (n) {
      jaTemDGKeys.add(`${l}|${n}`)
      jaTemDGKeys.add(`${l}|${nSemZero}`)
      jaTemDGKeys.add((l + n).replace(/\s/g, '').toLowerCase())
    }
  }
  const [anim, te, hist] = await Promise.all([
    query(`SELECT serie, rg FROM animais WHERE data_dg IS NOT NULL`),
    query(`SELECT r.serie, r.rg FROM transferencias_embrioes te LEFT JOIN animais r ON r.id = te.receptora_id WHERE te.data_diagnostico IS NOT NULL AND r.id IS NOT NULL`),
    query(`SELECT a.serie, a.rg FROM historia_ocorrencias h JOIN animais a ON a.id = h.animal_id WHERE h.tipo = 'DG' AND h.data IS NOT NULL`)
  ])
  ;[...anim.rows, ...te.rows, ...hist.rows].forEach(r => addKey(r.serie, r.rg))
  let count = 0
  for (const r of result.rows || []) {
    let letra = r.receptora_letra || '', numero = r.receptora_numero || ''
    let dadosItem = r.dados_item
    if (typeof dadosItem === 'string') { try { dadosItem = JSON.parse(dadosItem) } catch { dadosItem = null } }
    const tatuagem = dadosItem?.tatuagem || ''
    if (tatuagem) {
      const mL = tatuagem.match(/^([A-Za-z]+)/), mN = tatuagem.match(/(\d+)/)
      if (mL) letra = mL[1].toUpperCase()
      if (mN) numero = mN[1]
    }
    if (!numero && dadosItem?.rg) numero = String(dadosItem.rg)
    if (!numero) continue
    const l = String(letra || '').trim().toUpperCase()
    const n = String(numero || '').trim()
    const nSemZero = n.replace(/^0+/, '') || '0'
    const temDG = [`${l}|${n}`, `${l}|${nSemZero}`, (l + n).replace(/\s/g, '').toLowerCase()].some(k => jaTemDGKeys.has(k))
    if (!temDG) count++
  }
  return count
}

// Gerar relatório de Receptoras que Faltam Diagnóstico (por período de chegada)
// Usa matching flexível igual ao lista-dg/export-dg-pendentes para excluir receptoras já diagnosticadas
async function generateReceptorasFaltamDGReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // 1) Buscar TODOS os itens de NF receptoras no período (sem filtrar por DG ainda)
  const result = await query(`
    SELECT 
      nf.numero_nf,
      nf.fornecedor,
      nf.receptora_letra,
      nf.receptora_numero,
      COALESCE(nf.data_chegada_animais, nf.data_compra)::date as data_chegada,
      (COALESCE(nf.data_chegada_animais, nf.data_compra) + INTERVAL '15 days')::date as data_prevista_dg,
      CASE 
        WHEN (COALESCE(nf.data_chegada_animais, nf.data_compra) + INTERVAL '15 days')::date < CURRENT_DATE THEN 'Atrasado'
        WHEN (COALESCE(nf.data_chegada_animais, nf.data_compra) + INTERVAL '15 days')::date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Próximo'
        ELSE 'Normal'
      END as status,
      item.dados_item
    FROM notas_fiscais nf
    INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
    WHERE nf.eh_receptoras = true
      AND nf.tipo = 'entrada'
      AND COALESCE(nf.data_chegada_animais, nf.data_compra) IS NOT NULL
      AND COALESCE(nf.data_chegada_animais, nf.data_compra)::date >= $1
      AND COALESCE(nf.data_chegada_animais, nf.data_compra)::date <= $2
      AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
    ORDER BY data_chegada ASC, nf.numero_nf, item.id
  `, [pgStart, pgEnd])

  // 2) Set de chaves normalizadas de animais/receptoras que JÁ têm DG
  const jaTemDGKeys = new Set()
  const addKey = (letra, numero) => {
    const l = String(letra || '').trim().toUpperCase()
    const n = String(numero || '').trim()
    const nSemZero = n.replace(/^0+/, '') || '0'
    if (n) {
      jaTemDGKeys.add(`${l}|${n}`)
      jaTemDGKeys.add(`${l}|${nSemZero}`)
      jaTemDGKeys.add(`|${n}`)
      jaTemDGKeys.add(`|${nSemZero}`)
      jaTemDGKeys.add((l + n).replace(/\s/g, '').toLowerCase())
      jaTemDGKeys.add((l + nSemZero).replace(/\s/g, '').toLowerCase())
    }
  }
  const animComDG = await query(`
    SELECT serie, rg, tatuagem FROM animais WHERE data_dg IS NOT NULL
  `)
  animComDG.rows.forEach(a => {
    addKey(a.serie, a.rg)
    if (a.tatuagem) addKey('', a.tatuagem.replace(/\s/g, ''))
  })
  const teComDG = await query(`
    SELECT r.serie, r.rg FROM transferencias_embrioes te
    LEFT JOIN animais r ON r.id = te.receptora_id
    WHERE te.data_diagnostico IS NOT NULL AND r.id IS NOT NULL
  `)
  teComDG.rows.forEach(r => { addKey(r.serie, r.rg) })
  const histDG = await query(`
    SELECT a.serie, a.rg FROM historia_ocorrencias h
    JOIN animais a ON a.id = h.animal_id
    WHERE h.tipo = 'DG' AND h.data IS NOT NULL
  `)
  histDG.rows.forEach(a => { addKey(a.serie, a.rg) })

  // 3) Filtrar: manter apenas itens cuja receptora ainda NÃO tem DG
  const rows = []
  for (const r of result.rows || []) {
    let letra = r.receptora_letra || ''
    let numero = r.receptora_numero || ''
    let dadosItem = r.dados_item
    if (typeof dadosItem === 'string') {
      try { dadosItem = JSON.parse(dadosItem) } catch { dadosItem = null }
    }
    const tatuagem = dadosItem?.tatuagem || (r.dados_item?.tatuagem) || ''
    if (tatuagem) {
      const mL = tatuagem.match(/^([A-Za-z]+)/)
      const mN = tatuagem.match(/(\d+)/)
      if (mL) letra = mL[1].toUpperCase()
      if (mN) numero = mN[1]
    }
    if (!numero && dadosItem?.rg) numero = String(dadosItem.rg)
    if (!letra && dadosItem?.serie) letra = String(dadosItem.serie).toUpperCase()
    if (!numero) continue

    const l = String(letra || '').trim().toUpperCase()
    const n = String(numero || '').trim()
    const nSemZero = n.replace(/^0+/, '') || '0'
    const chaves = [`${l}|${n}`, `${l}|${nSemZero}`, `|${n}`, `|${nSemZero}`, (l + n).replace(/\s/g, '').toLowerCase(), (l + nSemZero).replace(/\s/g, '').toLowerCase()]
    const temDG = chaves.some(k => jaTemDGKeys.has(k))
    if (temDG) continue

    rows.push({ ...r, receptora_identificacao: tatuagem || `${letra} ${numero}`.trim() || `${l}${n}` })
  }
  const porStatus = { Atrasado: 0, Próximo: 0, Normal: 0 }
  rows.forEach(r => {
    const s = r.status || 'Normal'
    if (porStatus[s] !== undefined) porStatus[s]++
    else porStatus.Normal++
  })
  const porFornecedor = {}
  rows.forEach(r => {
    const f = r.fornecedor || 'Não informado'
    porFornecedor[f] = (porFornecedor[f] || 0) + 1
  })

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Receptoras que Faltam DG',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    corPrimaria: '9F7AEA',
    linhas: [
      { label: 'Status: Atrasado (DG já passou)', valor: porStatus.Atrasado },
      { label: 'Status: Próximo (7 dias)', valor: porStatus.Próximo },
      { label: 'Status: Normal', valor: porStatus.Normal },
      ...Object.entries(porFornecedor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([f, q]) => ({ label: `Fornecedor: ${f}`, valor: q }))
    ]
  })

  const sheet = workbook.addWorksheet('Receptoras Faltam DG')

  sheet.mergeCells('A1:G1')
  sheet.getCell('A1').value = '🔬 RECEPTORAS QUE FALTAM DIAGNÓSTICO DE GESTAÇÃO'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  sheet.mergeCells('A2:G2')
  sheet.getCell('A2').value = `Período de chegada: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)} • DG previsto em 15 dias`
  sheet.getCell('A2').font = { size: 10 }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'NF', 'Receptora', 'Fornecedor', 'Data Chegada', 'Data Prevista DG', 'Status', 'Dias Restantes'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '9F7AEA' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  rows.forEach(r => {
    const hoje = new Date()
    const prevista = new Date(r.data_prevista_dg)
    const diasRestantes = Math.ceil((prevista - hoje) / (1000 * 60 * 60 * 24))

    let receptora = r.receptora_identificacao || ''
    if (r.dados_item) {
      try {
        const dados = typeof r.dados_item === 'string' ? JSON.parse(r.dados_item) : r.dados_item
        if (dados?.tatuagem) receptora = dados.tatuagem
        else if (dados?.serie && dados?.rg) receptora = `${dados.serie}${dados.rg}`
      } catch (_) {}
    }

    sheet.addRow([
      r.numero_nf || '',
      receptora,
      r.fornecedor || '',
      r.data_chegada ? new Date(r.data_chegada).toLocaleDateString('pt-BR') : '',
      r.data_prevista_dg ? new Date(r.data_prevista_dg).toLocaleDateString('pt-BR') : '',
      r.status,
      diasRestantes
    ])
  })

  sheet.columns.forEach((col, idx) => { 
    if (idx === 0) col.width = 12
    else if (idx === 1) col.width = 15
    else if (idx === 2) col.width = 22
    else col.width = 15
  })
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Fêmeas que Fizeram IA
async function generateFemeasIAReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const iaDateCol = await getIADataColumn()
  const result = await query(`
    SELECT 
      i.id,
      i.${iaDateCol} as data_inseminacao,
      CONCAT(a.serie, a.rg) as animal,
      a.raca,
      a.idade_anos,
      i.touro,
      i.tecnico,
      i.protocolo,
      i.status_gestacao,
      i.observacoes,
      CASE 
        WHEN i.status_gestacao = 'Prenha' THEN 'Prenha'
        WHEN i.status_gestacao = 'Vazia' THEN 'Vazia'
        WHEN i.status_gestacao = 'Aguardando DG' THEN 'Aguardando DG'
        ELSE 'Pendente'
      END as status
    FROM inseminacoes i
    INNER JOIN animais a ON a.id = i.animal_id
    WHERE i.${iaDateCol} >= $1 AND i.${iaDateCol} <= $2
      AND a.sexo = 'Fêmea'
    ORDER BY i.${iaDateCol} DESC, a.serie, a.rg
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const prenhas = rows.filter(r => r.status_gestacao === 'Prenha').length
  const vazias = rows.filter(r => r.status_gestacao === 'Vazia').length
  const pendentes = rows.filter(r => !r.status_gestacao || r.status_gestacao === 'Aguardando DG').length
  const taxaPrenhez = rows.length > 0 ? ((prenhas / rows.length) * 100).toFixed(1) + '%' : '-'

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Fêmeas que Fizeram IA',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    linhas: [
      { label: 'Prenhas', valor: prenhas },
      { label: 'Vazias', valor: vazias },
      { label: 'Pendentes de DG', valor: pendentes },
      { label: 'Taxa de Prenhez', valor: taxaPrenhez }
    ]
  })

  const sheet = workbook.addWorksheet('Fêmeas que Fizeram IA')

  sheet.mergeCells('A1:J1')
  sheet.getCell('A1').value = '🐄 RELATÓRIO DE FÊMEAS QUE FIZERAM INSEMINAÇÃO ARTIFICIAL'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:J2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data IA', 'Animal', 'Raça', 'Idade (anos)', 'Touro', 'Técnico', 'Protocolo', 'Status Gestação', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  rows.forEach(row => {
    sheet.addRow([
      row.data_inseminacao ? new Date(row.data_inseminacao).toLocaleDateString('pt-BR') : '',
      row.animal || '',
      row.raca || '',
      row.idade_anos || '',
      row.touro || '',
      row.tecnico || '',
      row.protocolo || '',
      row.status || '',
      row.observacoes || ''
    ])
  })

  // Estatísticas resumidas (no rodapé da aba de dados)
  const totalIA = rows.length
  sheet.addRow([])
  sheet.mergeCells(`A${sheet.rowCount + 1}:J${sheet.rowCount + 1}`)
  const statsRow = sheet.addRow(['RESUMO ESTATÍSTICO'])
  statsRow.font = { bold: true, size: 12 }
  statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  
  sheet.addRow(['Total de IAs:', totalIA])
  sheet.addRow(['Prenhas:', prenhas])
  sheet.addRow(['Vazias:', vazias])
  sheet.addRow(['Pendentes de DG:', pendentes])
  if (totalIA > 0) {
    const taxaPrenhez = ((prenhas / totalIA) * 100).toFixed(2)
    sheet.addRow(['Taxa de Prenhez:', `${taxaPrenhez}%`])
  }

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12 // Data
    else if (idx === 1) col.width = 15 // Animal
    else if (idx === 2) col.width = 15 // Raça
    else if (idx === 3) col.width = 12 // Idade
    else if (idx === 4) col.width = 20 // Touro
    else if (idx === 5) col.width = 20 // Técnico
    else if (idx === 6) col.width = 15 // Protocolo
    else if (idx === 7) col.width = 18 // Status
    else col.width = 30 // Observações
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Animais que Entraram nos Piquetes
async function generateAnimaisPiquetesReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      la.id,
      la.piquete,
      la.data_entrada,
      la.data_saida,
      la.motivo_movimentacao,
      la.observacoes,
      la.usuario_responsavel,
      a.id as animal_id,
      CONCAT(a.serie, a.rg) as animal,
      a.raca,
      a.sexo,
      a.idade_anos,
      CASE 
        WHEN la.data_saida IS NULL THEN 'Ativo'
        ELSE 'Finalizado'
      END as status_localizacao
    FROM localizacoes_animais la
    INNER JOIN animais a ON a.id = la.animal_id
    WHERE la.data_entrada >= $1 AND la.data_entrada <= $2
    ORDER BY la.data_entrada DESC, la.piquete, a.serie, a.rg
  `, [pgStart, pgEnd])

  const pesosLatest = await query(`
    SELECT p.animal_id, p.peso, p.ce
    FROM pesagens p
    INNER JOIN (
      SELECT animal_id, MAX(data) AS max_data
      FROM pesagens
      GROUP BY animal_id
    ) m ON m.animal_id = p.animal_id AND p.data = m.max_data
  `)
  const pesoByAnimal = {}
  ;(pesosLatest.rows || []).forEach(r => {
    const peso = r.peso != null ? parseFloat(r.peso) : null
    const ce = r.ce != null ? parseFloat(r.ce) : null
    pesoByAnimal[r.animal_id] = { peso: isNaN(peso) ? null : peso, ce: isNaN(ce) ? null : ce }
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Animais nos Piquetes')

  sheet.mergeCells('A1:L1')
  sheet.getCell('A1').value = '📍 RELATÓRIO DE ANIMAIS QUE ENTRARAM NOS PIQUETES'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:L2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data Entrada', 'Piquete', 'Animal', 'Raça', 'Sexo', 'Idade (anos)', 
    'Peso (kg)', 'CE (cm)', 'Motivo Movimentação', 'Data Saída', 'Status', 'Usuário Responsável', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  result.rows.forEach(row => {
    const m = pesoByAnimal[row.animal_id] || {}
    sheet.addRow([
      row.data_entrada ? new Date(row.data_entrada).toLocaleDateString('pt-BR') : '',
      row.piquete || '',
      row.animal || '',
      row.raca || '',
      row.sexo || '',
      row.idade_anos || '',
      m.peso != null ? m.peso : '',
      m.ce != null ? m.ce : '',
      row.motivo_movimentacao || '',
      row.data_saida ? new Date(row.data_saida).toLocaleDateString('pt-BR') : 'Ainda no piquete',
      row.status_localizacao || '',
      row.usuario_responsavel || '',
      row.observacoes || ''
    ])
  })

  // Estatísticas resumidas por piquete
  const piquetesStats = {}
  result.rows.forEach(row => {
    const piquete = row.piquete || 'Não informado'
    if (!piquetesStats[piquete]) {
      piquetesStats[piquete] = { total: 0, ativos: 0, finalizados: 0, machos: 0, femeas: 0, pesoSum: 0, pesoCount: 0, pesoMin: Infinity, pesoMax: -Infinity, ceSum: 0, ceCount: 0 }
    }
    piquetesStats[piquete].total++
    if (row.status_localizacao === 'Ativo') {
      piquetesStats[piquete].ativos++
    } else {
      piquetesStats[piquete].finalizados++
    }
    if ((row.sexo || '').toLowerCase().startsWith('m')) piquetesStats[piquete].machos++
    else if ((row.sexo || '').toLowerCase().startsWith('f')) piquetesStats[piquete].femeas++
    const m = pesoByAnimal[row.animal_id] || {}
    if (m.peso != null) {
      piquetesStats[piquete].pesoSum += m.peso
      piquetesStats[piquete].pesoCount++
      if (m.peso < piquetesStats[piquete].pesoMin) piquetesStats[piquete].pesoMin = m.peso
      if (m.peso > piquetesStats[piquete].pesoMax) piquetesStats[piquete].pesoMax = m.peso
    }
    if (m.ce != null) {
      piquetesStats[piquete].ceSum += m.ce
      piquetesStats[piquete].ceCount++
    }
  })

  sheet.addRow([])
  sheet.mergeCells(`A${sheet.rowCount + 1}:N${sheet.rowCount + 1}`)
  const statsRow = sheet.addRow(['RESUMO POR PIQUETE'])
  statsRow.font = { bold: true, size: 12 }
  statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  
  sheet.addRow(['Piquete', 'Fêmea', 'Macho', 'Total', 'Média Peso', 'Peso Min', 'Peso Max', 'Média CE', 'Ativos', 'Finalizados'])
  Object.keys(piquetesStats).sort().forEach(piquete => {
    const stats = piquetesStats[piquete]
    const mediaPeso = stats.pesoCount > 0 ? (stats.pesoSum / stats.pesoCount) : null
    const mediaCE = stats.ceCount > 0 ? (stats.ceSum / stats.ceCount) : null
    sheet.addRow([
      piquete,
      stats.femeas,
      stats.machos,
      stats.total,
      mediaPeso != null ? Number(mediaPeso.toFixed(1)) : '',
      stats.pesoCount > 0 ? Number(stats.pesoMin.toFixed(1)) : '',
      stats.pesoCount > 0 ? Number(stats.pesoMax.toFixed(1)) : '',
      mediaCE != null ? Number(mediaCE.toFixed(1)) : '',
      stats.ativos,
      stats.finalizados
    ])
  })

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12
    else if (idx === 1) col.width = 15
    else if (idx === 2) col.width = 15
    else if (idx === 3) col.width = 15
    else if (idx === 4) col.width = 10
    else if (idx === 5) col.width = 12
    else if (idx === 6) col.width = 10
    else if (idx === 7) col.width = 10
    else if (idx === 8) col.width = 20
    else if (idx === 9) col.width = 12
    else if (idx === 10) col.width = 12
    else if (idx === 11) col.width = 20
    else col.width = 30
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Pesagens
async function generatePesagensReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      p.id,
      p.animal_id,
      p.peso,
      p.ce,
      p.data,
      p.observacoes,
      p.created_at,
      a.serie,
      a.rg,
      a.sexo,
      a.raca,
      la.piquete
    FROM pesagens p
    LEFT JOIN animais a ON a.id = p.animal_id
    LEFT JOIN LATERAL (
      SELECT l.piquete
      FROM localizacoes_animais l
      WHERE l.animal_id = p.animal_id
        AND (l.data_saida IS NULL OR l.data_saida >= p.data)
      ORDER BY l.data_entrada DESC
      LIMIT 1
    ) la ON TRUE
    WHERE p.data >= $1 AND p.data <= $2
    ORDER BY p.data DESC, a.serie, a.rg
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const animaisUnicos = new Set(rows.map(r => r.animal_id)).size
  const machos = rows.filter(r => (r.sexo || '').toLowerCase().startsWith('m')).length
  const femeas = rows.filter(r => (r.sexo || '').toLowerCase().startsWith('f')).length
  const pesos = rows.map(r => parseFloat(r.peso)).filter(n => !isNaN(n))
  const ces = rows.map(r => r.ce != null ? parseFloat(r.ce) : null).filter(n => n != null && !isNaN(n))
  const pesoMedio = pesos.length ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : '-'
  const pesoMin = pesos.length ? Math.min(...pesos).toFixed(1) : '-'
  const pesoMax = pesos.length ? Math.max(...pesos).toFixed(1) : '-'
  const ceMedio = ces.length ? (ces.reduce((a, b) => a + b, 0) / ces.length).toFixed(1) : '-'
  const piquetesDistintos = new Set(rows.map(r => r.piquete || 'Não informado')).size

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Pesagens',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    corPrimaria: '059669',
    linhas: [
      { label: 'Animais únicos', valor: animaisUnicos },
      { label: 'Machos', valor: machos },
      { label: 'Fêmeas', valor: femeas },
      { label: 'Piquetes distintos', valor: piquetesDistintos },
      { label: 'Peso médio (kg)', valor: pesoMedio },
      { label: 'Peso mínimo (kg)', valor: pesoMin },
      { label: 'Peso máximo (kg)', valor: pesoMax },
      { label: 'CE média (cm)', valor: ceMedio }
    ]
  })

  const sheet = workbook.addWorksheet('Pesagens')
  sheet.mergeCells('A1:H1')
  sheet.getCell('A1').value = '⚖️ RELATÓRIO DE PESAGENS'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:H2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow(['Data', 'Animal', 'Sexo', 'Raça', 'Piquete', 'Peso (kg)', 'CE (cm)', 'Observações'])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  rows.forEach(r => {
    const piqueteExibir = r.piquete || extrairLocalObservacoes(r.observacoes) || ''
    sheet.addRow([
      r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '',
      `${r.serie || ''}${r.rg || ''}`,
      r.sexo || '',
      r.raca || '',
      piqueteExibir,
      r.peso != null ? Number(parseFloat(r.peso).toFixed(1)) : '',
      r.ce != null ? Number(parseFloat(r.ce).toFixed(1)) : '',
      r.observacoes || ''
    ])
  })

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12
    else if (idx === 1) col.width = 16
    else if (idx === 2) col.width = 10
    else if (idx === 3) col.width = 14
    else if (idx === 4) col.width = 14
    else if (idx === 5) col.width = 10
    else if (idx === 6) col.width = 10
    else col.width = 30
  })

  // Resumo por piquete
  const sheetResumo = workbook.addWorksheet('Resumo por Piquete')
  sheetResumo.mergeCells('A1:I1')
  sheetResumo.getCell('A1').value = '📍 RESUMO DE PESAGENS POR PIQUETE'
  sheetResumo.getCell('A1').font = { size: 14, bold: true }
  sheetResumo.getCell('A1').alignment = { horizontal: 'center' }

  // Usar última pesagem de cada animal (igual ao dashboard) + piquete de localizacoes OU observações
  const porAnimalUltimaPesagens = {}
  rows.forEach(r => {
    const aid = r.animal_id
    if (!aid) return
    const d = r.data || ''
    const prev = porAnimalUltimaPesagens[aid]
    if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (r.id || 0) > (prev.id || 0))) {
      porAnimalUltimaPesagens[aid] = r
    }
  })
  const rowsUltimaPesagens = Object.values(porAnimalUltimaPesagens)

  const porPiquete = {}
  rowsUltimaPesagens.forEach(r => {
    const piqueteBruto = r.piquete || extrairLocalObservacoes(r.observacoes) || 'Não informado'
    const p = normalizarPiqueteParaAgrupamento(piqueteBruto)
    if (!porPiquete[p]) porPiquete[p] = { total: 0, machos: 0, femeas: 0, pesos: [], ces: [] }
    porPiquete[p].total++
    if ((r.sexo || '').toLowerCase().startsWith('m')) porPiquete[p].machos++
    else if ((r.sexo || '').toLowerCase().startsWith('f')) porPiquete[p].femeas++
    if (r.peso != null) {
      const val = parseFloat(r.peso)
      if (!isNaN(val)) porPiquete[p].pesos.push(val)
    }
    if (r.ce != null) {
      const val = parseFloat(r.ce)
      if (!isNaN(val)) porPiquete[p].ces.push(val)
    }
  })

  const headerResumo = sheetResumo.addRow(['Piquete', 'Fêmeas', 'Machos', 'Total', 'Média Peso', 'Peso Min', 'Peso Max', 'Média CE'])
  headerResumo.font = { bold: true }
  headerResumo.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  })

  Object.keys(porPiquete).sort().forEach(p => {
    const stats = porPiquete[p]
    const mediaPeso = stats.pesos.length ? (stats.pesos.reduce((a, b) => a + b, 0) / stats.pesos.length) : null
    const pesoMinV = stats.pesos.length ? Math.min(...stats.pesos) : null
    const pesoMaxV = stats.pesos.length ? Math.max(...stats.pesos) : null
    const mediaCE = stats.ces.length ? (stats.ces.reduce((a, b) => a + b, 0) / stats.ces.length) : null
    sheetResumo.addRow([
      p,
      stats.femeas,
      stats.machos,
      stats.total,
      mediaPeso != null ? Number(mediaPeso.toFixed(1)) : '',
      pesoMinV != null ? Number(pesoMinV.toFixed(1)) : '',
      pesoMaxV != null ? Number(pesoMaxV.toFixed(1)) : '',
      mediaCE != null ? Number(mediaCE.toFixed(1)) : ''
    ])
  })

  sheetResumo.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 18
    else if (idx <= 3) col.width = 10
    else col.width = 12
  })

  const sheetGraficos = workbook.addWorksheet('Gráficos Pesagens')
  const canvas = new ChartJSNodeCanvas({ width: 900, height: 450, backgroundColour: 'white' })
  const sexoChartBuffer = await canvas.renderToBuffer({
    type: 'pie',
    data: {
      labels: ['Fêmeas', 'Machos'],
      datasets: [{ data: [femeas, machos], backgroundColor: ['#ec4899', '#3b82f6'] }]
    }
  })
  const sexoImageId = workbook.addImage({ buffer: sexoChartBuffer, extension: 'png' })
  sheetGraficos.addImage(sexoImageId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 900, height: 450 } })

  const piqueteLabels = Object.keys(porPiquete)
  const piqueteCounts = piqueteLabels.map(l => porPiquete[l].total)
  const piqueteChartBuffer = await canvas.renderToBuffer({
    type: 'bar',
    data: {
      labels: piqueteLabels,
      datasets: [{ label: 'Total por Piquete', data: piqueteCounts, backgroundColor: '#10b981' }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false } } }
    }
  })
  const piqueteImageId = workbook.addImage({ buffer: piqueteChartBuffer, extension: 'png' })
  sheetGraficos.addImage(piqueteImageId, { tl: { col: 0.2, row: 18 }, ext: { width: 900, height: 450 } })

  // Tendência de peso médio por dia (geral, machos, fêmeas)
  const dailyAgg = {}
  rows.forEach(r => {
    const dstr = r.data ? new Date(r.data).toISOString().split('T')[0] : null
    const peso = r.peso != null ? parseFloat(r.peso) : null
    if (!dstr || peso == null || isNaN(peso)) return
    if (!dailyAgg[dstr]) dailyAgg[dstr] = { sum: 0, count: 0, sumM: 0, countM: 0, sumF: 0, countF: 0 }
    dailyAgg[dstr].sum += peso
    dailyAgg[dstr].count++
    const isM = (r.sexo || '').toLowerCase().startsWith('m')
    const isF = (r.sexo || '').toLowerCase().startsWith('f')
    if (isM) { dailyAgg[dstr].sumM += peso; dailyAgg[dstr].countM++ }
    if (isF) { dailyAgg[dstr].sumF += peso; dailyAgg[dstr].countF++ }
  })
  const dailyLabels = Object.keys(dailyAgg).sort()
  const dailyAvg = dailyLabels.map(d => dailyAgg[d].count ? (dailyAgg[d].sum / dailyAgg[d].count) : null)
  const dailyAvgM = dailyLabels.map(d => dailyAgg[d].countM ? (dailyAgg[d].sumM / dailyAgg[d].countM) : null)
  const dailyAvgF = dailyLabels.map(d => dailyAgg[d].countF ? (dailyAgg[d].sumF / dailyAgg[d].countF) : null)
  const tendenciaBuffer = await canvas.renderToBuffer({
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [
        { label: 'Média Geral', data: dailyAvg, borderColor: '#0ea5e9', backgroundColor: '#0ea5e9', tension: 0.3 },
        { label: 'Média Machos', data: dailyAvgM, borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.3 },
        { label: 'Média Fêmeas', data: dailyAvgF, borderColor: '#ec4899', backgroundColor: '#ec4899', tension: 0.3 }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { ticks: { autoSkip: true } } } }
  })
  const tendenciaImageId = workbook.addImage({ buffer: tendenciaBuffer, extension: 'png' })
  sheetGraficos.addImage(tendenciaImageId, { tl: { col: 0.2, row: 36 }, ext: { width: 900, height: 450 } })

  // Histograma de pesos
  const pesoVals = rows.map(r => r.peso != null ? parseFloat(r.peso) : null).filter(v => v != null && !isNaN(v))
  const minPeso = pesoVals.length ? Math.min(...pesoVals) : 0
  const maxPeso = pesoVals.length ? Math.max(...pesoVals) : 0
  const binCount = 10
  const range = Math.max(maxPeso - minPeso, 1)
  const binSize = range / binCount
  const bins = Array(binCount).fill(0)
  const binLabels = Array(binCount).fill(0).map((_, i) => {
    const start = (minPeso + i * binSize)
    const end = (minPeso + (i + 1) * binSize)
    return `${Math.round(start)}-${Math.round(end)}`
  })
  pesoVals.forEach(v => {
    let idx = Math.floor((v - minPeso) / binSize)
    if (idx < 0) idx = 0
    if (idx >= binCount) idx = binCount - 1
    bins[idx]++
  })
  const histBuffer = await canvas.renderToBuffer({
    type: 'bar',
    data: { labels: binLabels, datasets: [{ label: 'Distribuição de Peso (bins)', data: bins, backgroundColor: '#f59e0b' }] },
    options: { plugins: { legend: { display: false } } }
  })
  const histImageId = workbook.addImage({ buffer: histBuffer, extension: 'png' })
  sheetGraficos.addImage(histImageId, { tl: { col: 0.2, row: 54 }, ext: { width: 900, height: 450 } })

  // Scatter CE vs Peso (machos)
  const machosScatter = rows
    .filter(r => (r.sexo || '').toLowerCase().startsWith('m') && r.peso != null && r.ce != null)
    .map(r => ({ x: parseFloat(r.ce), y: parseFloat(r.peso) }))
  if (machosScatter.length > 0) {
    const scatterBuffer = await canvas.renderToBuffer({
      type: 'scatter',
      data: { datasets: [{ label: 'Machos: CE vs Peso', data: machosScatter, backgroundColor: '#22c55e' }] },
      options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { title: { display: true, text: 'CE (cm)' } }, y: { title: { display: true, text: 'Peso (kg)' } } } }
    })
    const scatterImageId = workbook.addImage({ buffer: scatterBuffer, extension: 'png' })
    sheetGraficos.addImage(scatterImageId, { tl: { col: 0.2, row: 72 }, ext: { width: 900, height: 450 } })
  }

  // Tabelas extras: Tendência por dia e Top Pesos
  const sheetTendencia = workbook.addWorksheet('Tendência por Dia')
  sheetTendencia.addRow(['Data', 'Média Geral', 'Média Machos', 'Média Fêmeas']).font = { bold: true }
  dailyLabels.forEach((d, i) => {
    sheetTendencia.addRow([
      d,
      dailyAvg[i] != null ? Number(dailyAvg[i].toFixed(1)) : '',
      dailyAvgM[i] != null ? Number(dailyAvgM[i].toFixed(1)) : '',
      dailyAvgF[i] != null ? Number(dailyAvgF[i].toFixed(1)) : ''
    ])
  })
  sheetTendencia.columns.forEach((col, idx) => { if (idx === 0) col.width = 12; else col.width = 14 })

  const sheetTop = workbook.addWorksheet('Top Pesos (Top 20)')
  sheetTop.addRow(['Data', 'Animal', 'Sexo', 'Raça', 'Piquete', 'Peso (kg)', 'CE (cm)']).font = { bold: true }
  const topRows = [...rows].sort((a, b) => (parseFloat(b.peso || 0) - parseFloat(a.peso || 0))).slice(0, 20)
  topRows.forEach(r => {
    sheetTop.addRow([
      r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '',
      `${r.serie || ''}${r.rg || ''}`,
      r.sexo || '',
      r.raca || '',
      r.piquete || '',
      r.peso != null ? Number(parseFloat(r.peso).toFixed(1)) : '',
      r.ce != null ? Number(parseFloat(r.ce).toFixed(1)) : ''
    ])
  })
  sheetTop.columns.forEach((col, idx) => { if (idx === 0) col.width = 12; else if (idx === 1) col.width = 16; else col.width = 12 })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Resumo de Pesagens (por sexo e por piquete)
async function generateResumoPesagensReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      p.id,
      p.animal_id,
      p.peso,
      p.ce,
      p.data,
      p.observacoes,
      a.sexo,
      a.raca,
      a.serie,
      a.rg,
      la.piquete
    FROM pesagens p
    LEFT JOIN animais a ON a.id = p.animal_id
    LEFT JOIN LATERAL (
      SELECT l.piquete
      FROM localizacoes_animais l
      WHERE l.animal_id = p.animal_id
        AND (l.data_saida IS NULL OR l.data_saida >= p.data)
      ORDER BY l.data_entrada DESC
      LIMIT 1
    ) la ON TRUE
    WHERE p.data >= $1 AND p.data <= $2
    ORDER BY p.data DESC
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const animaisUnicos = new Set(rows.map(r => r.animal_id)).size
  const machos = rows.filter(r => (r.sexo || '').toLowerCase().startsWith('m'))
  const femeas = rows.filter(r => (r.sexo || '').toLowerCase().startsWith('f'))
  const pesos = rows.map(r => parseFloat(r.peso)).filter(n => !isNaN(n))
  const ces = rows.map(r => r.ce != null ? parseFloat(r.ce) : null).filter(n => n != null && !isNaN(n))

  const workbook = new ExcelJS.Workbook()
  
  // Dashboard com cards coloridos e estatísticas visuais
  const sheetDashboard = workbook.addWorksheet('📊 Dashboard')
  sheetDashboard.mergeCells('A1:H1')
  sheetDashboard.getCell('A1').value = '📊 DASHBOARD DE PESAGENS'
  sheetDashboard.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
  sheetDashboard.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getRow(1).height = 35

  sheetDashboard.mergeCells('A2:H2')
  sheetDashboard.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheetDashboard.getCell('A2').font = { size: 12, italic: true }
  sheetDashboard.getCell('A2').alignment = { horizontal: 'center' }
  sheetDashboard.getRow(2).height = 25

  // Cards coloridos com estatísticas principais
  const pesoMedio = pesos.length ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : '0'
  const ceMedio = ces.length ? (ces.reduce((a, b) => a + b, 0) / ces.length).toFixed(1) : '0'
  const pesoMin = pesos.length ? Math.min(...pesos).toFixed(1) : '0'
  const pesoMax = pesos.length ? Math.max(...pesos).toFixed(1) : '0'

  // Card 1: Total de Registros (Verde)
  sheetDashboard.mergeCells('A4:B5')
  sheetDashboard.getCell('A4').value = '📝 TOTAL DE REGISTROS'
  sheetDashboard.getCell('A4').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
  sheetDashboard.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('A4').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('A6:B7')
  sheetDashboard.getCell('A6').value = rows.length
  sheetDashboard.getCell('A6').font = { size: 28, bold: true, color: { argb: '10B981' } }
  sheetDashboard.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('A6').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 2: Animais Únicos (Azul)
  sheetDashboard.mergeCells('C4:D5')
  sheetDashboard.getCell('C4').value = '🐄 ANIMAIS ÚNICOS'
  sheetDashboard.getCell('C4').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('C4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
  sheetDashboard.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('C4').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('C6:D7')
  sheetDashboard.getCell('C6').value = animaisUnicos
  sheetDashboard.getCell('C6').font = { size: 28, bold: true, color: { argb: '3B82F6' } }
  sheetDashboard.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('C6').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 3: Machos (Azul escuro)
  sheetDashboard.mergeCells('E4:F5')
  sheetDashboard.getCell('E4').value = '♂️ MACHOS'
  sheetDashboard.getCell('E4').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }
  sheetDashboard.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('E4').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('E6:F7')
  sheetDashboard.getCell('E6').value = machos.length
  sheetDashboard.getCell('E6').font = { size: 28, bold: true, color: { argb: '2563EB' } }
  sheetDashboard.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('E6').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 4: Fêmeas (Rosa)
  sheetDashboard.mergeCells('G4:H5')
  sheetDashboard.getCell('G4').value = '♀️ FÊMEAS'
  sheetDashboard.getCell('G4').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } }
  sheetDashboard.getCell('G4').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('G4').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('G6:H7')
  sheetDashboard.getCell('G6').value = femeas.length
  sheetDashboard.getCell('G6').font = { size: 28, bold: true, color: { argb: 'EC4899' } }
  sheetDashboard.getCell('G6').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('G6').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 5: Peso Médio (Âmbar)
  sheetDashboard.mergeCells('A9:B10')
  sheetDashboard.getCell('A9').value = '⚖️ PESO MÉDIO (kg)'
  sheetDashboard.getCell('A9').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } }
  sheetDashboard.getCell('A9').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('A9').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('A11:B12')
  sheetDashboard.getCell('A11').value = pesoMedio
  sheetDashboard.getCell('A11').font = { size: 28, bold: true, color: { argb: 'F59E0B' } }
  sheetDashboard.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('A11').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 6: CE Média (Roxo)
  sheetDashboard.mergeCells('C9:D10')
  sheetDashboard.getCell('C9').value = '📏 CE MÉDIA (cm)'
  sheetDashboard.getCell('C9').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('C9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
  sheetDashboard.getCell('C9').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('C9').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('C11:D12')
  sheetDashboard.getCell('C11').value = ceMedio
  sheetDashboard.getCell('C11').font = { size: 28, bold: true, color: { argb: '8B5CF6' } }
  sheetDashboard.getCell('C11').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('C11').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 7: Peso Mínimo (Vermelho)
  sheetDashboard.mergeCells('E9:F10')
  sheetDashboard.getCell('E9').value = '⬇️ PESO MÍNIMO (kg)'
  sheetDashboard.getCell('E9').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('E9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } }
  sheetDashboard.getCell('E9').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('E9').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('E11:F12')
  sheetDashboard.getCell('E11').value = pesoMin
  sheetDashboard.getCell('E11').font = { size: 28, bold: true, color: { argb: 'EF4444' } }
  sheetDashboard.getCell('E11').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('E11').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  // Card 8: Peso Máximo (Verde escuro)
  sheetDashboard.mergeCells('G9:H10')
  sheetDashboard.getCell('G9').value = '⬆️ PESO MÁXIMO (kg)'
  sheetDashboard.getCell('G9').font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
  sheetDashboard.getCell('G9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }
  sheetDashboard.getCell('G9').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('G9').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }
  sheetDashboard.mergeCells('G11:H12')
  sheetDashboard.getCell('G11').value = pesoMax
  sheetDashboard.getCell('G11').font = { size: 28, bold: true, color: { argb: '059669' } }
  sheetDashboard.getCell('G11').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetDashboard.getCell('G11').border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} }

  sheetDashboard.columns.forEach(col => { col.width = 15 })

  const sheetSexo = workbook.addWorksheet('♂️♀️ Por Sexo')
  sheetSexo.mergeCells('A1:G1')
  sheetSexo.getCell('A1').value = '⚖️ RESUMO DE PESAGENS POR SEXO'
  sheetSexo.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
  sheetSexo.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } }
  sheetSexo.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetSexo.getRow(1).height = 30

  const headerSexo = sheetSexo.addRow(['Sexo', 'Qtde', 'Média Peso', 'Peso Mín', 'Peso Máx', 'Média CE'])
  headerSexo.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
  headerSexo.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: {style:'thin', color: {argb:'FFFFFF'}},
      left: {style:'thin', color: {argb:'FFFFFF'}},
      bottom: {style:'thin', color: {argb:'FFFFFF'}},
      right: {style:'thin', color: {argb:'FFFFFF'}}
    }
  })
  sheetSexo.getRow(2).height = 25

  const calcStats = (arr) => {
    const p = arr.map(x => parseFloat(x.peso)).filter(n => !isNaN(n))
    const c = arr.map(x => x.ce != null ? parseFloat(x.ce) : null).filter(n => n != null && !isNaN(n))
    const mediaPeso = p.length ? (p.reduce((a, b) => a + b, 0) / p.length) : null
    const minPeso = p.length ? Math.min(...p) : null
    const maxPeso = p.length ? Math.max(...p) : null
    const mediaCE = c.length ? (c.reduce((a, b) => a + b, 0) / c.length) : null
    return { qtde: arr.length, mediaPeso, minPeso, maxPeso, mediaCE }
  }
  const mStats = calcStats(machos)
  const fStats = calcStats(femeas)
  
  // Linha Fêmeas (Rosa)
  const rowF = sheetSexo.addRow(['♀️ Fêmea', fStats.qtde, fStats.mediaPeso != null ? Number(fStats.mediaPeso.toFixed(1)) : '', fStats.minPeso != null ? Number(fStats.minPeso.toFixed(1)) : '', fStats.maxPeso != null ? Number(fStats.maxPeso.toFixed(1)) : '', fStats.mediaCE != null ? Number(fStats.mediaCE.toFixed(1)) : ''])
  rowF.font = { bold: true, size: 11 }
  rowF.eachCell((cell, colNum) => {
    if (colNum === 1) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } }
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } }
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE7F3' } }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: {style:'thin', color: {argb:'EC4899'}},
      left: {style:'thin', color: {argb:'EC4899'}},
      bottom: {style:'thin', color: {argb:'EC4899'}},
      right: {style:'thin', color: {argb:'EC4899'}}
    }
  })
  sheetSexo.getRow(3).height = 25

  // Linha Machos (Azul)
  const rowM = sheetSexo.addRow(['♂️ Macho', mStats.qtde, mStats.mediaPeso != null ? Number(mStats.mediaPeso.toFixed(1)) : '', mStats.minPeso != null ? Number(mStats.minPeso.toFixed(1)) : '', mStats.maxPeso != null ? Number(mStats.maxPeso.toFixed(1)) : '', mStats.mediaCE != null ? Number(mStats.mediaCE.toFixed(1)) : ''])
  rowM.font = { bold: true, size: 11 }
  rowM.eachCell((cell, colNum) => {
    if (colNum === 1) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } }
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: {style:'thin', color: {argb:'3B82F6'}},
      left: {style:'thin', color: {argb:'3B82F6'}},
      bottom: {style:'thin', color: {argb:'3B82F6'}},
      right: {style:'thin', color: {argb:'3B82F6'}}
    }
  })
  sheetSexo.getRow(4).height = 25

  sheetSexo.columns.forEach((col, idx) => { if (idx === 0) col.width = 14; else col.width = 14 })

  const sheetPiquete = workbook.addWorksheet('📍 Por Piquete')
  sheetPiquete.mergeCells('A1:I1')
  sheetPiquete.getCell('A1').value = '🏆 RESUMO DE PESAGENS POR PIQUETE'
  sheetPiquete.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
  sheetPiquete.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
  sheetPiquete.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetPiquete.getRow(1).height = 30

  const headerPiq = sheetPiquete.addRow(['Piquete', 'Fêmeas', 'Machos', 'Total', 'Média Peso', 'Peso Min', 'Peso Max', 'Média CE'])
  headerPiq.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
  headerPiq.eachCell(cell => { 
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: {style:'thin', color: {argb:'FFFFFF'}},
      left: {style:'thin', color: {argb:'FFFFFF'}},
      bottom: {style:'thin', color: {argb:'FFFFFF'}},
      right: {style:'thin', color: {argb:'FFFFFF'}}
    }
  })
  sheetPiquete.getRow(2).height = 25

  // Usar última pesagem de cada animal (igual ao dashboard) + piquete de localizacoes OU observações
  const porAnimalUltima = {}
  rows.forEach(r => {
    const aid = r.animal_id
    if (!aid) return
    const d = r.data || ''
    const prev = porAnimalUltima[aid]
    if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (r.id || 0) > (prev.id || 0))) {
      porAnimalUltima[aid] = r
    }
  })
  const rowsUltima = Object.values(porAnimalUltima)

  const porPiquete = {}
  rowsUltima.forEach(r => {
    const piqueteBruto = r.piquete || extrairLocalObservacoes(r.observacoes) || 'Não informado'
    const p = normalizarPiqueteParaAgrupamento(piqueteBruto)
    if (!porPiquete[p]) porPiquete[p] = { total: 0, machos: 0, femeas: 0, pesos: [], ces: [] }
    porPiquete[p].total++
    if ((r.sexo || '').toLowerCase().startsWith('m')) porPiquete[p].machos++
    else if ((r.sexo || '').toLowerCase().startsWith('f')) porPiquete[p].femeas++
    if (r.peso != null) {
      const val = parseFloat(r.peso)
      if (!isNaN(val)) porPiquete[p].pesos.push(val)
    }
    if (r.ce != null) {
      const val = parseFloat(r.ce)
      if (!isNaN(val)) porPiquete[p].ces.push(val)
    }
  })

  // Ordenar piquetes por total (para medalhas)
  const piquetesOrdenados = Object.keys(porPiquete).sort((a, b) => porPiquete[b].total - porPiquete[a].total)
  
  let totalFemeas = 0, totalMachos = 0, totalGeral = 0
  let somaMediasPeso = 0, countMediasPeso = 0
  let somaMediasCE = 0, countMediasCE = 0
  let pesoMinGeral = null, pesoMaxGeral = null

  piquetesOrdenados.forEach((p, idx) => {
    const stats = porPiquete[p]
    const mediaPeso = stats.pesos.length ? (stats.pesos.reduce((a, b) => a + b, 0) / stats.pesos.length) : null
    const pesoMinV = stats.pesos.length ? Math.min(...stats.pesos) : null
    const pesoMaxV = stats.pesos.length ? Math.max(...stats.pesos) : null
    const mediaCE = stats.ces.length ? (stats.ces.reduce((a, b) => a + b, 0) / stats.ces.length) : null
    
    // Acumular totais
    totalFemeas += stats.femeas
    totalMachos += stats.machos
    totalGeral += stats.total
    if (mediaPeso != null) { somaMediasPeso += mediaPeso; countMediasPeso++ }
    if (mediaCE != null) { somaMediasCE += mediaCE; countMediasCE++ }
    if (pesoMinV != null) {
      pesoMinGeral = pesoMinGeral == null ? pesoMinV : Math.min(pesoMinGeral, pesoMinV)
    }
    if (pesoMaxV != null) {
      pesoMaxGeral = pesoMaxGeral == null ? pesoMaxV : Math.max(pesoMaxGeral, pesoMaxV)
    }

    // Adicionar medalhas para top 3
    let nomePiquete = p
    if (idx === 0) nomePiquete = `🥇 ${p}`
    else if (idx === 1) nomePiquete = `🥈 ${p}`
    else if (idx === 2) nomePiquete = `🥉 ${p}`

    const row = sheetPiquete.addRow([
      nomePiquete,
      stats.femeas,
      stats.machos,
      stats.total,
      mediaPeso != null ? Number(mediaPeso.toFixed(1)) : '',
      pesoMinV != null ? Number(pesoMinV.toFixed(1)) : '',
      pesoMaxV != null ? Number(pesoMaxV.toFixed(1)) : '',
      mediaCE != null ? Number(mediaCE.toFixed(1)) : ''
    ])

    // Linhas alternadas (zebra)
    const bgColor = idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF'
    row.eachCell((cell, colNum) => {
      if (colNum === 1) {
        cell.font = { bold: true, size: 11 }
        if (idx < 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
        }
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: {style:'thin', color: {argb:'D1D5DB'}},
        left: {style:'thin', color: {argb:'D1D5DB'}},
        bottom: {style:'thin', color: {argb:'D1D5DB'}},
        right: {style:'thin', color: {argb:'D1D5DB'}}
      }
    })
    row.height = 22
  })

  // Linha de totais
  const rowTotal = sheetPiquete.addRow([
    '📊 TOTAIS',
    totalFemeas,
    totalMachos,
    totalGeral,
    countMediasPeso > 0 ? Number((somaMediasPeso / countMediasPeso).toFixed(1)) : '',
    pesoMinGeral != null ? Number(pesoMinGeral.toFixed(1)) : '',
    pesoMaxGeral != null ? Number(pesoMaxGeral.toFixed(1)) : '',
    countMediasCE > 0 ? Number((somaMediasCE / countMediasCE).toFixed(1)) : ''
  ])
  rowTotal.font = { bold: true, size: 12, color: { argb: '000000' } }
  rowTotal.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FDE047' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: {style:'thick', color: {argb:'000000'}},
      left: {style:'thick', color: {argb:'000000'}},
      bottom: {style:'thick', color: {argb:'000000'}},
      right: {style:'thick', color: {argb:'000000'}}
    }
  })
  rowTotal.height = 28

  sheetPiquete.columns.forEach((col, idx) => { if (idx === 0) col.width = 22; else col.width = 12 })

  const canvas = new ChartJSNodeCanvas({ width: 900, height: 450, backgroundColour: 'white' })
  const sexoChartBuffer = await canvas.renderToBuffer({
    type: 'pie',
    data: {
      labels: ['Fêmeas', 'Machos'],
      datasets: [{ data: [fStats.qtde || 0, mStats.qtde || 0], backgroundColor: ['#ec4899', '#3b82f6'] }]
    }
  })
  const sexoImageId = workbook.addImage({ buffer: sexoChartBuffer, extension: 'png' })
  sheetSexo.addImage(sexoImageId, { tl: { col: 0.2, row: 5 }, ext: { width: 900, height: 450 } })

  const piqueteLabels = Object.keys(porPiquete)
  const piqueteCounts = piqueteLabels.map(l => porPiquete[l].total)
  const piqueteChartBuffer = await canvas.renderToBuffer({
    type: 'bar',
    data: {
      labels: piqueteLabels,
      datasets: [{ label: 'Total', data: piqueteCounts, backgroundColor: '#10b981' }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false } } }
    }
  })
  const piqueteImageId = workbook.addImage({ buffer: piqueteChartBuffer, extension: 'png' })
  sheetPiquete.addImage(piqueteImageId, { tl: { col: 0.2, row: sheetPiquete.rowCount + 2 }, ext: { width: 900, height: 450 } })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Coleta FIV
async function generateColetaFivReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      cf.id,
      cf.data_fiv,
      cf.data_transferencia,
      cf.doadora_nome,
      cf.quantidade_oocitos,
      cf.touro,
      cf.laboratorio,
      cf.veterinario,
      cf.observacoes,
      EXISTS (
        SELECT 1 FROM transferencias_embrioes te
        WHERE te.data_te = cf.data_transferencia
          AND (
            (cf.doadora_id IS NOT NULL AND te.doadora_id = cf.doadora_id)
            OR (te.data_fiv IS NOT NULL AND te.data_fiv = cf.data_fiv)
          )
      ) AS te_exists
    FROM coleta_fiv cf
    WHERE cf.data_fiv >= $1 AND cf.data_fiv <= $2
    ORDER BY cf.data_fiv DESC, cf.doadora_nome
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const totalOocitos = rows.reduce((sum, r) => sum + (parseInt(r.quantidade_oocitos) || 0), 0)
  const doadorasUnicas = [...new Set(rows.map(r => r.doadora_nome))].length

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Coleta FIV',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: rows.length,
    linhas: [
      { label: 'Total de coletas', valor: rows.length },
      { label: 'Doadoras únicas', valor: doadorasUnicas },
      { label: 'Total de oócitos', valor: totalOocitos }
    ],
    corPrimaria: '7C3AED'
  })

  const sheet = workbook.addWorksheet('Coleta FIV')

  sheet.mergeCells('A1:K1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = '🧪 RELATÓRIO DE COLETA DE OÓCITOS (FIV)'
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
  titleCell.alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:K2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data FIV', 'Data Transferência', 'Doadora', 'Oócitos', 'Touro', 'Laboratório', 'Veterinário', 'TE Criada', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
    cell.font = { color: { argb: 'FFFFFFFF' } }
  })
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  rows.forEach((row, idx) => {
    const dataRow = sheet.addRow([
      row.data_fiv ? new Date(row.data_fiv).toLocaleDateString('pt-BR') : '',
      row.data_transferencia ? new Date(row.data_transferencia).toLocaleDateString('pt-BR') : '',
      row.doadora_nome || '',
      row.quantidade_oocitos ?? '',
      row.touro || '',
      row.laboratorio || '',
      row.veterinario || '',
      row.te_exists ? 'Sim' : 'Não',
      row.observacoes || ''
    ])
    if (idx % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } }
      })
    }
  })

  sheet.columns.forEach((col, idx) => {
    const widths = [12, 18, 25, 10, 20, 20, 20, 12, 35]
    col.width = widths[idx] || 15
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Calendário Reprodutivo
async function generateCalendarioReprodutivoReport(period, baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/calendario-reprodutivo?data_inicio=${period.startDate}&data_fim=${period.endDate}&limit=5000`)
    if (!res.ok) {
      throw new Error(`Erro ao buscar calendário: ${res.status}`)
    }
    const data = await res.json()
    const eventos = Array.isArray(data) ? data : (data.data || data.eventos || [])
    const eventosOrdenados = [...eventos].sort((a, b) => {
      const dA = a.data_evento || a.data ? new Date(a.data_evento || a.data) : new Date(0)
      const dB = b.data_evento || b.data ? new Date(b.data_evento || b.data) : new Date(0)
      return dB - dA
    })

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Calendário Reprodutivo',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: eventosOrdenados.length,
    linhas: [
      { label: 'Eventos manuais', valor: eventosOrdenados.filter(e => e.origem === 'manual').length },
      { label: 'Eventos receptoras', valor: eventosOrdenados.filter(e => e.origem === 'receptora').length },
      { label: 'Eventos andrológicos', valor: eventosOrdenados.filter(e => e.origem === 'andrologico').length }
    ],
    corPrimaria: 'E11D48'
  })

  const sheet = workbook.addWorksheet('Calendário Reprodutivo')

  sheet.mergeCells('A1:J1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = '📅 CALENDÁRIO REPRODUTIVO'
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }
  titleCell.alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:J2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)} • Gerado em: ${new Date().toLocaleString('pt-BR')}`
  sheet.getCell('A2').font = { size: 10, italic: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headers = ['Data', 'Tipo de Evento', 'Título', 'Animal', 'Tatuagem', 'Status', 'Descrição', 'NF', 'Fornecedor', 'Data TE']
  const headerRow = sheet.addRow(headers)
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }
    cell.font = { color: { argb: 'FFFFFFFF' } }
  })
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  eventosOrdenados.forEach((evento, idx) => {
    const dataEvento = evento.data_evento || evento.data
    const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : ''
    const tipoEvento = evento.tipo_evento || evento.tipo || '-'
    const titulo = evento.titulo || '-'
    const animalNome = evento.animal_nome || evento.animal || (evento.animal_serie && evento.animal_rg ? `${evento.animal_serie}${evento.animal_rg}` : '-')
    const tatuagem = evento.animal_tatuagem || (evento.animal_serie && evento.animal_rg ? `${evento.animal_serie}${evento.animal_rg}` : '-')
    const status = evento.status || 'Agendado'
    const descricao = evento.descricao || '-'
    const numeroNF = evento.numero_nf || '-'
    const fornecedor = evento.fornecedor || '-'
    const dataTE = evento.data_te ? new Date(evento.data_te).toLocaleDateString('pt-BR') : '-'

    const dataRow = sheet.addRow([
      dataFormatada, tipoEvento, titulo, animalNome, tatuagem, status, descricao, numeroNF, fornecedor, dataTE
    ])

    const statusCell = dataRow.getCell(6)
    if (status === 'Concluído' || status === 'Prenha') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } }
      statusCell.font = { color: { argb: 'FFFFFFFF' } }
    } else if (status === 'Vazia') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } }
      statusCell.font = { color: { argb: 'FFFFFFFF' } }
    } else if (status === 'Agendado') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } }
      statusCell.font = { color: { argb: 'FFFFFFFF' } }
    }

    if (idx % 2 === 1) {
      dataRow.eachCell((cell, colNum) => {
        if (colNum !== 6) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF2F8' } }
      })
    }
  })

  sheet.columns.forEach((col, idx) => {
    const widths = [12, 25, 30, 20, 15, 15, 40, 12, 20, 12]
    col.width = widths[idx] || 15
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
  } catch (error) {
    console.error('Erro ao gerar calendário reprodutivo:', error)
    throw error
  }
}

// Gerar relatório de Transferências de Embriões
async function generateTransferenciasEmbrioesReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      te.id,
      te.numero_te,
      te.data_te,
      CONCAT(r.serie, r.rg) as receptora,
      CONCAT(d.serie, d.rg) as doadora,
      CONCAT(t.serie, t.rg) as touro,
      te.local_te,
      te.data_fiv,
      te.raca,
      te.tecnico_responsavel,
      te.status,
      te.resultado,
      te.data_diagnostico,
      te.observacoes
    FROM transferencias_embrioes te
    LEFT JOIN animais r ON r.id = te.receptora_id
    LEFT JOIN animais d ON d.id = te.doadora_id
    LEFT JOIN animais t ON t.id = te.touro_id
    WHERE te.data_te >= $1 AND te.data_te <= $2
    ORDER BY te.data_te DESC
  `, [pgStart, pgEnd])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Transferências de Embriões')

  sheet.mergeCells('A1:O1')
  sheet.getCell('A1').value = '🧪 RELATÓRIO DE TRANSFERÊNCIAS DE EMBRIÕES'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:O2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Nº TE', 'Data TE', 'Receptora', 'Doadora', 'Touro', 'Local TE', 'Data FIV', 
    'Raça', 'Técnico', 'Status', 'Resultado', 'Data Diagnóstico', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '9F7AEA' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  result.rows.forEach(row => {
    sheet.addRow([
      row.numero_te || '',
      row.data_te ? new Date(row.data_te).toLocaleDateString('pt-BR') : '',
      row.receptora || '',
      row.doadora || '',
      row.touro || '',
      row.local_te || '',
      row.data_fiv ? new Date(row.data_fiv).toLocaleDateString('pt-BR') : '',
      row.raca || '',
      row.tecnico_responsavel || '',
      row.status || '',
      row.resultado || '',
      row.data_diagnostico ? new Date(row.data_diagnostico).toLocaleDateString('pt-BR') : '',
      row.observacoes || ''
    ])
  })

  // Estatísticas
  const total = result.rows.length
  const gestantes = result.rows.filter(r => r.resultado === 'Gestante').length
  const vazias = result.rows.filter(r => r.resultado === 'Vazia').length
  const pendentes = result.rows.filter(r => !r.resultado || r.resultado === 'Pendente').length

  sheet.addRow([])
  sheet.mergeCells(`A${sheet.rowCount + 1}:O${sheet.rowCount + 1}`)
  const statsRow = sheet.addRow(['RESUMO ESTATÍSTICO'])
  statsRow.font = { bold: true, size: 12 }
  statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  
  sheet.addRow(['Total de TEs:', total])
  sheet.addRow(['Gestantes:', gestantes])
  sheet.addRow(['Vazias:', vazias])
  sheet.addRow(['Pendentes:', pendentes])
  if (total > 0) {
    const taxaGestacao = ((gestantes / total) * 100).toFixed(2)
    sheet.addRow(['Taxa de Gestação:', `${taxaGestacao}%`])
  }

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12 // Nº TE
    else if (idx === 1) col.width = 12 // Data TE
    else if (idx >= 2 && idx <= 4) col.width = 15 // Receptora, Doadora, Touro
    else if (idx === 5) col.width = 15 // Local
    else if (idx === 6) col.width = 12 // Data FIV
    else if (idx === 7) col.width = 15 // Raça
    else if (idx === 8) col.width = 20 // Técnico
    else if (idx >= 9 && idx <= 11) col.width = 15 // Status, Resultado, Data DG
    else col.width = 30 // Observações
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Gestações
async function generateGestacoesReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      g.id,
      g.data_cobertura,
      g.tipo_cobertura,
      CONCAT(a.serie, a.rg) as animal,
      a.raca,
      g.touro,
      g.situacao,
      g.previsao_parto,
      g.data_parto,
      g.observacoes,
      CASE 
        WHEN g.situacao = 'Em Gestação' THEN 
          EXTRACT(DAYS FROM (CURRENT_DATE - g.data_cobertura::date))
        WHEN g.situacao = 'Nascido' AND g.data_parto IS NOT NULL THEN
          EXTRACT(DAYS FROM (g.data_parto::date - g.data_cobertura::date))
        ELSE NULL
      END as dias_gestacao
    FROM gestacoes g
    LEFT JOIN animais a ON a.id = g.animal_id
    WHERE g.data_cobertura >= $1 AND g.data_cobertura <= $2
    ORDER BY g.data_cobertura DESC
  `, [pgStart, pgEnd])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Gestações')

  sheet.mergeCells('A1:L1')
  sheet.getCell('A1').value = '🤰 RELATÓRIO DE GESTAÇÕES'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:L2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data Cobertura', 'Tipo', 'Animal', 'Raça', 'Touro', 'Situação', 
    'Previsão Parto', 'Data Parto', 'Dias Gestação', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  result.rows.forEach(row => {
    sheet.addRow([
      row.data_cobertura ? new Date(row.data_cobertura).toLocaleDateString('pt-BR') : '',
      row.tipo_cobertura || '',
      row.animal || '',
      row.raca || '',
      row.touro || '',
      row.situacao || '',
      row.previsao_parto ? new Date(row.previsao_parto).toLocaleDateString('pt-BR') : '',
      row.data_parto ? new Date(row.data_parto).toLocaleDateString('pt-BR') : '',
      row.dias_gestacao || '',
      row.observacoes || ''
    ])
  })

  // Estatísticas
  const total = result.rows.length
  const emGestacao = result.rows.filter(r => r.situacao === 'Em Gestação').length
  const nascidos = result.rows.filter(r => r.situacao === 'Nascido').length
  const abortos = result.rows.filter(r => r.situacao === 'Aborto').length

  sheet.addRow([])
  sheet.mergeCells(`A${sheet.rowCount + 1}:L${sheet.rowCount + 1}`)
  const statsRow = sheet.addRow(['RESUMO ESTATÍSTICO'])
  statsRow.font = { bold: true, size: 12 }
  statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  
  sheet.addRow(['Total de Gestações:', total])
  sheet.addRow(['Em Gestação:', emGestacao])
  sheet.addRow(['Nascidos:', nascidos])
  sheet.addRow(['Abortos:', abortos])

  sheet.columns.forEach((col, idx) => {
    if (idx === 0 || idx === 6 || idx === 7) col.width = 12 // Datas
    else if (idx === 1 || idx === 5) col.width = 15 // Tipo, Situação
    else if (idx >= 2 && idx <= 4) col.width = 18 // Animal, Raça, Touro
    else if (idx === 8) col.width = 15 // Dias
    else col.width = 30 // Observações
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Exames Andrológicos
async function generateExamesAndrologicosReport(period) {
  try {
    const pgStart = toPgDate(period?.startDate) || toPgDate(new Date().toISOString().split('T')[0])
    const pgEnd = toPgDate(period?.endDate) || toPgDate(new Date().toISOString().split('T')[0])

    let result = await query(`
      SELECT 
        ea.id,
        ea.data_exame,
        ea.touro as animal,
        ea.rg,
        ea.resultado,
        ea.ce,
        ea.defeitos,
        ea.observacoes
      FROM exames_andrologicos ea
      WHERE ea.data_exame::date >= $1::date AND ea.data_exame::date <= $2::date
      ORDER BY ea.data_exame DESC
    `, [pgStart, pgEnd])

    // Fallback: últimos 12 meses se período não tiver exames
    if (!result?.rows?.length) {
      const hoje = new Date()
      const dozeMesesAtras = new Date(hoje)
      dozeMesesAtras.setMonth(hoje.getMonth() - 12)
      const pgFallbackStart = toPgDate(dozeMesesAtras.toISOString().split('T')[0])
      const pgFallbackEnd = toPgDate(hoje.toISOString().split('T')[0])
      const fallbackResult = await query(`
        SELECT ea.id, ea.data_exame, ea.touro as animal, ea.rg, ea.resultado, ea.ce, ea.defeitos, ea.observacoes
        FROM exames_andrologicos ea
        WHERE ea.data_exame::date >= $1::date AND ea.data_exame::date <= $2::date
        ORDER BY ea.data_exame DESC
      `, [pgFallbackStart, pgFallbackEnd])
      if (fallbackResult?.rows?.length) result = fallbackResult
    }

    const rows = result?.rows || []
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Exames Andrológicos')

    sheet.mergeCells('A1:G1')
    sheet.getCell('A1').value = '🔬 RELATÓRIO DE EXAMES ANDROLÓGICOS'
    sheet.getCell('A1').font = { size: 16, bold: true }
    sheet.getCell('A1').alignment = { horizontal: 'center' }
    sheet.getRow(1).height = 30

    sheet.mergeCells('A2:G2')
    sheet.getCell('A2').value = `Período: ${period?.startDate || ''} até ${period?.endDate || ''}`
    sheet.getCell('A2').font = { size: 12, bold: true }
    sheet.getCell('A2').alignment = { horizontal: 'center' }

    const headerRow = sheet.addRow([
      'Data Exame', 'Touro', 'RG', 'Resultado', 'CE', 'Defeitos', 'Observações'
    ])
    headerRow.font = { bold: true }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '06B6D4' } }
      cell.font = { color: { argb: 'FFFFFF' } }
    })

    rows.forEach(row => {
      sheet.addRow([
        row.data_exame ? new Date(row.data_exame).toLocaleDateString('pt-BR') : '',
        row.animal || row.touro || '',
        row.rg || '',
        row.resultado || '',
        row.ce || '',
        row.defeitos || '',
        row.observacoes || ''
      ])
    })

    const total = rows.length
    const aprovados = rows.filter(r => r.resultado === 'Aprovado' || r.resultado === 'Apto').length
    const reprovados = rows.filter(r => r.resultado === 'Reprovado' || r.resultado === 'Inapto').length

    sheet.addRow([])
    sheet.mergeCells(`A${sheet.rowCount + 1}:L${sheet.rowCount + 1}`)
    const statsRow = sheet.addRow(['RESUMO ESTATÍSTICO'])
    statsRow.font = { bold: true, size: 12 }
    statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
    
    sheet.addRow(['Total de Exames:', total])
    sheet.addRow(['Aprovados:', aprovados])
    sheet.addRow(['Reprovados:', reprovados])
    if (total > 0) {
      const taxaAprovacao = ((aprovados / total) * 100).toFixed(2)
      sheet.addRow(['Taxa de Aprovação:', `${taxaAprovacao}%`])
    }

    sheet.columns.forEach((col, idx) => {
      if (idx === 0) col.width = 12
      else if (idx >= 1 && idx <= 3) col.width = 15
      else if (idx === 4) col.width = 12
      else if (idx === 5) col.width = 25
      else col.width = 30
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  } catch (err) {
    console.error('Erro em generateExamesAndrologicosReport:', err)
    // Retornar Excel mínimo com mensagem de erro para que o anexo seja enviado
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Exames Andrológicos')
    sheet.addRow(['Erro ao gerar relatório de Exames Andrológicos'])
    sheet.addRow([err?.message || String(err)])
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }
}

// Gerar relatório de Resumo Exames Andrológicos (estatísticas)
async function generateResumoExamesAndrologicosReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      ea.id,
      ea.resultado
    FROM exames_andrologicos ea
    WHERE ea.data_exame::date >= $1::date AND ea.data_exame::date <= $2::date
  `, [pgStart, pgEnd])

  const rows = result.rows || []
  const total = rows.length
  const aprovados = rows.filter(r => r.resultado === 'Aprovado' || r.resultado === 'Apto').length
  const reprovados = rows.filter(r => r.resultado === 'Reprovado' || r.resultado === 'Inapto').length
  const pendentes = rows.filter(r => !r.resultado || r.resultado === 'Pendente').length
  const taxaAprovacao = total > 0 ? ((aprovados / total) * 100).toFixed(1) : 0

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Resumo Exames Andrológicos',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: total,
    corPrimaria: '06B6D4',
    linhas: [
      { label: 'Total de Exames', valor: total },
      { label: 'Aprovados/Aptos', valor: aprovados },
      { label: 'Reprovados/Inaptos', valor: reprovados },
      { label: 'Pendentes', valor: pendentes },
      { label: 'Taxa de Aprovação (%)', valor: `${taxaAprovacao}%` }
    ]
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Boletim de Gado
async function generateBoletimGadoReport(period) {
  // Usar API existente de boletim de gado
  const protocol = process.env.NEXTAUTH_URL?.includes('https') ? 'https' : 'http'
  const host = process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') || `localhost:${process.env.PORT || 3020}`
  const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
  
  const res = await fetch(`${baseUrl}/api/contabilidade/boletim-gado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  })
  
  if (!res.ok) {
    throw new Error(`Erro ao gerar boletim de gado: ${res.status}`)
  }
  
  return Buffer.from(await res.arrayBuffer())
}

// Gerar relatório de Movimentações Financeiras
async function generateMovimentacoesFinanceirasReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Buscar receitas (NFs de saída)
  const receitasResult = await query(`
    SELECT 
      SUM(valor_total) as total,
      COUNT(*) as quantidade
    FROM notas_fiscais
    WHERE tipo = 'saida' AND data_compra >= $1 AND data_compra <= $2
  `, [pgStart, pgEnd])

  // Buscar despesas (NFs de entrada)
  const despesasResult = await query(`
    SELECT 
      SUM(valor_total) as total,
      COUNT(*) as quantidade
    FROM notas_fiscais
    WHERE tipo = 'entrada' AND data_compra >= $1 AND data_compra <= $2
  `, [pgStart, pgEnd])

  // Buscar custos de inseminação
  const iaDateCol = await getIADataColumn()
  const custosIA = await query(`
    SELECT SUM(custo_dose) as total
    FROM inseminacoes
    WHERE ${iaDateCol} >= $1 AND ${iaDateCol} <= $2
  `, [pgStart, pgEnd])

  const receitas = parseFloat(receitasResult.rows[0]?.total || 0)
  const despesas = parseFloat(despesasResult.rows[0]?.total || 0)
  const custosIAValor = parseFloat(custosIA.rows[0]?.total || 0)
  const saldo = receitas - despesas - custosIAValor

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Movimentações Financeiras',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: (receitasResult.rows[0]?.quantidade || 0) + (despesasResult.rows[0]?.quantidade || 0) + 1,
    corPrimaria: '10B981',
    linhas: [
      { label: 'Receitas (Vendas):', valor: `R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { label: 'Despesas (Compras):', valor: `R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { label: 'Custos com IA:', valor: `R$ ${custosIAValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { label: 'SALDO LÍQUIDO:', valor: `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
    ]
  })

  const sheet = workbook.addWorksheet('Movimentações Financeiras')

  sheet.mergeCells('A1:D1')
  sheet.getCell('A1').value = '💰 RELATÓRIO DE MOVIMENTAÇÕES FINANCEIRAS'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:D2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  sheet.addRow(['RESUMO FINANCEIRO (detalhado na aba Resumo)'])
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 14 }
  sheet.addRow(['Receitas (Vendas):', `R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`])
  sheet.addRow(['Despesas (Compras):', `R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`])
  sheet.addRow(['Custos com IA:', `R$ ${custosIAValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`])
  sheet.addRow(['SALDO LÍQUIDO:', `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`])
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 }
  sheet.getRow(sheet.rowCount).getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: saldo >= 0 ? 'C6F6D5' : 'FEE2E2' } }

  sheet.addRow([])
  sheet.addRow(['DETALHAMENTO'])
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 14 }

  const headerRow = sheet.addRow(['Tipo', 'Descrição', 'Quantidade', 'Valor Total'])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  sheet.addRow(['Receita', 'Vendas de Animais', receitasResult.rows[0]?.quantidade || 0, receitas])
  sheet.addRow(['Despesa', 'Compras de Animais', despesasResult.rows[0]?.quantidade || 0, despesas])
  sheet.addRow(['Despesa', 'Custos com Inseminação Artificial', '-', custosIAValor])

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 15
    else if (idx === 1) col.width = 30
    else if (idx === 2) col.width = 15
    else col.width = 20
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Estoque de Sêmen
async function generateEstoqueSemenReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Buscar entradas de sêmen
  const entradas = await query(`
    SELECT 
      es.id,
      es.data_compra,
      es.nome_touro,
      es.raca,
      es.quantidade_doses,
      es.custo_dose,
      es.localizacao,
      es.fornecedor,
      es.observacoes
    FROM estoque_semen es
    WHERE es.data_compra >= $1 AND es.data_compra <= $2
    ORDER BY es.data_compra DESC
  `, [pgStart, pgEnd])

  // Buscar saídas de sêmen
  const saidas = await query(`
    SELECT 
      es.nome_touro,
      es.raca,
      SUM(so.quantidade_doses) as total_saidas
    FROM saidas_semen so
    INNER JOIN estoque_semen es ON es.id = so.entrada_id
    WHERE so.data_saida >= $1 AND so.data_saida <= $2
    GROUP BY es.nome_touro, es.raca
    ORDER BY total_saidas DESC
  `, [pgStart, pgEnd])

  const totalEntradas = entradas.rows?.length || 0
  const totalSaidas = saidas.rows?.length || 0
  const somaDosesEntradas = entradas.rows?.reduce((s, r) => s + (r.quantidade_doses || 0), 0) || 0
  const somaDosesSaidas = saidas.rows?.reduce((s, r) => s + (parseFloat(r.total_saidas) || 0), 0) || 0

  const workbook = new ExcelJS.Workbook()
  addResumoSheet(workbook, {
    titulo: 'Estoque de Sêmen',
    periodo: `${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`,
    totalRegistros: totalEntradas + totalSaidas,
    corPrimaria: '3B82F6',
    linhas: [
      { label: 'Registros de Entrada', valor: totalEntradas },
      { label: 'Registros de Saída', valor: totalSaidas },
      { label: 'Total de doses (entradas)', valor: somaDosesEntradas },
      { label: 'Total de doses (saídas)', valor: somaDosesSaidas }
    ]
  })

  // Planilha de Entradas
  const sheetEntradas = workbook.addWorksheet('Entradas')
  sheetEntradas.mergeCells('A1:I1')
  sheetEntradas.getCell('A1').value = '📦 ENTRADAS DE SÊMEN'
  sheetEntradas.getCell('A1').font = { size: 16, bold: true }
  sheetEntradas.getCell('A1').alignment = { horizontal: 'center' }

  const headerEntradas = sheetEntradas.addRow([
    'Data Compra', 'Touro', 'Raça', 'Quantidade', 'Custo/Dose', 'Valor Total', 'Localização', 'Fornecedor', 'Observações'
  ])
  headerEntradas.font = { bold: true }
  headerEntradas.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  entradas.rows.forEach(row => {
    const valorTotal = (row.quantidade_doses || 0) * (row.custo_dose || 0)
    sheetEntradas.addRow([
      row.data_compra ? new Date(row.data_compra).toLocaleDateString('pt-BR') : '',
      row.nome_touro || '',
      row.raca || '',
      row.quantidade_doses || 0,
      row.custo_dose || 0,
      valorTotal,
      row.localizacao || '',
      row.fornecedor || '',
      row.observacoes || ''
    ])
  })

  // Planilha de Saídas
  const sheetSaidas = workbook.addWorksheet('Saídas')
  sheetSaidas.mergeCells('A1:D1')
  sheetSaidas.getCell('A1').value = '📤 SAÍDAS DE SÊMEN'
  sheetSaidas.getCell('A1').font = { size: 16, bold: true }
  sheetSaidas.getCell('A1').alignment = { horizontal: 'center' }

  const headerSaidas = sheetSaidas.addRow(['Touro', 'Raça', 'Total Saídas'])
  headerSaidas.font = { bold: true }
  headerSaidas.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  saidas.rows.forEach(row => {
    sheetSaidas.addRow([
      row.nome_touro || '',
      row.raca || '',
      row.total_saidas || 0
    ])
  })

  sheetEntradas.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12
    else if (idx >= 1 && idx <= 2) col.width = 20
    else if (idx >= 3 && idx <= 5) col.width = 15
    else col.width = 20
  })

  sheetSaidas.columns.forEach((col, idx) => {
    if (idx <= 1) col.width = 25
    else col.width = 15
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Vacinações
async function generateVacinacoesReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  const result = await query(`
    SELECT 
      o.id,
      o.data_ocorrencia,
      CONCAT(a.serie, a.rg) as animal,
      a.raca,
      o.tipo_ocorrencia,
      o.descricao,
      o.medicamento,
      o.dosagem,
      o.veterinario_responsavel,
      o.observacoes
    FROM ocorrencias o
    INNER JOIN animais a ON a.id = o.animal_id
    WHERE o.data_ocorrencia >= $1 AND o.data_ocorrencia <= $2
      AND (o.tipo_ocorrencia ILIKE '%vacina%' OR o.tipo_ocorrencia ILIKE '%tratamento%' OR o.tipo_ocorrencia ILIKE '%medic%')
    ORDER BY o.data_ocorrencia DESC
  `, [pgStart, pgEnd])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Vacinações e Tratamentos')

  sheet.mergeCells('A1:J1')
  sheet.getCell('A1').value = '💉 RELATÓRIO DE VACINAÇÕES E TRATAMENTOS'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:J2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data', 'Animal', 'Raça', 'Tipo', 'Descrição', 'Medicamento', 'Dosagem', 'Veterinário', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '14B8A6' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  result.rows.forEach(row => {
    sheet.addRow([
      row.data_ocorrencia ? new Date(row.data_ocorrencia).toLocaleDateString('pt-BR') : '',
      row.animal || '',
      row.raca || '',
      row.tipo_ocorrencia || '',
      row.descricao || '',
      row.medicamento || '',
      row.dosagem || '',
      row.veterinario_responsavel || '',
      row.observacoes || ''
    ])
  })

  // Estatísticas
  const total = result.rows.length
  const vacinacoes = result.rows.filter(r => r.tipo_ocorrencia?.toLowerCase().includes('vacina')).length
  const tratamentos = result.rows.filter(r => r.tipo_ocorrencia?.toLowerCase().includes('tratamento')).length

  sheet.addRow([])
  sheet.mergeCells(`A${sheet.rowCount + 1}:J${sheet.rowCount + 1}`)
  const statsRow = sheet.addRow(['RESUMO ESTATÍSTICO'])
  statsRow.font = { bold: true, size: 12 }
  statsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } }
  
  sheet.addRow(['Total de Registros:', total])
  sheet.addRow(['Vacinações:', vacinacoes])
  sheet.addRow(['Tratamentos:', tratamentos])

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12
    else if (idx >= 1 && idx <= 2) col.width = 15
    else if (idx === 3) col.width = 20
    else if (idx === 4) col.width = 25
    else if (idx >= 5 && idx <= 7) col.width = 18
    else col.width = 30
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar relatório de Genealogia
async function generateGenealogiaReport(period) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Buscar animais nascidos no período com informações de pais
  const result = await query(`
    SELECT 
      n.id,
      n.data_nascimento,
      CONCAT(a.serie, a.rg) AS animal,
      a.raca,
      a.sexo,
      CONCAT(COALESCE(g.pai_serie,''), ' ', COALESCE(g.pai_rg,'')) AS pai,
      CONCAT(COALESCE(g.mae_serie,''), ' ', COALESCE(g.mae_rg,'')) AS mae,
      COALESCE(g.receptora_nome, CONCAT(COALESCE(g.receptora_serie,''), COALESCE(g.receptora_rg,''))) AS receptora,
      a.pai_registro,
      a.mae_registro,
      a.observacoes
    FROM nascimentos n
    LEFT JOIN animais a ON CONCAT(a.serie, a.rg) = CONCAT(n.serie, n.rg)
    LEFT JOIN gestacoes g ON g.id = n.gestacao_id
    WHERE (n.data_nascimento >= $1 AND n.data_nascimento <= $2)
    ORDER BY n.data_nascimento DESC
  `, [pgStart, pgEnd])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Genealogia')

  sheet.mergeCells('A1:L1')
  sheet.getCell('A1').value = '🌳 RELATÓRIO DE GENEALOGIA'
  sheet.getCell('A1').font = { size: 16, bold: true }
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getRow(1).height = 30

  sheet.mergeCells('A2:L2')
  sheet.getCell('A2').value = `Período: ${formatDateBR(period.startDate)} até ${formatDateBR(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headerRow = sheet.addRow([
    'Data Nascimento', 'Animal', 'Raça', 'Sexo', 'Pai', 'Mãe', 'Receptora', 'Pai Registro', 'Mãe Registro', 'Observações'
  ])
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } }
    cell.font = { color: { argb: 'FFFFFF' } }
  })

  result.rows.forEach(row => {
    sheet.addRow([
      row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : (row.data || ''),
      row.animal || '',
      row.raca || '',
      row.sexo || '',
      row.pai || '',
      row.mae || '',
      row.receptora || '',
      row.pai_registro || '',
      row.mae_registro || '',
      row.observacoes || ''
    ])
  })

  sheet.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 12
    else if (idx >= 1 && idx <= 3) col.width = 15
    else if (idx >= 4 && idx <= 6) col.width = 20
    else if (idx >= 7 && idx <= 8) col.width = 18
    else col.width = 30
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// Gerar gráfico resumido em texto para WhatsApp
// Helper: DD/MM/AAAA
function formatBR(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

async function generateWhatsAppSummary(period, relatorios) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  console.log(`\n📝 Gerando resumo WhatsApp para relatórios:`, relatorios)
  
  let summary = `📧 Relatórios completos enviados por email.\n\n`
  summary += `📊 *RESUMO DE RELATÓRIOS BEEF-SYNC*\n`
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  summary += `📅 *Período:* ${formatBR(period.startDate)} a ${formatBR(period.endDate)}\n\n`

  if (relatorios.includes('nascimentos') || relatorios.includes('resumo_nascimentos')) {
    const nascResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sexo IN ('M', 'Macho') THEN 1 END) as machos,
        COUNT(CASE WHEN sexo IN ('F', 'Fêmea') THEN 1 END) as femeas
      FROM nascimentos 
      WHERE data_nascimento >= $1 AND data_nascimento <= $2
    `, [pgStart, pgEnd])
    
    const nasc = nascResult.rows[0]
    summary += `👶 *NASCIMENTOS*\n`
    summary += `Total: ${nasc.total || 0}\n`
    summary += `Machos: ${nasc.machos || 0}\n`
    summary += `Fêmeas: ${nasc.femeas || 0}\n\n`
  }

  if (relatorios.includes('mortes') || relatorios.includes('resumo_mortes')) {
    const mortesResult = await query(`
      SELECT COUNT(*) as total
      FROM mortes 
      WHERE data_morte >= $1 AND data_morte <= $2
    `, [pgStart, pgEnd])
    
    summary += `💀 *MORTES*\n`
    summary += `Total: ${mortesResult.rows[0]?.total || 0}\n\n`
  }

  if (relatorios.includes('agenda_atividades')) {
    const dgtResult = await query(`
      SELECT COUNT(*) as total FROM animais a
      WHERE a.situacao = 'Ativo' AND a.data_nascimento IS NOT NULL
        AND (CURRENT_DATE - a.data_nascimento::date) BETWEEN 330 AND 640
    `)
    summary += `📅 *AGENDA DE ATIVIDADES*\n`
    summary += `📊 DGT (330-640 dias): ${dgtResult.rows[0]?.total || 0}\n\n`
  }

  if (relatorios.includes('resumo_por_sexo')) {
    const sexoResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sexo IN ('M', 'Macho') THEN 1 END) as machos,
        COUNT(CASE WHEN sexo IN ('F', 'Fêmea') THEN 1 END) as femeas
      FROM nascimentos 
      WHERE data_nascimento >= $1 AND data_nascimento <= $2
    `, [pgStart, pgEnd])
    
    const s = sexoResult.rows[0]
    const total = parseInt(s?.total || 0)
    const machos = parseInt(s?.machos || 0)
    const femeas = parseInt(s?.femeas || 0)
    const pM = total > 0 ? Math.round((machos / total) * 100) : 0
    const pF = total > 0 ? Math.round((femeas / total) * 100) : 0
    
    summary += `👶 *NASCIMENTOS POR SEXO*\n`
    summary += `Total: ${total}\n`
    summary += `♂️ Machos: ${machos} (${pM}%)\n`
    summary += `♀️ Fêmeas: ${femeas} (${pF}%)\n\n`
  }

  if (relatorios.includes('resumo_por_raca')) {
    const racaResult = await query(`
      SELECT 
        COALESCE(raca, 'Não informada') as raca,
        COUNT(*) as total,
        COUNT(CASE WHEN sexo IN ('M', 'Macho') THEN 1 END) as machos,
        COUNT(CASE WHEN sexo IN ('F', 'Fêmea') THEN 1 END) as femeas
      FROM nascimentos 
      WHERE data_nascimento >= $1 AND data_nascimento <= $2
      GROUP BY COALESCE(raca, 'Não informada')
      ORDER BY total DESC
      LIMIT 5
    `, [pgStart, pgEnd])
    
    summary += `🐄 *TOP 5 RAÇAS (NASCIMENTOS)*\n`
    racaResult.rows.forEach((row, idx) => {
      summary += `${idx + 1}. ${row.raca}\n`
      summary += `   Total: ${row.total} | M: ${row.machos || 0} | F: ${row.femeas || 0}\n`
    })
    summary += `\n`
  }

  if (relatorios.includes('resumo_por_mae')) {
    const maeResult = await query(`
      SELECT 
        COALESCE(
          CONCAT(COALESCE(g.mae_serie,''), COALESCE(g.mae_rg,'')),
          COALESCE(g.receptora_nome, CONCAT(COALESCE(g.receptora_serie,''), COALESCE(g.receptora_rg,''))),
          'N/A'
        ) AS mae,
        COUNT(*) AS total,
        COUNT(CASE WHEN n.sexo IN ('M', 'Macho') THEN 1 END) AS machos,
        COUNT(CASE WHEN n.sexo IN ('F', 'Fêmea') THEN 1 END) AS femeas
      FROM nascimentos n
      LEFT JOIN gestacoes g ON g.id = n.gestacao_id
      WHERE (n.data_nascimento >= $1 AND n.data_nascimento <= $2)
      GROUP BY COALESCE(
        CONCAT(COALESCE(g.mae_serie,''), COALESCE(g.mae_rg,'')),
        COALESCE(g.receptora_nome, CONCAT(COALESCE(g.receptora_serie,''), COALESCE(g.receptora_rg,''))),
        'N/A'
      )
      ORDER BY total DESC
      LIMIT 5
    `, [pgStart, pgEnd])
    
    summary += `🐄 *TOP 5 MÃES (NASCIMENTOS)*\n`
    maeResult.rows.forEach((row, idx) => {
      summary += `${idx + 1}. ${row.mae}\n`
      summary += `   Total: ${row.total} | M: ${row.machos || 0} | F: ${row.femeas || 0}\n`
    })
    summary += `\n`
  }

    if (relatorios.includes('nf_entrada_saida')) {
    // Buscar NFs e seus itens para detalhamento (saída usa data_saida se existir)
    const nfResult = await query(`
      SELECT 
        nf.id,
        nf.numero_nf,
        nf.tipo,
        nf.valor_total,
        nf.itens as legacy_itens
      FROM notas_fiscais nf
      WHERE (
        COALESCE(CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END, nf.data_compra) >= $1
        AND COALESCE(CASE WHEN nf.tipo = 'saida' THEN nf.data_saida END, nf.data_compra) <= $2
      )
    `, [pgStart, pgEnd])

    let entradas = { total: 0, valor: 0, machos: 0, femeas: 0, qtd: 0 }
    let saidas = { total: 0, valor: 0, machos: 0, femeas: 0, qtd: 0 }

    // Buscar todos os itens das NFs encontradas
    const nfIds = nfResult.rows.map(nf => nf.id)
    let todosItens = []
    if (nfIds.length > 0) {
      const itensResult = await query(`
        SELECT nota_fiscal_id, dados_item 
        FROM notas_fiscais_itens 
        WHERE nota_fiscal_id = ANY($1::int[])
      `, [nfIds])
      todosItens = itensResult.rows
    }

    for (const nf of nfResult.rows) {
      const isEntrada = nf.tipo === 'entrada'
      const stats = isEntrada ? entradas : saidas
      
      stats.total++
      stats.valor += parseFloat(nf.valor_total || 0)

      // Processar itens
      let itens = []
      
      // Tentar pegar da tabela nova
      const itensDaNf = todosItens.filter(i => i.nota_fiscal_id === nf.id)
      if (itensDaNf.length > 0) {
        itens = itensDaNf.map(i => typeof i.dados_item === 'string' ? JSON.parse(i.dados_item) : i.dados_item)
      } 
      // Fallback para legado
      else if (nf.legacy_itens) {
        try {
          const raw = typeof nf.legacy_itens === 'string' ? JSON.parse(nf.legacy_itens) : nf.legacy_itens
          itens = Array.isArray(raw) ? raw : []
        } catch (e) {}
      }

      // Somar quantidades por sexo
      itens.forEach(item => {
        const qtd = parseInt(item.quantidade) || 
                    parseInt(item.quantidadeAnimais) || 
                    parseInt(item.qtd) || 
                    (item.modoCadastro === 'categoria' ? parseInt(item.quantidade) || 0 : 1)
        
        stats.qtd += qtd

        const sexo = item.sexo || item.genero
        if (sexo && (sexo === 'M' || sexo === 'Macho' || sexo.startsWith('M'))) {
          stats.machos += qtd
        } else if (sexo && (sexo === 'F' || sexo === 'Fêmea' || sexo.startsWith('F'))) {
          stats.femeas += qtd
        }
      })
    }

    summary += `📄 *NOTAS FISCAIS*\n`
    
    // Entradas
    summary += `📥 *ENTRADAS*\n`
    summary += `NFs: ${entradas.total} | Valor: R$ ${entradas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `Animais: ${entradas.qtd}\n`
    if (entradas.qtd > 0) {
      const pM = Math.round((entradas.machos / entradas.qtd) * 100) || 0
      const pF = Math.round((entradas.femeas / entradas.qtd) * 100) || 0
      const barM = '█'.repeat(Math.round(pM / 10))
      const barF = '█'.repeat(Math.round(pF / 10))
      
      summary += `♂️ Machos: ${entradas.machos} (${pM}%)\n${barM}\n`
      summary += `♀️ Fêmeas: ${entradas.femeas} (${pF}%)\n${barF}\n`
    }
    summary += `\n`

    // Saídas
    summary += `📤 *SAÍDAS*\n`
    summary += `NFs: ${saidas.total} | Valor: R$ ${saidas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `Animais: ${saidas.qtd > 0 ? saidas.qtd : 'Nenhum animal registrado nos itens'}\n`
    if (saidas.qtd > 0) {
      const pM = Math.round((saidas.machos / saidas.qtd) * 100) || 0
      const pF = Math.round((saidas.femeas / saidas.qtd) * 100) || 0
      const barM = '█'.repeat(Math.round(pM / 10))
      const barF = '█'.repeat(Math.round(pF / 10))
      
      summary += `♂️ Machos: ${saidas.machos} (${pM}%)\n${barM}\n`
      summary += `♀️ Fêmeas: ${saidas.femeas} (${pF}%)\n${barF}\n`
    } else if (saidas.total > 0) {
      summary += `⚠️ *ATENÇÃO:* As NFs de saída não têm animais registrados nos itens.\n`
      summary += `Verifique se os itens foram cadastrados corretamente.\n`
    }
    summary += `\n`
  }

  if (relatorios.includes('resumo_por_pai')) {
    const paiResult = await query(`
      SELECT 
        COALESCE(
          CONCAT(COALESCE(g.pai_serie,''), COALESCE(g.pai_rg,'')),
          'N/A'
        ) AS pai,
        COUNT(*) AS total,
        COUNT(CASE WHEN n.sexo IN ('M', 'Macho') THEN 1 END) AS machos,
        COUNT(CASE WHEN n.sexo IN ('F', 'Fêmea') THEN 1 END) AS femeas
      FROM nascimentos n
      LEFT JOIN gestacoes g ON g.id = n.gestacao_id
      WHERE (n.data_nascimento >= $1 AND n.data_nascimento <= $2)
      GROUP BY COALESCE(CONCAT(COALESCE(g.pai_serie,''), COALESCE(g.pai_rg,'')), 'N/A')
      ORDER BY total DESC
      LIMIT 5
    `, [pgStart, pgEnd])
    
    summary += `🐂 *TOP 5 PAIS*\n`
    paiResult.rows.forEach((row, idx) => {
      summary += `${idx + 1}. ${row.pai || 'N/A'}\n`
      summary += `   Total: ${row.total} | M: ${row.machos || 0} | F: ${row.femeas || 0}\n`
    })
    summary += `\n`
  }

  if (relatorios.includes('receptoras_chegaram')) {
    // Contar NFs e itens (receptoras individuais)
    const receptorasResult = await query(`
      SELECT 
        COUNT(DISTINCT nf.id) as total_nfs,
        COUNT(item.id) as total_receptoras
      FROM notas_fiscais nf
      LEFT JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
        AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
      WHERE nf.eh_receptoras = true 
        AND nf.tipo = 'entrada'
        AND COALESCE(nf.data_chegada_animais, nf.data_compra) >= $1
        AND COALESCE(nf.data_chegada_animais, nf.data_compra) <= $2
    `, [pgStart, pgEnd])
    
    summary += `🐄 *RECEPTORAS QUE CHEGARAM*\n`
    summary += `NFs: ${receptorasResult.rows[0]?.total_nfs || 0}\n`
    summary += `Receptoras: ${receptorasResult.rows[0]?.total_receptoras || 0}\n\n`
  }

  if (relatorios.includes('receptoras_faltam_parir')) {
    const faltamParirResult = await query(`
      WITH gestacoes_te AS (
        SELECT 
          g.id AS gestacao_id
        FROM gestacoes g
        JOIN notas_fiscais nf
          ON (
            g.receptora_nome = CONCAT(nf.receptora_letra, nf.receptora_numero) OR 
            (g.receptora_serie = nf.receptora_letra AND g.receptora_rg = nf.receptora_numero)
          )
          AND g.data_cobertura::date = nf.data_te::date
        WHERE nf.eh_receptoras = true
          AND nf.tipo = 'entrada'
          AND nf.data_te IS NOT NULL
          AND COALESCE(g.situacao, 'Ativa') NOT IN ('Nasceu', 'Nascido', 'Cancelada', 'Cancelado', 'Perdeu', 'Aborto')
      )
      SELECT COUNT(*) AS total
      FROM gestacoes_te gt
      WHERE NOT EXISTS (
        SELECT 1 FROM nascimentos n 
        WHERE n.gestacao_id = gt.gestacao_id
      )
    `)
    
    summary += `⏰ *RECEPTORAS QUE FALTAM PARIR*\n`
    summary += `Total: ${faltamParirResult.rows[0]?.total || 0}\n\n`
  }

  if (relatorios.includes('receptoras_faltam_diagnostico')) {
    const totalFaltamDG = await countReceptorasFaltamDG(pgStart, pgEnd)
    summary += `🔬 *RECEPTORAS QUE FALTAM DIAGNÓSTICO* (chegaram no período)\n`
    summary += `Total: ${totalFaltamDG}\n\n`
  }

  if ((relatorios.includes('femeas_ia') || relatorios.includes('resumo_femeas_ia'))) {
    const iaDateCol = await getIADataColumn()
    const femeasIAResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN i.status_gestacao = 'Prenha' THEN 1 END) as prenhas,
        COUNT(CASE WHEN i.status_gestacao = 'Vazia' THEN 1 END) as vazias,
        COUNT(CASE WHEN i.status_gestacao IS NULL OR i.status_gestacao = 'Aguardando DG' THEN 1 END) as pendentes
      FROM inseminacoes i
      INNER JOIN animais a ON a.id = i.animal_id
      WHERE i.${iaDateCol} >= $1 AND i.${iaDateCol} <= $2
        AND a.sexo = 'Fêmea'
    `, [pgStart, pgEnd])
    
    const stats = femeasIAResult.rows[0]
    summary += `🐄 *FÊMEAS QUE FIZERAM IA*\n`
    summary += `Total de IAs: ${stats.total || 0}\n`
    summary += `Prenhas: ${stats.prenhas || 0}\n`
    summary += `Vazias: ${stats.vazias || 0}\n`
    summary += `Pendentes de DG: ${stats.pendentes || 0}\n`
    if (stats.total > 0) {
      const taxaPrenhez = ((stats.prenhas / stats.total) * 100).toFixed(1)
      summary += `Taxa de Prenhez: ${taxaPrenhez}%\n`
    }
    summary += `\n`
  }

  if (relatorios.includes('animais_piquetes')) {
    const piquetesResult = await query(`
      SELECT 
        COUNT(*) as total_entradas,
        COUNT(DISTINCT la.piquete) as total_piquetes,
        COUNT(DISTINCT la.animal_id) as total_animais,
        COUNT(CASE WHEN la.data_saida IS NULL THEN 1 END) as ativos
      FROM localizacoes_animais la
      WHERE la.data_entrada >= $1 AND la.data_entrada <= $2
    `, [pgStart, pgEnd])
    
    const stats = piquetesResult.rows[0]
    summary += `📍 *ANIMAIS NOS PIQUETES*\n`
    summary += `Total de Entradas: ${stats.total_entradas || 0}\n`
    summary += `Piquetes Diferentes: ${stats.total_piquetes || 0}\n`
    summary += `Animais Únicos: ${stats.total_animais || 0}\n`
    summary += `Ainda Ativos: ${stats.ativos || 0}\n\n`
  }

  if (relatorios.includes('transferencias_embrioes') || relatorios.includes('resumo_te')) {
    const teResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN resultado = 'Gestante' THEN 1 END) as gestantes,
        COUNT(CASE WHEN resultado = 'Vazia' THEN 1 END) as vazias
      FROM transferencias_embrioes
      WHERE data_te >= $1 AND data_te <= $2
    `, [pgStart, pgEnd])
    
    const stats = teResult.rows[0]
    summary += `🧪 *TRANSFERÊNCIAS DE EMBRIÕES*\n`
    summary += `Total de TEs: ${stats.total || 0}\n`
    summary += `Gestantes: ${stats.gestantes || 0}\n`
    summary += `Vazias: ${stats.vazias || 0}\n`
    if (stats.total > 0) {
      const taxaGestacao = ((stats.gestantes / stats.total) * 100).toFixed(1)
      summary += `Taxa de Gestação: ${taxaGestacao}%\n`
    }
    summary += `\n`
  }

  if (relatorios.includes('previsoes_parto') || relatorios.includes('nascimentos') || relatorios.includes('gestacoes')) {
    try {
      const hojeStr = new Date().toISOString().split('T')[0]
      const [nascFut, gestAtivas, idsNasc] = await Promise.all([
        query(`SELECT COUNT(*) as c FROM nascimentos WHERE data_nascimento::date > $1::date`, [hojeStr]),
        query(`SELECT g.* FROM gestacoes g WHERE (situacao = 'Em Gestação' OR situacao = 'Ativa')`, []),
        query(`SELECT gestacao_id FROM nascimentos WHERE gestacao_id IS NOT NULL`).then(r => new Set(r.rows.map(x => x.gestacao_id)))
      ])
      let totalFIV = parseInt(nascFut.rows[0]?.c || 0)
      let totalIA = 0
      const listaIA = []
      gestAtivas.rows.forEach(g => {
        if (idsNasc.has(g.id)) return
        const dataParto = new Date(g.data_cobertura)
        dataParto.setDate(dataParto.getDate() + 276)
        if (dataParto <= new Date()) return
        if (g.mae_serie || g.mae_rg) totalFIV++
        else {
          totalIA++
          if (totalIA <= 5) listaIA.push(`${g.receptora_serie || ''} ${g.receptora_rg || ''}`.trim() || g.receptora_nome || '-')
        }
      })
      const iaPrenhas = await query(`
        SELECT i.*, a.serie, a.rg, a.nome as animal_nome FROM inseminacoes i
        LEFT JOIN animais a ON a.id = i.animal_id
        WHERE LOWER(COALESCE(i.status_gestacao,'')) IN ('prenha','prenhez')
      `)
      iaPrenhas.rows.forEach(ia => {
        const dataParto = new Date(ia.data_ia)
        dataParto.setDate(dataParto.getDate() + 285)
        if (dataParto > new Date()) {
          totalIA++
          if (listaIA.length < 5) listaIA.push(`${ia.serie || ''} ${ia.rg || ''}`.trim() || ia.animal_nome || '-')
        }
      })
      summary += `🐄 *PREVISÕES PARA PARIR (FIV vs IA)*\n`
      summary += `Receptoras FIV: ${totalFIV}\n`
      summary += `Fêmeas IA: ${totalIA}\n`
      if (listaIA.length > 0) summary += `IA: ${listaIA.slice(0, 5).join(', ')}\n`
      summary += `\n`
    } catch (e) {
      console.warn('Erro ao buscar previsões FIV/IA:', e.message)
    }
  }

  if (relatorios.includes('gestacoes') || relatorios.includes('resumo_gestacoes')) {
    const gestacoesResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN situacao = 'Em Gestação' THEN 1 END) as em_gestacao,
        COUNT(CASE WHEN situacao = 'Nascido' THEN 1 END) as nascidos,
        COUNT(CASE WHEN situacao = 'Aborto' THEN 1 END) as abortos
      FROM gestacoes
      WHERE data_cobertura >= $1 AND data_cobertura <= $2
    `, [pgStart, pgEnd])
    
    const stats = gestacoesResult.rows[0]
    summary += `🤰 *GESTAÇÕES*\n`
    summary += `Total: ${stats.total || 0}\n`
    summary += `Em Gestação: ${stats.em_gestacao || 0}\n`
    summary += `Nascidos: ${stats.nascidos || 0}\n`
    summary += `Abortos: ${stats.abortos || 0}\n\n`
  }

  if (relatorios.includes('exames_andrologicos') || relatorios.includes('resumo_exames_andrologicos')) {
    const examesResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN resultado IN ('Aprovado', 'Apto') THEN 1 END) as aprovados,
        COUNT(CASE WHEN resultado IN ('Reprovado', 'Inapto') THEN 1 END) as reprovados
      FROM exames_andrologicos ea
      WHERE ea.data_exame::date >= $1::date AND ea.data_exame::date <= $2::date
    `, [pgStart, pgEnd])
    
    const stats = examesResult.rows[0]
    summary += `🔬 *EXAMES ANDROLÓGICOS*\n`
    summary += `Total: ${stats.total || 0}\n`
    summary += `Aprovados: ${stats.aprovados || 0}\n`
    summary += `Reprovados: ${stats.reprovados || 0}\n`
    if (stats.total > 0) {
      const taxaAprovacao = ((stats.aprovados / stats.total) * 100).toFixed(1)
      summary += `Taxa de Aprovação: ${taxaAprovacao}%\n`
    }
    summary += `\n`
  }

  if (relatorios.includes('movimentacoes_financeiras') || relatorios.includes('resumo_financeiro')) {
    const receitas = await query(`
      SELECT SUM(valor_total) as total
      FROM notas_fiscais
      WHERE tipo = 'saida' AND data_compra >= $1 AND data_compra <= $2
    `, [pgStart, pgEnd])
    
    const despesas = await query(`
      SELECT SUM(valor_total) as total
      FROM notas_fiscais
      WHERE tipo = 'entrada' AND data_compra >= $1 AND data_compra <= $2
    `, [pgStart, pgEnd])
    
    const iaDateCol = await getIADataColumn()
    const custosIA = await query(`
      SELECT SUM(custo_dose) as total
      FROM inseminacoes
      WHERE ${iaDateCol} >= $1 AND ${iaDateCol} <= $2
    `, [pgStart, pgEnd])
    
    const receita = parseFloat(receitas.rows[0]?.total || 0)
    const despesa = parseFloat(despesas.rows[0]?.total || 0)
    const custoIA = parseFloat(custosIA.rows[0]?.total || 0)
    const saldo = receita - despesa - custoIA
    
    summary += `💰 *MOVIMENTAÇÕES FINANCEIRAS*\n`
    summary += `Receitas: R$ ${receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `Despesas: R$ ${despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `Custos IA: R$ ${custoIA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    summary += `Saldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
  }

  if (relatorios.includes('estoque_semen') || relatorios.includes('resumo_estoque_semen')) {
    const entradas = await query(`
      SELECT COUNT(*) as total, SUM(quantidade_doses) as doses
      FROM estoque_semen
      WHERE data_compra >= $1 AND data_compra <= $2
    `, [pgStart, pgEnd])
    
    const saidas = await query(`
      SELECT SUM(so.quantidade_doses) as total
      FROM saidas_semen so
      WHERE so.data_saida >= $1 AND so.data_saida <= $2
    `, [pgStart, pgEnd])
    
    summary += `📦 *ESTOQUE DE SÊMEN*\n`
    summary += `Entradas: ${entradas.rows[0]?.total || 0} (${entradas.rows[0]?.doses || 0} doses)\n`
    summary += `Saídas: ${saidas.rows[0]?.total || 0} doses\n\n`
  }

  if (relatorios.includes('vacinacoes') || relatorios.includes('resumo_vacinacoes')) {
    const vacinacoesResult = await query(`
      SELECT COUNT(*) as total
      FROM ocorrencias
      WHERE data_ocorrencia >= $1 AND data_ocorrencia <= $2
        AND (tipo_ocorrencia ILIKE '%vacina%' OR tipo_ocorrencia ILIKE '%tratamento%')
    `, [pgStart, pgEnd])
    
    summary += `💉 *VACINAÇÕES E TRATAMENTOS*\n`
    summary += `Total: ${vacinacoesResult.rows[0]?.total || 0}\n\n`
  }

  if (relatorios.includes('genealogia')) {
    const genealogiaResult = await query(`
      SELECT COUNT(*) as total
      FROM nascimentos
      WHERE data_nascimento >= $1 AND data_nascimento <= $2
    `, [pgStart, pgEnd])
    
    summary += `🌳 *GENEALOGIA*\n`
    summary += `Animais com Genealogia: ${genealogiaResult.rows[0]?.total || 0}\n\n`
  }

  // Se não houver nenhum dado no resumo, adicionar mensagem
  if (summary.length < 100) {
    summary += `⚠️ *Nenhum dado encontrado para os relatórios selecionados neste período*\n\n`
    summary += `Relatórios selecionados:\n`
    relatorios.forEach(r => {
      summary += `• ${r}\n`
    })
    summary += `\nVerifique se há dados no período selecionado.\n`
  }
  
  summary += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  summary += `📧 Relatório completo enviado por email\n`
  if (relatorios.length > 0) {
    summary += `📊 Gráfico visual incluído neste resumo\n`
  }
  summary += `\n_Beef-Sync - Sistema de Gestão Pecuária_\n`
  summary += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`

  console.log(`✅ Resumo WhatsApp gerado: ${summary.length} caracteres`)
  return summary
}

// Gerar gráfico visual resumido dos relatórios
async function generateSummaryChart(period, relatorios) {
  const pgStart = toPgDate(period.startDate)
  const pgEnd = toPgDate(period.endDate)

  // Coletar dados para o gráfico
  const dados = {
    nascimentos: { total: 0, machos: 0, femeas: 0 },
    mortes: 0,
    entradas: { nfs: 0, valor: 0, animais: 0 },
    saidas: { nfs: 0, valor: 0, animais: 0 },
    receptorasChegaram: 0,
    receptorasFaltamParir: 0,
    receptorasFaltamDG: 0,
    femeasIA: { total: 0, prenhas: 0, vazias: 0, pendentes: 0 },
    animaisPiquetes: { total: 0, piquetes: 0, animais: 0, ativos: 0 }
  }

  // Buscar nascimentos com detalhamento por sexo
  if (relatorios.includes('nascimentos') || relatorios.includes('resumo_nascimentos') || relatorios.includes('resumo_por_sexo') || relatorios.includes('resumo_por_raca') || relatorios.includes('resumo_por_mae') || relatorios.includes('resumo_por_pai')) {
    const nascResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sexo IN ('M', 'Macho') THEN 1 END) as machos,
        COUNT(CASE WHEN sexo IN ('F', 'Fêmea') THEN 1 END) as femeas
      FROM nascimentos 
      WHERE data_nascimento >= $1 AND data_nascimento <= $2
    `, [pgStart, pgEnd])
    dados.nascimentos.total = parseInt(nascResult.rows[0]?.total || 0)
    dados.nascimentos.machos = parseInt(nascResult.rows[0]?.machos || 0)
    dados.nascimentos.femeas = parseInt(nascResult.rows[0]?.femeas || 0)
  }

  // Buscar mortes
  if (relatorios.includes('mortes') || relatorios.includes('resumo_mortes')) {
    const mortesResult = await query(`
      SELECT COUNT(*) as total
      FROM mortes 
      WHERE data_morte >= $1 AND data_morte <= $2
    `, [pgStart, pgEnd])
    dados.mortes = parseInt(mortesResult.rows[0]?.total || 0)
  }

  // Buscar NFs (saída usa data_saida se existir)
  if (relatorios.includes('nf_entrada_saida')) {
    const nfResult = await query(`
      SELECT tipo, COUNT(*) as total, SUM(valor_total) as valor_total
      FROM notas_fiscais 
      WHERE COALESCE(CASE WHEN tipo = 'saida' THEN data_saida END, data_compra) >= $1
        AND COALESCE(CASE WHEN tipo = 'saida' THEN data_saida END, data_compra) <= $2
      GROUP BY tipo
    `, [pgStart, pgEnd])

    nfResult.rows.forEach(row => {
      if (row.tipo === 'entrada') {
        dados.entradas.nfs = parseInt(row.total || 0)
        dados.entradas.valor = parseFloat(row.valor_total || 0)
      } else {
        dados.saidas.nfs = parseInt(row.total || 0)
        dados.saidas.valor = parseFloat(row.valor_total || 0)
      }
    })

    // Buscar quantidade de animais
    const nfIdsResult = await query(`
      SELECT id FROM notas_fiscais 
      WHERE COALESCE(CASE WHEN tipo = 'saida' THEN data_saida END, data_compra) >= $1
        AND COALESCE(CASE WHEN tipo = 'saida' THEN data_saida END, data_compra) <= $2
    `, [pgStart, pgEnd])
    
    const nfIds = nfIdsResult.rows.map(nf => nf.id)
    if (nfIds.length > 0) {
      const itensResult = await query(`
        SELECT nf.tipo, item.dados_item
        FROM notas_fiscais nf
        JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
        WHERE nf.id = ANY($1::int[])
      `, [nfIds])

      itensResult.rows.forEach(row => {
        try {
          const item = typeof row.dados_item === 'string' ? JSON.parse(row.dados_item) : row.dados_item
          const qtd = parseInt(item.quantidade) || parseInt(item.quantidadeAnimais) || parseInt(item.qtd) || 1
          
          if (row.tipo === 'entrada') {
            dados.entradas.animais += qtd
          } else {
            dados.saidas.animais += qtd
          }
        } catch (e) {}
      })
    }
  }

  // Buscar receptoras
  if (relatorios.includes('receptoras_chegaram')) {
    const receptorasResult = await query(`
      SELECT COUNT(*) as total
      FROM notas_fiscais 
      WHERE eh_receptoras = true 
        AND tipo = 'entrada'
        AND COALESCE(data_chegada_animais, data_compra) >= $1
        AND COALESCE(data_chegada_animais, data_compra) <= $2
    `, [pgStart, pgEnd])
    dados.receptorasChegaram = parseInt(receptorasResult.rows[0]?.total || 0)
  }

  if (relatorios.includes('receptoras_faltam_parir')) {
    const faltamParirResult = await query(`
      WITH gestacoes_te AS (
        SELECT 
          g.id AS gestacao_id
        FROM gestacoes g
        JOIN notas_fiscais nf
          ON (
            g.receptora_nome = CONCAT(nf.receptora_letra, nf.receptora_numero) OR 
            (g.receptora_serie = nf.receptora_letra AND g.receptora_rg = nf.receptora_numero)
          )
          AND g.data_cobertura::date = nf.data_te::date
        WHERE nf.eh_receptoras = true
          AND nf.tipo = 'entrada'
          AND nf.data_te IS NOT NULL
          AND COALESCE(g.situacao, 'Ativa') NOT IN ('Nasceu', 'Nascido', 'Cancelada', 'Cancelado', 'Perdeu', 'Aborto')
      )
      SELECT COUNT(*) AS total
      FROM gestacoes_te gt
      WHERE NOT EXISTS (
        SELECT 1 FROM nascimentos n 
        WHERE n.gestacao_id = gt.gestacao_id
      )
    `)
    dados.receptorasFaltamParir = parseInt(faltamParirResult.rows[0]?.total || 0)
  }

  if (relatorios.includes('receptoras_faltam_diagnostico')) {
    dados.receptorasFaltamDG = await countReceptorasFaltamDG(pgStart, pgEnd)
  }

  // Buscar fêmeas que fizeram IA
  if ((relatorios.includes('femeas_ia') || relatorios.includes('resumo_femeas_ia'))) {
    const iaDateCol = await getIADataColumn()
    const femeasIAResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN i.status_gestacao = 'Prenha' THEN 1 END) as prenhas,
        COUNT(CASE WHEN i.status_gestacao = 'Vazia' THEN 1 END) as vazias,
        COUNT(CASE WHEN i.status_gestacao IS NULL OR i.status_gestacao = 'Aguardando DG' THEN 1 END) as pendentes
      FROM inseminacoes i
      INNER JOIN animais a ON a.id = i.animal_id
      WHERE i.${iaDateCol} >= $1 AND i.${iaDateCol} <= $2
        AND a.sexo = 'Fêmea'
    `, [pgStart, pgEnd])
    
    dados.femeasIA.total = parseInt(femeasIAResult.rows[0]?.total || 0)
    dados.femeasIA.prenhas = parseInt(femeasIAResult.rows[0]?.prenhas || 0)
    dados.femeasIA.vazias = parseInt(femeasIAResult.rows[0]?.vazias || 0)
    dados.femeasIA.pendentes = parseInt(femeasIAResult.rows[0]?.pendentes || 0)
  }

  // Buscar animais nos piquetes
  if (relatorios.includes('animais_piquetes')) {
    const piquetesResult = await query(`
      SELECT 
        COUNT(*) as total_entradas,
        COUNT(DISTINCT la.piquete) as total_piquetes,
        COUNT(DISTINCT la.animal_id) as total_animais,
        COUNT(CASE WHEN la.data_saida IS NULL THEN 1 END) as ativos
      FROM localizacoes_animais la
      WHERE la.data_entrada >= $1 AND la.data_entrada <= $2
    `, [pgStart, pgEnd])
    
    dados.animaisPiquetes.total = parseInt(piquetesResult.rows[0]?.total_entradas || 0)
    dados.animaisPiquetes.piquetes = parseInt(piquetesResult.rows[0]?.total_piquetes || 0)
    dados.animaisPiquetes.animais = parseInt(piquetesResult.rows[0]?.total_animais || 0)
    dados.animaisPiquetes.ativos = parseInt(piquetesResult.rows[0]?.ativos || 0)
  }

  // Criar gráfico combinado com múltiplos datasets
  const width = 1200
  const height = 900
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height })

  // Preparar datasets para gráfico combinado
  const datasets = []
  const labels = []
  
  // Construir labels e dados de forma organizada
  // Dataset 1: Valores de Notas Fiscais (Entrada vs Saída) - em R$
  if (relatorios.includes('nf_entrada_saida')) {
    if (dados.entradas.valor > 0 || dados.saidas.valor > 0) {
      labels.push('NF Entrada', 'NF Saída')
      datasets.push({
        label: 'Valor (R$)',
        data: [dados.entradas.valor, dados.saidas.valor],
        backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
        borderColor: ['#36A2EB', '#FF6384'],
        borderWidth: 3,
        borderRadius: 10,
        yAxisID: 'y-valor',
        order: 1
      })
    }
  }

  // Dataset 2: Nascimentos por Sexo (Machos vs Fêmeas)
  if ((relatorios.includes('nascimentos') || relatorios.includes('resumo_nascimentos') || relatorios.includes('resumo_por_sexo')) && dados.nascimentos.total > 0) {
    if (labels.length === 0) {
      labels.push('Machos', 'Fêmeas')
    } else {
      labels.push('Machos', 'Fêmeas')
    }
    datasets.push({
      label: 'Nascimentos',
      data: labels.length === 2 ? [dados.nascimentos.machos, dados.nascimentos.femeas] : [0, 0, dados.nascimentos.machos, dados.nascimentos.femeas],
      backgroundColor: labels.length === 2 
        ? ['rgba(75, 192, 192, 0.8)', 'rgba(255, 159, 64, 0.8)']
        : ['rgba(54, 162, 235, 0)', 'rgba(255, 99, 132, 0)', 'rgba(75, 192, 192, 0.8)', 'rgba(255, 159, 64, 0.8)'],
      borderColor: labels.length === 2 
        ? ['#4BC0C0', '#FF9F40']
        : ['transparent', 'transparent', '#4BC0C0', '#FF9F40'],
      borderWidth: 3,
      borderRadius: 10,
      yAxisID: 'y-quantidade',
      order: 2
    })
    
    // Ajustar primeiro dataset se necessário
    if (labels.length === 4 && datasets[0]) {
      datasets[0].data = [dados.entradas.valor, dados.saidas.valor, 0, 0]
      datasets[0].backgroundColor = ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']
      datasets[0].borderColor = ['#36A2EB', '#FF6384', 'transparent', 'transparent']
    }
  }

  // Dataset 3: Mortes
  if ((relatorios.includes('mortes') || relatorios.includes('resumo_mortes')) && dados.mortes > 0) {
    if (labels.length === 0) {
      labels.push('Mortes')
      datasets.push({
        label: 'Mortes',
        data: [dados.mortes],
        backgroundColor: ['rgba(255, 99, 132, 0.8)'],
        borderColor: ['#FF6384'],
        borderWidth: 3,
        borderRadius: 10,
        yAxisID: 'y-quantidade',
        order: 3
      })
    } else {
      // Adicionar mortes aos labels existentes
      labels.push('Mortes')
      // Ajustar todos os datasets para incluir mortes
      datasets.forEach(ds => {
        ds.data.push(0)
        ds.backgroundColor.push('rgba(0,0,0,0)')
        ds.borderColor.push('transparent')
      })
      datasets.push({
        label: 'Mortes',
        data: new Array(labels.length - 1).fill(0).concat([dados.mortes]),
        backgroundColor: new Array(labels.length - 1).fill('rgba(0,0,0,0)').concat(['rgba(255, 99, 132, 0.8)']),
        borderColor: new Array(labels.length - 1).fill('transparent').concat(['#FF6384']),
        borderWidth: 3,
        borderRadius: 10,
        yAxisID: 'y-quantidade',
        order: 3
      })
    }
  }

  // Dataset 4: Receptoras
  const receptorasLabels = []
  const receptorasData = []
  if (dados.receptorasChegaram > 0) {
    receptorasLabels.push('Rec. Chegaram')
    receptorasData.push(dados.receptorasChegaram)
  }
  if (dados.receptorasFaltamParir > 0) {
    receptorasLabels.push('Rec. Faltam Parir')
    receptorasData.push(dados.receptorasFaltamParir)
  }
  if (dados.receptorasFaltamDG > 0) {
    receptorasLabels.push('Rec. Faltam DG')
    receptorasData.push(dados.receptorasFaltamDG)
  }
  
  if (receptorasData.length > 0) {
    const currentLength = labels.length
    labels.push(...receptorasLabels)
    
    // Ajustar datasets existentes
    datasets.forEach(ds => {
      while (ds.data.length < labels.length) {
        ds.data.push(0)
        ds.backgroundColor.push('rgba(0,0,0,0)')
        ds.borderColor.push('transparent')
      }
    })
    
    const receptorasFullData = new Array(currentLength).fill(0).concat(receptorasData)
    const receptorasColors = ['#9966FF', '#FF9F40', '#C9CBCF'].slice(0, receptorasData.length)
    datasets.push({
      label: 'Receptoras',
      data: receptorasFullData,
      backgroundColor: new Array(currentLength).fill('rgba(0,0,0,0)').concat(receptorasColors.map(c => c + 'CC')),
      borderColor: new Array(currentLength).fill('transparent').concat(receptorasColors),
      borderWidth: 3,
      borderRadius: 10,
      yAxisID: 'y-quantidade',
      order: 4
    })
  }

  // Se não houver dados, retornar null
  if (datasets.length === 0 || labels.length === 0) {
    console.log('⚠️ Nenhum dado para gerar gráfico')
    console.log('   Relatórios selecionados:', relatorios)
    console.log('   Dados coletados:', JSON.stringify(dados, null, 2))
    return null
  }
  
  console.log(`📊 Gerando gráfico com ${datasets.length} dataset(s) e ${labels.length} label(s)`)
  console.log(`   Labels:`, labels)
  console.log(`   Datasets:`, datasets.map(d => ({ label: d.label, dataLength: d.data.length })))

  const config = {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Dados'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `📊 Resumo de Relatórios - ${period.startDate} a ${period.endDate}`,
          font: { size: 22, weight: 'bold', color: '#333333' },
          padding: { top: 20, bottom: 30 }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14, weight: 'bold' },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label || ''
              const value = context.parsed.y
              if (datasetLabel === 'Valor (R$)') {
                return `${datasetLabel}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
              return `${datasetLabel}: ${value}`
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        'y-valor': {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Valor (R$)',
            font: { size: 14, weight: 'bold', color: '#333333' }
          },
          grid: { color: '#E0E0E0', lineWidth: 1 },
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR')
            },
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        },
        'y-quantidade': {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade',
            font: { size: 14, weight: 'bold', color: '#333333' }
          },
          grid: { display: false },
          ticks: {
            stepSize: 1,
            font: { size: 11, weight: 'bold' },
            color: '#666666'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12, weight: 'bold' },
            color: '#666666',
            maxRotation: 45,
            minRotation: 0
          }
        }
      },
      layout: { padding: { left: 20, right: 20, top: 10, bottom: 20 } }
    }
  }

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config)
    console.log(`✅ Gráfico combinado gerado: ${imageBuffer.length} bytes`)
    return Buffer.from(imageBuffer)
  } catch (error) {
    console.error('❌ Erro ao gerar gráfico:', error)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, 'POST')
  }

  try {
    // Construir URL base
    const protocol = req.headers['x-forwarded-proto'] || (req.connection?.encrypted ? 'https' : 'http')
    const host = req.headers.host || `localhost:${process.env.PORT || 3020}`
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

    const { destinatarios: destinatarioIds, relatorios, period } = req.body

    if (!destinatarioIds || !Array.isArray(destinatarioIds) || destinatarioIds.length === 0) {
      return sendValidationError(res, 'Selecione pelo menos um destinatário')
    }

    if (!relatorios || !Array.isArray(relatorios) || relatorios.length === 0) {
      return sendValidationError(res, 'Selecione pelo menos um relatório')
    }

    if (!period || !period.startDate || !period.endDate) {
      return sendValidationError(res, 'Período é obrigatório')
    }

    // Buscar destinatários
    const destinatariosResult = await query(`
      SELECT * FROM destinatarios_relatorios 
      WHERE id = ANY($1::int[]) AND ativo = true
    `, [destinatarioIds])

    if (destinatariosResult.rows.length === 0) {
      return sendValidationError(res, 'Nenhum destinatário válido encontrado')
    }

    const destinatarios = destinatariosResult.rows
    const results = []

    // Verificar configurações
    const smtpConfigurado = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    const whatsappConfigurado = !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) || 
                                 !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    // Apenas Evolution API suporta envio de arquivos (Excel, imagens); Twilio requer URL pública
    const whatsappMediaDisponivel = !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)
    
    console.log(`\n🚀 ========== INÍCIO DO ENVIO DE RELATÓRIOS ==========`)
    console.log(`⚙️ Configurações:`)
    console.log(`   - SMTP configurado: ${smtpConfigurado ? '✅ Sim' : '❌ Não (configure SMTP_HOST, SMTP_USER, SMTP_PASS no .env)'}`)
    console.log(`   - WhatsApp configurado: ${whatsappConfigurado ? '✅ Sim' : '❌ Não (configure Evolution API ou Twilio no .env)'}`)
    console.log(`   - WhatsApp com arquivos (Excel): ${whatsappMediaDisponivel ? '✅ Sim (Evolution API)' : '❌ Não (use Evolution API para enviar Excel)'}`)
    
    console.log(`\n📋 Destinatários encontrados: ${destinatarios.length}`)
    if (destinatarios.length === 0) {
      console.error(`❌ ERRO: Nenhum destinatário encontrado!`)
      return sendError(res, 'Nenhum destinatário encontrado. Cadastre destinatários antes de enviar.', 400)
    }
    
    destinatarios.forEach((d, idx) => {
      console.log(`   ${idx + 1}. ${d.nome}`)
      console.log(`      📧 Email: ${d.email || '❌ não informado'}`)
      console.log(`      💬 WhatsApp: ${d.whatsapp || '❌ não informado'}`)
      console.log(`      ✅ Recebe Email: ${d.recebe_email ? 'SIM' : 'NÃO'}`)
      console.log(`      ✅ Recebe WhatsApp: ${d.recebe_whatsapp ? 'SIM' : 'NÃO'}`)
    })
    
    // Verificar se há pelo menos um destinatário configurado para receber
    const destinatariosComEmail = destinatarios.filter(d => d.recebe_email && d.email)
    const destinatariosComWhatsApp = destinatarios.filter(d => d.recebe_whatsapp && d.whatsapp)
    
    console.log(`\n📊 Análise:`)
    console.log(`   - Destinatários que recebem email: ${destinatariosComEmail.length}`)
    console.log(`   - Destinatários que recebem WhatsApp: ${destinatariosComWhatsApp.length}`)
    
    if (destinatariosComEmail.length === 0 && destinatariosComWhatsApp.length === 0) {
      console.error(`❌ ERRO: Nenhum destinatário está configurado para receber email ou WhatsApp!`)
      return sendError(res, 
        'Nenhum destinatário está configurado para receber. ' +
        'Marque "Recebe por Email" ou "Recebe por WhatsApp" nos destinatários selecionados.', 
        400
      )
    }
    
    if (destinatariosComEmail.length > 0 && !smtpConfigurado) {
      console.warn(`⚠️ AVISO: Há destinatários configurados para email, mas SMTP não está configurado!`)
    }
    
    if (destinatariosComWhatsApp.length > 0 && !whatsappConfigurado) {
      console.warn(`⚠️ AVISO: Há destinatários configurados para WhatsApp, mas WhatsApp não está configurado!`)
    }

    // Gerar relatórios em Excel para email
    const emailReports = []
    console.log(`📊 Relatórios selecionados: ${relatorios.join(', ')}`)
    const relatoriosCompletos = [
      'nf_entrada_saida',
      'nascimentos',
      'mortes',
      'pesagens',
      'resumo_pesagens',
      'previsoes_parto',
      'receptoras_chegaram',
      'receptoras_faltam_parir',
      'receptoras_faltam_diagnostico',
      'femeas_ia',
      'animais_piquetes',
      'transferencias_embrioes',
      'gestacoes',
      'exames_andrologicos',
      'resumo_exames_andrologicos',
      'coleta_fiv',
      'calendario_reprodutivo',
      'boletim_gado',
      'movimentacoes_financeiras',
      'estoque_semen',
      'vacinacoes',
      'genealogia',
      'agenda_atividades'
    ]

    // Gerar resumo para retorno (frontend)
    console.log(`\n📝 Gerando resumo para WhatsApp...`)
    let generalSummary
    try {
      generalSummary = await generateWhatsAppSummary(period, relatorios)
      if (!generalSummary || generalSummary.trim().length === 0) {
        console.warn('⚠️ Resumo vazio, gerando resumo básico...')
        generalSummary = `📧 Relatórios completos enviados por email.\n\n` +
                        `📊 *RESUMO DE RELATÓRIOS BEEF-SYNC*\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `📅 *Período:* ${formatBR(period.startDate)} a ${formatBR(period.endDate)}\n\n` +
                        `Relatórios selecionados:\n` +
                        relatorios.map(r => `• ${r}`).join('\n') +
                        `\n_Beef-Sync - Sistema de Gestão Pecuária_\n` +
                        `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`
      }
      console.log(`✅ Resumo gerado (${generalSummary.length} caracteres)`)
      console.log(`📝 Preview do resumo:\n${generalSummary.substring(0, 200)}...`)
    } catch (error) {
      console.error('❌ Erro ao gerar resumo:', error)
      generalSummary = `📧 Relatórios completos enviados por email.\n\n` +
                      `📊 *RESUMO DE RELATÓRIOS BEEF-SYNC*\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `📅 *Período:* ${formatBR(period.startDate)} a ${formatBR(period.endDate)}\n\n` +
                      `Relatórios selecionados:\n` +
                      relatorios.map(r => `• ${r}`).join('\n') +
                      `\n\n⚠️ Erro ao gerar resumo detalhado.\n` +
                      `\n_Beef-Sync - Sistema de Gestão Pecuária_\n` +
                      `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`
    }

    // Gerar gráfico resumido para WhatsApp
    console.log(`\n📊 Gerando gráfico resumido para WhatsApp...`)
    console.log(`   Relatórios para gráfico:`, relatorios)
    const summaryChartBuffer = await generateSummaryChart(period, relatorios)
    if (summaryChartBuffer) {
      console.log(`✅ Gráfico gerado com sucesso (${summaryChartBuffer.length} bytes)`)
    } else {
      console.warn(`⚠️ Nenhum gráfico foi gerado`)
      console.warn(`   Possíveis causas:`)
      console.warn(`   - Nenhum dado encontrado no período selecionado`)
      console.warn(`   - Relatórios selecionados não têm dados para gráfico`)
      console.warn(`   - Erro na geração do gráfico`)
    }

    for (const relatorio of relatorios) {
      if (relatoriosCompletos.includes(relatorio)) {
        try {
          let buffer
          let filename

          switch (relatorio) {
            case 'nf_entrada_saida':
              buffer = await generateNFReport(period)
              filename = `nf-entrada-saida-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'nascimentos':
              // Usar API existente
              const nascRes = await fetch(`${baseUrl}/api/contabilidade/nascimentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period })
              })
              if (!nascRes.ok) {
                throw new Error(`Erro ao gerar relatório de nascimentos: ${nascRes.status}`)
              }
              buffer = Buffer.from(await nascRes.arrayBuffer())
              filename = `nascimentos-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'previsoes_parto':
              const previsoesRes = await fetch(`${baseUrl}/api/previsoes-parto`)
              if (!previsoesRes.ok) {
                throw new Error(`Erro ao gerar relatório de previsões de parto: ${previsoesRes.status}`)
              }
              const previsoesData = await previsoesRes.json()
              buffer = await generatePrevisoesPartoReport(previsoesData.data || previsoesData)
              filename = `previsoes-parto-fiv-ia-${new Date().toISOString().split('T')[0]}.xlsx`
              break
            case 'mortes':
              const mortesRes = await fetch(`${baseUrl}/api/contabilidade/mortes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period })
              })
              if (!mortesRes.ok) {
                throw new Error(`Erro ao gerar relatório de mortes: ${mortesRes.status}`)
              }
              buffer = Buffer.from(await mortesRes.arrayBuffer())
              filename = `mortes-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'receptoras_chegaram':
              buffer = await generateReceptorasChegaramReport(period)
              filename = `receptoras-chegaram-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'receptoras_faltam_parir':
              buffer = await generateReceptorasFaltamParirReport()
              filename = `receptoras-faltam-parir-${new Date().toISOString().split('T')[0]}.xlsx`
              break
            case 'receptoras_faltam_diagnostico':
              buffer = await generateReceptorasFaltamDGReport(period)
              filename = `receptoras-faltam-dg-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'femeas_ia':
              buffer = await generateFemeasIAReport(period)
              filename = `femeas-ia-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'animais_piquetes':
              buffer = await generateAnimaisPiquetesReport(period)
              filename = `animais-piquetes-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'pesagens':
              buffer = await generatePesagensReport(period)
              filename = `pesagens-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'resumo_pesagens':
              buffer = await generateResumoPesagensReport(period)
              filename = `resumo-pesagens-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'transferencias_embrioes':
              buffer = await generateTransferenciasEmbrioesReport(period)
              filename = `transferencias-embrioes-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'gestacoes':
              buffer = await generateGestacoesReport(period)
              filename = `gestacoes-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'exames_andrologicos':
              buffer = await generateExamesAndrologicosReport(period)
              filename = `exames-andrologicos-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'resumo_exames_andrologicos':
              buffer = await generateResumoExamesAndrologicosReport(period)
              filename = `resumo-exames-andrologicos-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'boletim_gado':
              buffer = await generateBoletimGadoReport(period)
              filename = `boletim-gado-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'movimentacoes_financeiras':
              buffer = await generateMovimentacoesFinanceirasReport(period)
              filename = `movimentacoes-financeiras-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'estoque_semen':
              buffer = await generateEstoqueSemenReport(period)
              filename = `estoque-semen-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'vacinacoes':
              buffer = await generateVacinacoesReport(period)
              filename = `vacinacoes-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'genealogia':
              buffer = await generateGenealogiaReport(period)
              filename = `genealogia-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'coleta_fiv':
              buffer = await generateColetaFivReport(period)
              filename = `coleta-fiv-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'calendario_reprodutivo':
              buffer = await generateCalendarioReprodutivoReport(period, baseUrl)
              filename = `calendario-reprodutivo-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.xlsx`
              break
            case 'agenda_atividades':
              buffer = await generateAgendaAtividadesReport(baseUrl)
              filename = `agenda-atividades-dgt-${new Date().toISOString().split('T')[0]}.xlsx`
              break
            default:
              console.warn(`Relatório não implementado ou não suporta envio completo: ${relatorio}`)
          }

          if (buffer && filename) {
            emailReports.push({
              filename,
              content: buffer,
              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
          }
        } catch (error) {
          console.error(`Erro ao gerar relatório ${relatorio}:`, error)
        }
      }
    }

    // Enviar por email
    console.log(`\n📧 ========== INICIANDO ENVIO DE EMAILS ==========`)
    console.log(`📧 Total de destinatários para processar: ${destinatarios.length}`)
    console.log(`📧 Relatórios disponíveis para envio: ${emailReports.length}`)
    
    if (!smtpConfigurado) {
      console.error(`\n❌ ERRO CRÍTICO: SMTP não está configurado!`)
      console.error(`   Configure as seguintes variáveis no arquivo .env:`)
      console.error(`   - SMTP_HOST (ex: smtp.gmail.com)`)
      console.error(`   - SMTP_USER (seu email)`)
      console.error(`   - SMTP_PASS (sua senha ou senha de app)`)
      console.error(`   - SMTP_PORT (geralmente 587)`)
      console.error(`   - SMTP_SECURE (false para porta 587, true para 465)`)
    }
    
    if (emailReports.length === 0) {
      console.warn(`⚠️ AVISO: Nenhum relatório completo foi gerado para envio por email!`)
      console.warn(`   Relatórios selecionados: ${relatorios.join(', ')}`)
      console.warn(`   Relatórios completos disponíveis: ${relatoriosCompletos.join(', ')}`)
    }
    
    for (const destinatario of destinatarios) {
      console.log(`\n📧 Processando destinatário: ${destinatario.nome} (${destinatario.email})`)
      console.log(`   - recebe_email: ${destinatario.recebe_email}`)
      console.log(`   - recebe_whatsapp: ${destinatario.recebe_whatsapp}`)
      console.log(`   - whatsapp: ${destinatario.whatsapp || 'não informado'}`)
      console.log(`   - emailReports disponíveis: ${emailReports.length}`)
      
      if (destinatario.recebe_email) {
        if (!smtpConfigurado) {
          console.error(`❌ Não é possível enviar email: SMTP não configurado`)
          results.push({
            destinatario: destinatario.nome,
            email: 'erro: SMTP não configurado. Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env',
            whatsapp: 'não enviado'
          })
        } else if (emailReports.length === 0) {
          console.warn(`⚠️ Não é possível enviar email: Nenhum relatório foi gerado`)
          results.push({
            destinatario: destinatario.nome,
            email: 'erro: Nenhum relatório completo foi gerado para envio',
            whatsapp: 'não enviado'
          })
        } else {
          try {
            console.log(`📧 Tentando enviar email para ${destinatario.email}...`)
            const emailContent = generateEmailContent(
              destinatario,
              period,
              relatorios.filter(r => relatoriosCompletos.includes(r))
            )

            await sendEmail(
              destinatario,
              `Relatórios Beef-Sync - ${period.startDate} a ${period.endDate}`,
              emailContent,
              emailReports.map(r => ({
                filename: r.filename,
                content: r.content,
                contentType: r.contentType
              }))
            )

            console.log(`✅ Email enviado com sucesso para ${destinatario.email}`)
            results.push({
              destinatario: destinatario.nome,
              email: 'enviado',
              whatsapp: 'não enviado'
            })
          } catch (error) {
            console.error(`❌ Erro ao enviar email para ${destinatario.email}:`, error)
            console.error(`   Detalhes do erro:`, error.message)
            results.push({
              destinatario: destinatario.nome,
              email: `erro: ${error.message}`,
              whatsapp: 'não enviado'
            })
          }
        }
      } else {
        console.log(`⚠️ Email não enviado para ${destinatario.nome}: recebe_email está desabilitado`)
        if (!results.find(r => r.destinatario === destinatario.nome)) {
          results.push({
            destinatario: destinatario.nome,
            email: 'não enviado (recebe_email desabilitado)',
            whatsapp: 'não enviado'
          })
        }
      }

      // Enviar resumo + arquivos Excel por WhatsApp (igual ao email)
      if (destinatario.recebe_whatsapp && destinatario.whatsapp) {
        console.log(`\n💬 Processando WhatsApp para: ${destinatario.nome} (${destinatario.whatsapp})`)
        try {
          const summary = await generateWhatsAppSummary(period, relatorios)
          const recipient = { whatsapp: destinatario.whatsapp, name: destinatario.nome }
          let whatsappStatus = 'enviado'
          
          if (whatsappConfigurado) {
            // 1. Enviar resumo (gráfico se Evolution API, senão só texto)
            if (whatsappMediaDisponivel && summaryChartBuffer) {
              console.log(`📊 Enviando gráfico resumo para ${destinatario.whatsapp}...`)
              const chartFilename = `resumo-relatorios-${formatDateBR(period.startDate)}-${formatDateBR(period.endDate)}.png`
              await sendWhatsAppMedia(recipient, summaryChartBuffer, chartFilename, summary)
              console.log(`✅ Gráfico enviado`)
            } else {
              console.log(`💬 Enviando resumo texto para ${destinatario.whatsapp}...`)
              await sendWhatsApp(recipient, summary)
            }
            
            // 2. Enviar arquivos Excel por WhatsApp (igual ao email) - só com Evolution API
            if (whatsappMediaDisponivel && emailReports.length > 0) {
              console.log(`📎 Enviando ${emailReports.length} arquivo(s) Excel por WhatsApp...`)
              for (const report of emailReports) {
                try {
                  const caption = `📊 ${report.filename}\nPeríodo: ${formatDateBR(period.startDate)} a ${formatDateBR(period.endDate)}\n\nBeef-Sync - Relatórios`
                  await sendWhatsAppMedia(recipient, report.content, report.filename, caption)
                  console.log(`   ✅ ${report.filename}`)
                } catch (fileErr) {
                  console.error(`   ❌ Erro ao enviar ${report.filename}:`, fileErr.message)
                  whatsappStatus = 'enviado (alguns arquivos com erro)'
                }
              }
            }
          } else {
            console.log(`💬 Enviando WhatsApp texto (API não configurada - use Evolution para arquivos) para ${destinatario.whatsapp}...`)
            await sendWhatsApp(recipient, summary)
            whatsappStatus = 'enviado (sem gráfico)'
          }
          
          const existingResult = results.find(r => r.destinatario === destinatario.nome)
          if (existingResult) existingResult.whatsapp = whatsappStatus
          else results.push({ destinatario: destinatario.nome, email: 'não enviado', whatsapp: whatsappStatus })
        } catch (error) {
          console.error(`❌ Erro ao enviar WhatsApp para ${destinatario.whatsapp}:`, error)
          const existingResult = results.find(r => r.destinatario === destinatario.nome)
          const msg = `erro: ${error.message}`
          if (existingResult) existingResult.whatsapp = msg
          else results.push({ destinatario: destinatario.nome, email: 'não enviado', whatsapp: msg })
        }
      } else {
        console.log(`⚠️ WhatsApp não enviado para ${destinatario.nome}:`)
        if (!destinatario.recebe_whatsapp) {
          console.log(`   - recebe_whatsapp está desabilitado`)
        }
        if (!destinatario.whatsapp) {
          console.log(`   - WhatsApp não informado`)
        }
        if (!results.find(r => r.destinatario === destinatario.nome)) {
          results.push({
            destinatario: destinatario.nome,
            email: 'não enviado',
            whatsapp: 'não enviado (recebe_whatsapp desabilitado ou WhatsApp não informado)'
          })
        }
      }
    }

    // Verificar se houve algum envio bem-sucedido
    const emailsEnviados = results.filter(r => r.email === 'enviado').length
    const whatsappsEnviados = results.filter(r => r.whatsapp === 'enviado' || r.whatsapp === 'enviado (sem gráfico)').length
    const emailsComErro = results.filter(r => r.email && r.email.startsWith('erro')).length
    const whatsappsComErro = results.filter(r => r.whatsapp && r.whatsapp.startsWith('erro')).length
    
    console.log(`\n📊 ========== RESUMO FINAL DO ENVIO ==========`)
    console.log(`   ✅ Emails enviados: ${emailsEnviados}/${destinatarios.length}`)
    console.log(`   ✅ WhatsApps enviados: ${whatsappsEnviados}/${destinatarios.length}`)
    console.log(`   ❌ Emails com erro: ${emailsComErro}`)
    console.log(`   ❌ WhatsApps com erro: ${whatsappsComErro}`)
    console.log(`   📋 Total de resultados: ${results.length}`)
    
    // Atualizar último envio e relatórios enviados para destinatários com agendamento ativo
    for (const destinatario of destinatarios) {
      if (destinatario.agendamento_ativo) {
        const emailEnviado = results.find(r => r.destinatario === destinatario.nome)?.email === 'enviado'
        const whatsappEnviado = results.find(r => r.destinatario === destinatario.nome)?.whatsapp === 'enviado' || 
                                 results.find(r => r.destinatario === destinatario.nome)?.whatsapp === 'enviado (sem gráfico)'
        
        // Só atualizar se pelo menos um envio foi bem-sucedido
        if (emailEnviado || whatsappEnviado) {
          const agora = new Date()
          const proximoEnvio = new Date(agora)
          proximoEnvio.setDate(proximoEnvio.getDate() + (destinatario.intervalo_dias || 30))
          
          await query(`
            UPDATE destinatarios_relatorios
            SET ultimo_envio = $1,
                proximo_envio = $2,
                ultimos_relatorios = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [
            agora.toISOString(),
            proximoEnvio.toISOString(),
            JSON.stringify(relatorios),
            destinatario.id
          ])
          
          console.log(`✅ Agendamento atualizado para ${destinatario.nome}: próximo envio em ${destinatario.intervalo_dias} dias`)
        }
      }
    }
    
    if (emailsEnviados === 0 && whatsappsEnviados === 0) {
      console.error(`\n❌ ========== NENHUM ENVIO REALIZADO ==========`)
      console.error(`   Possíveis causas:`)
      if (!smtpConfigurado && destinatariosComEmail.length > 0) {
        console.error(`   - SMTP não configurado (mas há destinatários para email)`)
      }
      if (!whatsappConfigurado && destinatariosComWhatsApp.length > 0) {
        console.error(`   - WhatsApp não configurado (mas há destinatários para WhatsApp)`)
      }
      if (emailReports.length === 0) {
        console.error(`   - Nenhum relatório completo foi gerado`)
      }
      console.error(`   ============================================\n`)
    } else {
      console.log(`\n✅ ========== ENVIO CONCLUÍDO COM SUCESSO ==========\n`)
    }
    
    let message = 'Relatórios processados'
    if (emailsEnviados > 0 || whatsappsEnviados > 0) {
      message = `Relatórios enviados: ${emailsEnviados} email(s), ${whatsappsEnviados} WhatsApp(s)`
    } else {
      message = 'Nenhum relatório foi enviado. Verifique as configurações e os destinatários selecionados.'
    }

    console.log(`\n📤 Retornando resposta ao frontend:`)
    console.log(`   - Resumo gerado: ${generalSummary ? 'Sim (' + generalSummary.length + ' caracteres)' : 'Não'}`)
    console.log(`   - Gráfico gerado: ${summaryChartBuffer ? 'Sim (' + summaryChartBuffer.length + ' bytes)' : 'Não'}`)
    console.log(`   - Emails enviados: ${emailsEnviados}`)
    console.log(`   - WhatsApps enviados: ${whatsappsEnviados}`)
    
    return sendSuccess(res, {
      success: true,
      message,
      results,
      summary: generalSummary || 'Nenhum resumo disponível para os relatórios selecionados.',
      chartImage: summaryChartBuffer ? `data:image/png;base64,${summaryChartBuffer.toString('base64')}` : null,
      stats: {
        totalDestinatarios: destinatarios.length,
        emailsEnviados,
        whatsappsEnviados,
        emailsComErro: results.filter(r => r.email && r.email.startsWith('erro')).length,
        whatsappsComErro: results.filter(r => r.whatsapp && r.whatsapp.startsWith('erro')).length
      }
    })
  } catch (error) {
    console.error('Erro ao enviar relatórios:', error)
    return sendError(res, `Erro ao enviar relatórios: ${error.message}`, 500)
  }
}
