/**
 * Gera o workbook Excel do Boletim Campo com todas as abas e gráficos
 * Usado por download-excel e enviar-whatsapp
 */
import ExcelJS from 'exceljs'
import { Chart, registerables } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'

Chart.register(...registerables)

const HEADERS = ['LOCAL', 'LOCAL 1', 'SUB_LOCAL_2', 'QUANT.', 'SEXO', 'CATEGORIA', 'RAÇA', 'ERA', 'OBSERVAÇÃO']
const CHART_SIZE = { width: 700, height: 380 }
const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#22c55e', '#ec4899']

// Paleta de cores para o relatório
const CORES = {
  titulo: { argb: 'FF1E3A5F' },
  header: { argb: 'FFFF8C42' },
  headerAlt: { argb: 'FF059669' },
  zebra1: { argb: 'FFFFFFFF' },
  zebra2: { argb: 'FFF0FDF4' },
  total: { argb: 'FFD1FAE5' },
  resumoCard1: { argb: 'FFDBEAFE' },
  resumoCard2: { argb: 'FFFCE7F3' },
  resumoCard3: { argb: 'FFD1FAE5' },
  resumoCard4: { argb: 'FFFEF3C7' },
  resumoCard5: { argb: 'FFE0E7FF' },
  era: { argb: 'FF0D9488' },
  raca: { argb: 'FF7C3AED' },
  sexo: { argb: 'FFEC4899' },
  piquete: { argb: 'FFF59E0B' },
  categoria: { argb: 'FF3B82F6' },
  historico: { argb: 'FF64748B' }
}

function addSheetHeader(sheet, headers, cor = CORES.header) {
  sheet.getRow(1).values = headers
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: cor }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  sheet.getRow(1).height = 24
}

export async function generateBoletimCampoWorkbook(dados, historico = []) {
  const dadosComQuant = dados.filter((r) => (r.quant || 0) > 0)
  const totalGeral = dadosComQuant.reduce((s, r) => s + (r.quant || 0), 0)

  // Pré-calcular agrupamentos para Resumo e demais abas
  const categoriasAlvo = [
    { key: 'TOURO', matchCat: (c) => /^TOURO/i.test(c), matchRaca: () => false },
    { key: 'NOVILHA', matchCat: (c) => /^NOVILHA/i.test(c), matchRaca: () => false },
    { key: 'RECEPTORA', matchCat: (c) => /^RECEPTORA/i.test(c), matchRaca: (r) => /^RECEPTORA/i.test((r || '').trim()) },
    { key: 'BEZERRA', matchCat: (c) => /BEZERRA/i.test(c), matchRaca: () => false },
    { key: 'BEZERRO', matchCat: (c) => /BEZERRO/i.test(c), matchRaca: () => false }
  ]
  const porCat = { TOURO: 0, NOVILHA: 0, RECEPTORA: 0, BEZERRO: 0, BEZERRA: 0 }
  dadosComQuant.forEach((r) => {
    const cat = (r.categoria || '').trim()
    const raca = (r.raca || '').trim()
    const q = r.quant || 0
    for (const { key, matchCat, matchRaca } of categoriasAlvo) {
      if (matchCat(cat) || matchRaca(raca)) {
        porCat[key] += q
        break
      }
    }
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Beef-Sync'
  workbook.created = new Date()

  // --- ABA 1: Boletim Campo (só quant > 0 + TOTAL GERAL) ---
  const sheetPrincipal = workbook.addWorksheet('Boletim Campo')
  sheetPrincipal.properties.tabColor = { argb: 'FF059669' }
  sheetPrincipal.mergeCells('A1:I1')
  sheetPrincipal.getCell('A1').value = `🐄 BOLETIM CAMPO - ${new Date().toLocaleDateString('pt-BR')}`
  sheetPrincipal.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  sheetPrincipal.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.titulo }
  sheetPrincipal.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheetPrincipal.getRow(1).height = 28
  sheetPrincipal.getRow(2).values = HEADERS
  sheetPrincipal.getRow(2).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.header }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })
  sheetPrincipal.getRow(2).height = 24
  sheetPrincipal.views = [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }]

  dadosComQuant.forEach((row, idx) => {
    const r = sheetPrincipal.getRow(idx + 3)
    const q = row.quant || 0
    let zebra = idx % 2 === 0 ? CORES.zebra1 : CORES.zebra2
    if (q > 100) zebra = { argb: 'FFD1FAE5' }
    else if (q > 50) zebra = { argb: 'FFFEF3C7' }
    r.values = [
      row.local || '',
      row.local_1 || '',
      row.sub_local_2 || '',
      q,
      row.sexo || '',
      row.categoria || '',
      row.raca || '',
      row.era || '',
      row.observacao || ''
    ]
    r.eachCell((cell, colNumber) => {
      if (colNumber === 4) {
        cell.numFmt = '#,##0'
        if (q > 100) cell.font = { bold: true }
      }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
  })
  const rowTotal = sheetPrincipal.getRow(dadosComQuant.length + 3)
  rowTotal.values = ['TOTAL GERAL', '', '', totalGeral, '', '', '', '', '']
  rowTotal.font = { bold: true, size: 12 }
  rowTotal.eachCell((cell, colNumber) => {
    if (colNumber === 4) cell.numFmt = '#,##0'
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } }
  })
  rowTotal.height = 22
  sheetPrincipal.columns = [
    { width: 22 }, { width: 20 }, { width: 18 }, { width: 10 }, { width: 8 },
    { width: 14 }, { width: 14 }, { width: 12 }, { width: 28 }
  ]
  if (dadosComQuant.length > 0) {
    sheetPrincipal.autoFilter = { from: { row: 2, column: 1 }, to: { row: dadosComQuant.length + 2, column: 9 } }
  }

  // --- ABA 2: RESUMO ---
  const sheetResumo = workbook.addWorksheet('Resumo')
  sheetResumo.properties.tabColor = { argb: 'FF3B82F6' }
  sheetResumo.mergeCells('A1:B1')
  sheetResumo.getCell('A1').value = '📊 RESUMO EXECUTIVO'
  sheetResumo.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  sheetResumo.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.titulo }
  sheetResumo.getCell('A1').alignment = { horizontal: 'center' }
  sheetResumo.getRow(1).height = 26
  const resumoCards = [
    { label: 'Total de cabeças', valor: totalGeral, cor: CORES.resumoCard1 },
    { label: 'Registros (piquetes/locais)', valor: dadosComQuant.length, cor: CORES.resumoCard1 },
    { label: 'Data e hora', valor: new Date().toLocaleString('pt-BR'), cor: CORES.resumoCard2 },
    { label: 'Touros', valor: porCat.TOURO, cor: CORES.resumoCard3 },
    { label: 'Novilhas', valor: porCat.NOVILHA, cor: CORES.resumoCard2 },
    { label: 'Receptoras', valor: porCat.RECEPTORA, cor: CORES.resumoCard3 },
    { label: 'Bezerros', valor: porCat.BEZERRO, cor: CORES.resumoCard4 },
    { label: 'Bezerras', valor: porCat.BEZERRA, cor: CORES.resumoCard4 }
  ]
  resumoCards.forEach((card, i) => {
    const row = i + 2
    sheetResumo.getRow(row).values = [card.label, card.valor]
    sheetResumo.getRow(row).eachCell((cell, col) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: card.cor }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      if (col === 2 && typeof card.valor === 'number') cell.numFmt = '#,##0'
    })
    sheetResumo.getRow(row).height = 22
  })
  sheetResumo.columns = [{ width: 30 }, { width: 20 }]

  // --- ABA 3: QUANTIDADE POR ERA ---
  const porEra = {}
  dadosComQuant.forEach((r) => {
    const era = r.era || '(sem era)'
    porEra[era] = (porEra[era] || 0) + (r.quant || 0)
  })
  const sheetEra = workbook.addWorksheet('Quantidade por Era')
  sheetEra.properties.tabColor = { argb: 'FF0D9488' }
  addSheetHeader(sheetEra, ['ERA', 'QUANTIDADE'], CORES.era)
  Object.entries(porEra)
    .sort((a, b) => b[1] - a[1])
    .forEach(([era, qtd], i) => {
      const r = sheetEra.getRow(i + 2)
      r.values = [era, qtd]
      const zebra = i % 2 === 0 ? CORES.zebra1 : CORES.zebra2
      r.eachCell((c, col) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (col === 2) c.numFmt = '#,##0'
      })
    })
  const eraTotalRow = sheetEra.getRow(Object.keys(porEra).length + 2)
  eraTotalRow.values = ['TOTAL', totalGeral]
  eraTotalRow.font = { bold: true }
  eraTotalRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (col === 2) c.numFmt = '#,##0'
  })
  sheetEra.columns = [{ width: 20 }, { width: 14 }]

  // --- ABA 4: RAÇA ---
  const porRaca = {}
  dadosComQuant.forEach((r) => {
    const raca = r.raca || '(sem raça)'
    porRaca[raca] = (porRaca[raca] || 0) + (r.quant || 0)
  })
  const sheetRaca = workbook.addWorksheet('Raça')
  sheetRaca.properties.tabColor = { argb: 'FF7C3AED' }
  addSheetHeader(sheetRaca, ['RAÇA', 'QUANTIDADE'], CORES.raca)
  Object.entries(porRaca)
    .sort((a, b) => b[1] - a[1])
    .forEach(([raca, qtd], i) => {
      const r = sheetRaca.getRow(i + 2)
      r.values = [raca, qtd]
      const zebra = i % 2 === 0 ? CORES.zebra1 : CORES.zebra2
      r.eachCell((c, col) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (col === 2) c.numFmt = '#,##0'
      })
    })
  const racaTotalRow = sheetRaca.getRow(Object.keys(porRaca).length + 2)
  racaTotalRow.values = ['TOTAL', totalGeral]
  racaTotalRow.font = { bold: true }
  racaTotalRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (col === 2) c.numFmt = '#,##0'
  })
  sheetRaca.columns = [{ width: 22 }, { width: 14 }]

  // --- ABA 5: SEXO ---
  const porSexo = {}
  dadosComQuant.forEach((r) => {
    const sexo = r.sexo || '(sem sexo)'
    porSexo[sexo] = (porSexo[sexo] || 0) + (r.quant || 0)
  })
  const sheetSexo = workbook.addWorksheet('Sexo')
  sheetSexo.properties.tabColor = { argb: 'FFEC4899' }
  addSheetHeader(sheetSexo, ['SEXO', 'QUANTIDADE'], CORES.sexo)
  Object.entries(porSexo)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sexo, qtd], i) => {
      const r = sheetSexo.getRow(i + 2)
      r.values = [sexo, qtd]
      const zebra = i % 2 === 0 ? CORES.zebra1 : CORES.zebra2
      r.eachCell((c, col) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (col === 2) c.numFmt = '#,##0'
      })
    })
  const sexoTotalRow = sheetSexo.getRow(Object.keys(porSexo).length + 2)
  sexoTotalRow.values = ['TOTAL', totalGeral]
  sexoTotalRow.font = { bold: true }
  sexoTotalRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (col === 2) c.numFmt = '#,##0'
  })
  sheetSexo.columns = [{ width: 18 }, { width: 14 }]

  // --- ABA 6: QUANTIDADE POR PIQUETE E TOTAL DE CABEÇAS ---
  const porPiquete = {}
  dadosComQuant.forEach((r) => {
    const piquete = r.local || r.local_1 || '(sem local)'
    porPiquete[piquete] = (porPiquete[piquete] || 0) + (r.quant || 0)
  })
  const sheetPiquete = workbook.addWorksheet('Por Piquete e Total')
  sheetPiquete.properties.tabColor = { argb: 'FFF59E0B' }
  addSheetHeader(sheetPiquete, ['PIQUETE/LOCAL', 'QUANTIDADE'], CORES.piquete)
  Object.entries(porPiquete)
    .sort((a, b) => b[1] - a[1])
    .forEach(([piquete, qtd], i) => {
      const r = sheetPiquete.getRow(i + 2)
      r.values = [piquete, qtd]
      const zebra = i % 2 === 0 ? CORES.zebra1 : CORES.zebra2
      r.eachCell((c, col) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (col === 2) c.numFmt = '#,##0'
      })
    })
  const piqueteTotalRow = sheetPiquete.getRow(Object.keys(porPiquete).length + 2)
  piqueteTotalRow.values = ['TOTAL DE CABEÇAS', totalGeral]
  piqueteTotalRow.font = { bold: true }
  piqueteTotalRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (col === 2) c.numFmt = '#,##0'
  })
  sheetPiquete.columns = [{ width: 28 }, { width: 14 }]

  // --- ABA 7: QTOS TOUROS, NOVILHAS, RECEPTORAS, BEZERROS, BEZERRAS ---
  const sheetCat = workbook.addWorksheet('Touros Novilhas Receptoras')
  sheetCat.properties.tabColor = { argb: 'FF3B82F6' }
  addSheetHeader(sheetCat, ['CATEGORIA', 'QUANTIDADE'], CORES.categoria)
  const catCores = [CORES.resumoCard3, CORES.resumoCard2, CORES.resumoCard3, CORES.resumoCard4, CORES.resumoCard4]
  categoriasAlvo.forEach(({ key }, i) => {
    const r = sheetCat.getRow(i + 2)
    r.values = [key, porCat[key] || 0]
    r.eachCell((c, col) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: catCores[i] || CORES.zebra2 }
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      if (col === 2) c.numFmt = '#,##0'
    })
  })
  const catTotalRow = sheetCat.getRow(categoriasAlvo.length + 2)
  catTotalRow.values = ['TOTAL', totalGeral]
  catTotalRow.font = { bold: true }
  catTotalRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.total }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (col === 2) c.numFmt = '#,##0'
  })
  sheetCat.columns = [{ width: 18 }, { width: 14 }]

  // --- ABA 8: HISTORICO DA ALTERAÇÕES FEITAS ---
  const sheetHist = workbook.addWorksheet('Histórico Alterações')
  sheetHist.properties.tabColor = { argb: 'FF64748B' }
  const histHeaders = ['Data', 'Tipo', 'Origem', 'Destino', 'Motivo', 'Qtd', 'Usuário', 'Observação']
  addSheetHeader(sheetHist, histHeaders, CORES.historico)
  historico.forEach((m, i) => {
    const origem = [m.local, m.local_1, m.sub_local_2].filter(Boolean).join(' / ') || '-'
    const destino = [m.destino_local, m.destino_sub_local].filter(Boolean).join(' / ') || '-'
    const r = sheetHist.getRow(i + 2)
    r.values = [
      m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : '',
      m.tipo || '',
      origem,
      destino,
      m.motivo || '',
      m.quantidade || 0,
      m.usuario || '',
      m.observacao || ''
    ]
    const zebra = i % 2 === 0 ? CORES.zebra1 : CORES.zebra2
    r.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: zebra }
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
  })
  if (historico.length === 0) {
    sheetHist.getRow(2).values = ['Nenhuma alteração registrada', '', '', '', '', '', '', '']
    sheetHist.getRow(2).eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.zebra2 }
    })
  }
  sheetHist.columns = [{ width: 18 }, { width: 10 }, { width: 22 }, { width: 22 }, { width: 12 }, { width: 8 }, { width: 14 }, { width: 24 }]

  // --- ABA 10: GRÁFICOS ---
  if (totalGeral > 0) {
    const sheetGraficos = workbook.addWorksheet('Gráficos')
    sheetGraficos.properties.tabColor = { argb: 'FF10B981' }
    sheetGraficos.getCell('A1').value = '📈 GRÁFICOS DO BOLETIM CAMPO'
    sheetGraficos.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    sheetGraficos.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.titulo }
    sheetGraficos.mergeCells('A1:B1')
    sheetGraficos.getRow(1).height = 26
    const canvas = new ChartJSNodeCanvas({ ...CHART_SIZE, backgroundColour: 'white' })
    let rowOffset = 2

    // Gráfico Pizza - Por Raça
    const racaEntries = Object.entries(porRaca).sort((a, b) => b[1] - a[1]).slice(0, 8)
    if (racaEntries.length > 0) {
      const racaBuffer = await canvas.renderToBuffer({
        type: 'pie',
        data: {
          labels: racaEntries.map(([l]) => l),
          datasets: [{ data: racaEntries.map(([, v]) => v), backgroundColor: COLORS.slice(0, racaEntries.length) }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Quantidade por Raça', font: { size: 14 } },
            legend: { position: 'bottom' }
          }
        }
      })
      const imgId = workbook.addImage({ buffer: racaBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Pizza - Por Sexo
    const sexoEntries = Object.entries(porSexo)
    if (sexoEntries.length > 0) {
      const sexoBuffer = await canvas.renderToBuffer({
        type: 'doughnut',
        data: {
          labels: sexoEntries.map(([l]) => l),
          datasets: [{ data: sexoEntries.map(([, v]) => v), backgroundColor: ['#ec4899', '#3b82f6', '#22c55e'] }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Quantidade por Sexo', font: { size: 14 } },
            legend: { position: 'bottom' }
          }
        }
      })
      const imgId = workbook.addImage({ buffer: sexoBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Barras - Por Era
    const eraEntries = Object.entries(porEra).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (eraEntries.length > 0) {
      const eraBuffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
          labels: eraEntries.map(([l]) => l),
          datasets: [{ label: 'Quantidade', data: eraEntries.map(([, v]) => v), backgroundColor: '#10b981' }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Quantidade por Era', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { ticks: { maxRotation: 45 } } }
        }
      })
      const imgId = workbook.addImage({ buffer: eraBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Barras - Por Piquete/Local
    const piqueteEntries = Object.entries(porPiquete).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (piqueteEntries.length > 0) {
      const piqueteBuffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
          labels: piqueteEntries.map(([l]) => l.length > 20 ? l.substring(0, 20) + '...' : l),
          datasets: [{ label: 'Cabeças', data: piqueteEntries.map(([, v]) => v), backgroundColor: '#f59e0b' }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Quantidade por Piquete/Local', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { ticks: { maxRotation: 45 } } }
        }
      })
      const imgId = workbook.addImage({ buffer: piqueteBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Pizza - Touros, Novilhas, Receptoras, Bezerros, Bezerras
    const catTotal = categoriasAlvo.reduce((s, { key }) => s + (porCat[key] || 0), 0)
    if (catTotal > 0) {
      const catLabels = categoriasAlvo.map(({ key }) => key.charAt(0) + key.slice(1).toLowerCase())
      const catData = categoriasAlvo.map(({ key }) => porCat[key] || 0)
      const catBuffer = await canvas.renderToBuffer({
        type: 'pie',
        data: {
          labels: catLabels,
          datasets: [{
            data: catData,
            backgroundColor: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6']
          }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Por Categoria', font: { size: 14 } },
            legend: { position: 'bottom' }
          }
        }
      })
      const imgId = workbook.addImage({ buffer: catBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Barras Horizontais - Top 12 Raças
    const racaBarEntries = Object.entries(porRaca).sort((a, b) => b[1] - a[1]).slice(0, 12)
    if (racaBarEntries.length > 0) {
      const racaBarBuffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
          labels: racaBarEntries.map(([l]) => l.length > 15 ? l.substring(0, 15) + '...' : l),
          datasets: [{ label: 'Cabeças', data: racaBarEntries.map(([, v]) => v), backgroundColor: '#6366f1' }]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            title: { display: true, text: 'Top Raças (barras)', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { beginAtZero: true } }
        }
      })
      const imgId = workbook.addImage({ buffer: racaBarBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Barras - Por Categoria (Touros, Novilhas, etc)
    if (catTotal > 0) {
      const catBarBuffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
          labels: categoriasAlvo.map(({ key }) => key),
          datasets: [{
            label: 'Quantidade',
            data: categoriasAlvo.map(({ key }) => porCat[key] || 0),
            backgroundColor: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6']
          }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Categorias (barras)', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { ticks: { maxRotation: 45 } }, y: { beginAtZero: true } }
        }
      })
      const imgId = workbook.addImage({ buffer: catBarBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Rosca - Por Era
    const eraPieEntries = Object.entries(porEra).sort((a, b) => b[1] - a[1]).slice(0, 8)
    if (eraPieEntries.length > 0) {
      const eraPieBuffer = await canvas.renderToBuffer({
        type: 'doughnut',
        data: {
          labels: eraPieEntries.map(([l]) => l),
          datasets: [{ data: eraPieEntries.map(([, v]) => v), backgroundColor: COLORS.slice(0, eraPieEntries.length) }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Distribuição por Era', font: { size: 14 } },
            legend: { position: 'bottom' }
          }
        }
      })
      const imgId = workbook.addImage({ buffer: eraPieBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico Barras Horizontais - Top 12 Piquetes/Locais
    const piqueteBarEntries = Object.entries(porPiquete).sort((a, b) => b[1] - a[1]).slice(0, 12)
    if (piqueteBarEntries.length > 0) {
      const piqueteBarBuffer = await canvas.renderToBuffer({
        type: 'bar',
        data: {
          labels: piqueteBarEntries.map(([l]) => l.length > 18 ? l.substring(0, 18) + '...' : l),
          datasets: [{ label: 'Cabeças', data: piqueteBarEntries.map(([, v]) => v), backgroundColor: '#0d9488' }]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            title: { display: true, text: 'Top Piquetes/Locais', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { beginAtZero: true } }
        }
      })
      const imgId = workbook.addImage({ buffer: piqueteBarBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
      rowOffset += 20
    }

    // Gráfico de Linha - Evolução por Era (ordenado)
    if (eraEntries.length > 0) {
      const eraLineBuffer = await canvas.renderToBuffer({
        type: 'line',
        data: {
          labels: eraEntries.map(([l]) => l),
          datasets: [{
            label: 'Quantidade',
            data: eraEntries.map(([, v]) => v),
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Quantidade por Era (linha)', font: { size: 14 } },
            legend: { display: false }
          },
          scales: { x: { ticks: { maxRotation: 45 } }, y: { beginAtZero: true } }
        }
      })
      const imgId = workbook.addImage({ buffer: eraLineBuffer, extension: 'png' })
      sheetGraficos.addImage(imgId, { tl: { col: 0.2, row: rowOffset }, ext: CHART_SIZE })
    }
  }

  // Links interativos no Resumo (após todas as abas criadas)
  const resumoSheet = workbook.getWorksheet('Resumo')
  if (resumoSheet) {
    resumoSheet.getRow(11).height = 14
    resumoSheet.getCell('A12').value = { formula: 'HYPERLINK("#\'Boletim Campo\'!A1","📋 Ir para Boletim Campo")' }
    resumoSheet.getCell('A12').font = { color: { argb: 'FF2563EB' }, underline: true }
    resumoSheet.getCell('A12').fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.resumoCard5 }
    resumoSheet.getCell('A12').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    if (totalGeral > 0 && workbook.getWorksheet('Gráficos')) {
      resumoSheet.getCell('A13').value = { formula: 'HYPERLINK("#\'Gráficos\'!A1","📊 Ir para Gráficos")' }
      resumoSheet.getCell('A13').font = { color: { argb: 'FF2563EB' }, underline: true }
      resumoSheet.getCell('A13').fill = { type: 'pattern', pattern: 'solid', fgColor: CORES.resumoCard5 }
      resumoSheet.getCell('A13').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    }
  }

  return workbook
}
