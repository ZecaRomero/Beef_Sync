import ExcelJS from 'exceljs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { startDate, endDate } = req.body

    // Buscar pesagens
    const pesagensRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020'}/api/pesagens`)
    const pesagensData = await pesagensRes.json()
    const todasPesagens = Array.isArray(pesagensData) ? pesagensData : pesagensData.pesagens || pesagensData.data || []

    // Filtrar por período
    const pesagens = todasPesagens.filter(p => {
      const dataPesagem = p.data || ''
      return dataPesagem >= startDate && dataPesagem <= endDate
    })

    // Criar workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Beef Sync'
    workbook.created = new Date()

    // Função para extrair local
    const extrairLocal = (obs) => {
      if (!obs) return 'Não informado'
      const sNorm = obs.replace(/CONFINAÇÃO/gi, 'CONFINA').replace(/CONFINACAO/gi, 'CONFINA')
      const match = sNorm.match(/(PIQUETE\s*\d+|PROJETO\s*[\dA-Za-z\-]+|CONFINA\w*|GUARITA|CABANHA|PISTA\s*\d*)/i)
      if (match) {
        let loc = match[1].trim().toUpperCase().replace(/\s+/g, ' ')
        if (/^CONFINA/.test(loc)) loc = 'CONFINA'
        if (/^PIQUETE\s+\d+$/.test(loc)) loc = loc.replace(/^PIQUETE\s+/i, 'PROJETO ')
        return loc
      }
      return obs.length <= 35 ? obs.toUpperCase() : obs.substring(0, 35).toUpperCase()
    }

    // Última pesagem de cada animal (igual ao dashboard)
    const porAnimalUltima = {}
    pesagens.forEach(p => {
      const aid = p.animal_id ?? p.animal ?? `f${(p.peso || 0)}-${p.data || ''}`
      const d = p.data || ''
      const prev = porAnimalUltima[aid]
      if (!prev || (d > (prev.data || '')) || (d === (prev.data || '') && (p.created_at || '') > (prev.created_at || ''))) {
        porAnimalUltima[aid] = p
      }
    })
    const pesagensUltima = Object.values(porAnimalUltima)

    // Estatísticas gerais
    const machos = pesagens.filter(p => p.animal_sexo === 'Macho')
    const femeas = pesagens.filter(p => p.animal_sexo === 'Fêmea')
    const pesos = pesagens.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
    const pesoMedio = pesos.length > 0 ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : 0
    const pesoMin = pesos.length > 0 ? Math.min(...pesos).toFixed(1) : 0
    const pesoMax = pesos.length > 0 ? Math.max(...pesos).toFixed(1) : 0
    const ceValores = pesagens.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
    const ceMedio = ceValores.length > 0 ? (ceValores.reduce((a, b) => a + b, 0) / ceValores.length).toFixed(1) : '-'

    // Agrupar por local (última pesagem por animal + normalizar PIQUETE X → PROJETO X)
    const porLocal = {}
    pesagensUltima.forEach(p => {
      const local = extrairLocal(p.observacoes)
      if (!porLocal[local]) porLocal[local] = []
      porLocal[local].push(p)
    })

    // ===== ABA 1: DASHBOARD =====
    const sheetDash = workbook.addWorksheet('📊 Dashboard')

    // Título principal
    sheetDash.mergeCells('A1:H1')
    const dashTitle = sheetDash.getCell('A1')
    dashTitle.value = '📊 DASHBOARD DE PESAGENS'
    dashTitle.font = { name: 'Calibri', size: 24, bold: true, color: { argb: 'FFFFFFFF' } }
    dashTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } }
    dashTitle.alignment = { vertical: 'middle', horizontal: 'center' }
    sheetDash.getRow(1).height = 40

    // Período
    sheetDash.mergeCells('A2:H2')
    const dashPeriod = sheetDash.getCell('A2')
    dashPeriod.value = `📅 Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`
    dashPeriod.font = { name: 'Calibri', size: 12, italic: true }
    dashPeriod.alignment = { horizontal: 'center' }
    sheetDash.getRow(2).height = 25

    // Cards de estatísticas
    let row = 4
    const cards = [
      { label: 'TOTAL DE PESAGENS', value: pesagens.length, color: 'FF6366F1', icon: '📊' },
      { label: 'MACHOS', value: machos.length, color: 'FF3B82F6', icon: '♂️' },
      { label: 'FÊMEAS', value: femeas.length, color: 'FFEC4899', icon: '♀️' },
      { label: 'PESO MÉDIO', value: `${pesoMedio} kg`, color: 'FFF59E0B', icon: '⚖️' }
    ]

    cards.forEach((card, idx) => {
      const col = String.fromCharCode(65 + idx * 2) // A, C, E, G
      sheetDash.mergeCells(`${col}${row}:${String.fromCharCode(col.charCodeAt(0) + 1)}${row + 1}`)
      const cell = sheetDash.getCell(`${col}${row}`)
      cell.value = `${card.icon} ${card.label}\n${card.value}`
      cell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.color } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      sheetDash.getRow(row).height = 50
    })

    row += 3

    // Distribuição por sexo
    sheetDash.mergeCells(`A${row}:D${row}`)
    const sexoTitle = sheetDash.getCell(`A${row}`)
    sexoTitle.value = '📈 DISTRIBUIÇÃO POR SEXO'
    sexoTitle.font = { name: 'Calibri', size: 14, bold: true }
    sexoTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
    sexoTitle.alignment = { horizontal: 'center' }
    row++

    const sexoData = [
      ['Sexo', 'Quantidade', '% do Total', 'Peso Médio'],
      ['♂️ Machos', machos.length, `${((machos.length / pesagens.length) * 100).toFixed(1)}%`, `${(machos.reduce((s, p) => s + parseFloat(p.peso || 0), 0) / machos.length).toFixed(1)} kg`],
      ['♀️ Fêmeas', femeas.length, `${((femeas.length / pesagens.length) * 100).toFixed(1)}%`, `${(femeas.reduce((s, p) => s + parseFloat(p.peso || 0), 0) / femeas.length).toFixed(1)} kg`]
    ]

    sexoData.forEach((rowData, idx) => {
      const r = sheetDash.getRow(row + idx)
      r.values = ['', ...rowData]
      if (idx === 0) {
        r.font = { bold: true }
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }
      } else {
        r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx === 1 ? 'FFDBEAFE' : 'FFFCE7F3' } }
      }
      r.alignment = { horizontal: 'center' }
    })

    row += 4

    // Top 5 Piquetes
    const top5Locais = Object.entries(porLocal)
      .map(([local, dados]) => ({
        local,
        qtd: dados.length,
        pesoMedio: (dados.reduce((s, p) => s + parseFloat(p.peso || 0), 0) / dados.length).toFixed(1)
      }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)

    sheetDash.mergeCells(`A${row}:D${row}`)
    const topTitle = sheetDash.getCell(`A${row}`)
    topTitle.value = '🏆 TOP 5 PIQUETES COM MAIS PESAGENS'
    topTitle.font = { name: 'Calibri', size: 14, bold: true }
    topTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
    topTitle.alignment = { horizontal: 'center' }
    row++

    const topHeaders = ['Posição', 'Piquete', 'Quantidade', 'Peso Médio']
    sheetDash.getRow(row).values = ['', ...topHeaders]
    sheetDash.getRow(row).font = { bold: true }
    sheetDash.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }
    sheetDash.getRow(row).alignment = { horizontal: 'center' }
    row++

    top5Locais.forEach((item, idx) => {
      const r = sheetDash.getRow(row + idx)
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`
      r.values = ['', medal, item.local, item.qtd, `${item.pesoMedio} kg`]
      r.alignment = { horizontal: 'center' }
      if (idx < 3) {
        r.font = { bold: true }
      }
    })

    // Ajustar larguras Dashboard
    sheetDash.getColumn(1).width = 2
    sheetDash.getColumn(2).width = 20
    sheetDash.getColumn(3).width = 20
    sheetDash.getColumn(4).width = 15
    sheetDash.getColumn(5).width = 15
    sheetDash.getColumn(6).width = 20
    sheetDash.getColumn(7).width = 20
    sheetDash.getColumn(8).width = 15

    // ===== ABA 2: RESUMO POR PIQUETE =====
    const sheetPiquete = workbook.addWorksheet('📍 Resumo por Piquete')

    // Título
    sheetPiquete.mergeCells('A1:H1')
    const piqTitle = sheetPiquete.getCell('A1')
    piqTitle.value = '📍 RESUMO DE PESAGENS POR PIQUETE'
    piqTitle.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
    piqTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
    piqTitle.alignment = { vertical: 'middle', horizontal: 'center' }
    sheetPiquete.getRow(1).height = 30

    // Cabeçalhos
    sheetPiquete.getRow(3).values = ['Piquete', 'Fêmeas', 'Machos', 'Total', 'Média Peso', 'Peso Mín', 'Peso Máx', 'Média CE']
    sheetPiquete.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheetPiquete.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
    sheetPiquete.getRow(3).alignment = { horizontal: 'center' }
    sheetPiquete.getRow(3).height = 25

    // Dados por piquete
    const resumoLocais = Object.entries(porLocal)
      .map(([local, dados]) => {
        const machosLocal = dados.filter(p => p.animal_sexo === 'Macho').length
        const femeasLocal = dados.filter(p => p.animal_sexo === 'Fêmea').length
        const pesosLocal = dados.map(p => parseFloat(p.peso)).filter(n => !isNaN(n))
        const cesLocal = dados.map(p => parseFloat(p.ce)).filter(n => !isNaN(n))
        
        return {
          local,
          femeas: femeasLocal,
          machos: machosLocal,
          total: dados.length,
          mediaPeso: pesosLocal.length ? (pesosLocal.reduce((a, b) => a + b, 0) / pesosLocal.length).toFixed(1) : '-',
          minPeso: pesosLocal.length ? Math.min(...pesosLocal).toFixed(1) : '-',
          maxPeso: pesosLocal.length ? Math.max(...pesosLocal).toFixed(1) : '-',
          mediaCE: cesLocal.length ? (cesLocal.reduce((a, b) => a + b, 0) / cesLocal.length).toFixed(1) : '-'
        }
      })
      .sort((a, b) => b.total - a.total)

    resumoLocais.forEach((item, idx) => {
      const r = sheetPiquete.getRow(idx + 4)
      r.values = [
        item.local,
        item.femeas,
        item.machos,
        item.total,
        item.mediaPeso !== '-' ? `${item.mediaPeso} kg` : '-',
        item.minPeso !== '-' ? `${item.minPeso} kg` : '-',
        item.maxPeso !== '-' ? `${item.maxPeso} kg` : '-',
        item.mediaCE !== '-' ? `${item.mediaCE} cm` : '-'
      ]

      // Estilo alternado
      if (idx % 2 === 0) {
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
      }

      // Destaque para top 3
      if (idx < 3) {
        r.font = { bold: true }
        r.getCell(1).value = `${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} ${item.local}`
      }

      r.alignment = { horizontal: 'center' }

      // Bordas
      for (let j = 1; j <= 8; j++) {
        r.getCell(j).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
      }
    })

    // Totais
    const totalRow = sheetPiquete.getRow(resumoLocais.length + 5)
    totalRow.values = [
      'TOTAL GERAL',
      femeas.length,
      machos.length,
      pesagens.length,
      `${pesoMedio} kg`,
      `${pesoMin} kg`,
      `${pesoMax} kg`,
      ceMedio !== '-' ? `${ceMedio} cm` : '-'
    ]
    totalRow.font = { bold: true, size: 11 }
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
    totalRow.alignment = { horizontal: 'center' }

    // Ajustar larguras
    sheetPiquete.getColumn(1).width = 25
    sheetPiquete.getColumn(2).width = 12
    sheetPiquete.getColumn(3).width = 12
    sheetPiquete.getColumn(4).width = 12
    sheetPiquete.getColumn(5).width = 15
    sheetPiquete.getColumn(6).width = 15
    sheetPiquete.getColumn(7).width = 15
    sheetPiquete.getColumn(8).width = 15

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Enviar resposta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=Pesagens_Detalhado_${startDate}_${endDate}.xlsx`)
    res.send(buffer)

  } catch (error) {
    console.error('Erro ao gerar Excel de pesagens:', error)
    res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message })
  }
}
