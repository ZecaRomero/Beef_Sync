import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'

export async function generatePDFReport(reportData, period) {
  const doc = new jsPDF()
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setTextColor(37, 99, 235) // Blue color
  doc.text('🐄 Beef-Sync - Relatório Gerencial', 20, yPosition)
  
  yPosition += 10
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Período: ${formatPeriod(period)}`, 20, yPosition)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition + 5)
  
  yPosition += 20

  // Generate content for each report type
  if (reportData.data?.data?.monthly_summary) {
    yPosition = addMonthlySummaryToPDF(doc, reportData.data.data.monthly_summary, yPosition)
  }

  if (reportData.data?.data?.births_analysis) {
    yPosition = addBirthsAnalysisToPDF(doc, reportData.data.data.births_analysis, yPosition)
  }

  if (reportData.data?.data?.breeding_report) {
    yPosition = addBreedingReportToPDF(doc, reportData.data.data.breeding_report, yPosition)
  }

  if (reportData.data?.data?.financial_summary) {
    yPosition = addFinancialSummaryToPDF(doc, reportData.data.data.financial_summary, yPosition)
  }

  if (reportData.data?.data?.inventory_report) {
    yPosition = addInventoryReportToPDF(doc, reportData.data.data.inventory_report, yPosition)
  }

  if (reportData.data?.data?.location_report) {
    yPosition = addLocationReportToPDF(doc, reportData.data.data.location_report, yPosition)
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Página ${i} de ${pageCount}`, 20, 285)
    doc.text('© Beef-Sync - Sistema de Gestão Pecuária', 150, 285)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

function addMonthlySummaryToPDF(doc, summary, yPosition) {
  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('📊 Resumo Mensal', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  if (summary.nascimentos) {
    doc.text('Nascimentos:', 20, yPosition)
    doc.text(`Total: ${summary.nascimentos.total || 0}`, 30, yPosition + 5)
    doc.text(`Machos: ${summary.nascimentos.machos || 0}`, 30, yPosition + 10)
    doc.text(`Fêmeas: ${summary.nascimentos.femeas || 0}`, 30, yPosition + 15)
    doc.text(`Peso Médio: ${parseFloat(summary.nascimentos.peso_medio || 0).toFixed(2)} kg`, 30, yPosition + 20)
    yPosition += 30
  }

  if (summary.mortes) {
    doc.text('Mortes:', 20, yPosition)
    doc.text(`Total: ${summary.mortes.total || 0}`, 30, yPosition + 5)
    doc.text(`Machos: ${summary.mortes.machos || 0}`, 30, yPosition + 10)
    doc.text(`Fêmeas: ${summary.mortes.femeas || 0}`, 30, yPosition + 15)
    yPosition += 25
  }

  if (summary.vendas) {
    doc.text('Vendas:', 20, yPosition)
    doc.text(`Total: ${summary.vendas.total || 0}`, 30, yPosition + 5)
    doc.text(`Valor Total: R$ ${parseFloat(summary.vendas.valor_total || 0).toLocaleString('pt-BR')}`, 30, yPosition + 10)
    doc.text(`Valor Médio: R$ ${parseFloat(summary.vendas.valor_medio || 0).toLocaleString('pt-BR')}`, 30, yPosition + 15)
    yPosition += 25
  }

  if (summary.gestacao) {
    doc.text('Gestação:', 20, yPosition)
    doc.text(`Fêmeas Gestantes: ${summary.gestacao.femeas_gestantes || 0}`, 30, yPosition + 5)
    doc.text(`Partos Previstos (próximo mês): ${summary.gestacao.partos_previstos_proximo_mes || 0}`, 30, yPosition + 10)
    yPosition += 20
  }

  if (summary.estatisticas_gerais) {
    doc.text('Estatísticas Gerais:', 20, yPosition)
    doc.text(`Total do Rebanho: ${summary.estatisticas_gerais.total_rebanho || 0}`, 30, yPosition + 5)
    doc.text(`Machos: ${summary.estatisticas_gerais.total_machos || 0}`, 30, yPosition + 10)
    doc.text(`Fêmeas: ${summary.estatisticas_gerais.total_femeas || 0}`, 30, yPosition + 15)
    doc.text(`Ativos: ${summary.estatisticas_gerais.ativos || 0}`, 30, yPosition + 20)
    yPosition += 30
  }

  return yPosition + 10
}

function addBirthsAnalysisToPDF(doc, analysis, yPosition) {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('👶 Análise de Nascimentos', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  if (analysis.distribuicao_sexo && analysis.distribuicao_sexo.length > 0) {
    doc.text('Distribuição por Sexo:', 20, yPosition)
    analysis.distribuicao_sexo.forEach((item, index) => {
      doc.text(`${item.sexo}: ${item.total} (${item.percentual}%)`, 30, yPosition + 5 + (index * 5))
    })
    yPosition += 5 + (analysis.distribuicao_sexo.length * 5) + 10
  }

  if (analysis.media_peso) {
    doc.text('Médias de Peso:', 20, yPosition)
    doc.text(`Geral: ${parseFloat(analysis.media_peso.peso_medio_geral || 0).toFixed(2)} kg`, 30, yPosition + 5)
    doc.text(`Machos: ${parseFloat(analysis.media_peso.peso_medio_machos || 0).toFixed(2)} kg`, 30, yPosition + 10)
    doc.text(`Fêmeas: ${parseFloat(analysis.media_peso.peso_medio_femeas || 0).toFixed(2)} kg`, 30, yPosition + 15)
    yPosition += 25
  }

  if (analysis.nascimentos_por_pai && analysis.nascimentos_por_pai.length > 0) {
    doc.text('Top 5 Pais (por número de filhos):', 20, yPosition)
    analysis.nascimentos_por_pai.slice(0, 5).forEach((item, index) => {
      doc.text(`${item.pai}: ${item.total_filhos} filhos`, 30, yPosition + 5 + (index * 5))
    })
    yPosition += 5 + (Math.min(analysis.nascimentos_por_pai.length, 5) * 5) + 10
  }

  return yPosition + 10
}

function addBreedingReportToPDF(doc, report, yPosition) {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('🐄 Relatório de Reprodução', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  if (report.femeas_gestantes) {
    doc.text('Fêmeas Gestantes:', 20, yPosition)
    doc.text(`Total: ${report.femeas_gestantes.total_gestantes || 0}`, 30, yPosition + 5)
    doc.text(`Dias Médios de Gestação: ${parseFloat(report.femeas_gestantes.dias_medio_gestacao || 0).toFixed(0)}`, 30, yPosition + 10)
    yPosition += 20
  }

  if (report.taxa_prenhez) {
    doc.text('Taxa de Prenhez:', 20, yPosition)
    doc.text(`Gestantes: ${report.taxa_prenhez.gestantes || 0}`, 30, yPosition + 5)
    doc.text(`Vazias: ${report.taxa_prenhez.vazias || 0}`, 30, yPosition + 10)
    doc.text(`Taxa: ${report.taxa_prenhez.taxa_prenhez || 0}%`, 30, yPosition + 15)
    yPosition += 25
  }

  if (report.previsao_partos && report.previsao_partos.length > 0) {
    doc.text('Previsão de Partos (próximos meses):', 20, yPosition)
    report.previsao_partos.forEach((item, index) => {
      const mes = new Date(item.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      doc.text(`${mes}: ${item.partos_previstos} partos`, 30, yPosition + 5 + (index * 5))
    })
    yPosition += 5 + (report.previsao_partos.length * 5) + 10
  }

  return yPosition + 10
}

function addFinancialSummaryToPDF(doc, summary, yPosition) {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('💰 Resumo Financeiro', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  if (summary.receitas) {
    doc.text('Receitas:', 20, yPosition)
    doc.text(`Total de Vendas: R$ ${parseFloat(summary.receitas.total_vendas || 0).toLocaleString('pt-BR')}`, 30, yPosition + 5)
    doc.text(`Animais Vendidos: ${summary.receitas.animais_vendidos || 0}`, 30, yPosition + 10)
    doc.text(`Valor Médio: R$ ${parseFloat(summary.receitas.valor_medio_venda || 0).toLocaleString('pt-BR')}`, 30, yPosition + 15)
    yPosition += 25
  }

  if (summary.custos) {
    doc.text('Custos:', 20, yPosition)
    doc.text(`Total: R$ ${parseFloat(summary.custos.total_custos || 0).toLocaleString('pt-BR')}`, 30, yPosition + 5)
    doc.text(`Custo Médio: R$ ${parseFloat(summary.custos.custo_medio || 0).toLocaleString('pt-BR')}`, 30, yPosition + 10)
    doc.text(`Lançamentos: ${summary.custos.total_lancamentos || 0}`, 30, yPosition + 15)
    yPosition += 25
  }

  return yPosition + 10
}

function addInventoryReportToPDF(doc, report, yPosition) {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('📦 Relatório de Estoque', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  if (report.estoque_semen) {
    doc.text('Estoque de Sêmen:', 20, yPosition)
    doc.text(`Total de Doses: ${report.estoque_semen.total_doses || 0}`, 30, yPosition + 5)
    doc.text(`Total de Touros: ${report.estoque_semen.total_touros || 0}`, 30, yPosition + 10)
    doc.text(`Alertas de Estoque Baixo: ${report.estoque_semen.alertas_estoque_baixo || 0}`, 30, yPosition + 15)
    yPosition += 25
  }

  return yPosition + 10
}

function addLocationReportToPDF(doc, report, yPosition) {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(16)
  doc.setTextColor(37, 99, 235)
  doc.text('Relatório de Localização', 20, yPosition)
  yPosition += 15

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  // Estatísticas gerais
  if (report.estatisticas) {
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Estatísticas Gerais:', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total de Animais: ${report.estatisticas.total_animais || 0}`, 25, yPosition)
    doc.text(`Animais Localizados: ${report.estatisticas.animais_localizados || 0}`, 25, yPosition + 5)
    doc.text(`Animais Sem Localização: ${report.estatisticas.animais_sem_localizacao || 0}`, 25, yPosition + 10)
    doc.text(`Total de Piquetes: ${report.estatisticas.total_piquetes || 0}`, 25, yPosition + 15)
    yPosition += 25
  }

  // NOVA SEÇÃO: Localização Atual dos Animais
  if (report.localizacao_atual && report.localizacao_atual.length > 0) {
    if (yPosition > 180) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Localização Atual dos Animais:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    // Cabeçalho da tabela com fundo
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPosition - 2, 170, 6, 'F')
    
    doc.setTextColor(0, 0, 0)
    doc.text('Animal', 22, yPosition + 2)
    doc.text('Raça', 55, yPosition + 2)
    doc.text('Sexo', 85, yPosition + 2)
    doc.text('Piquete', 105, yPosition + 2)
    doc.text('Data Entrada', 145, yPosition + 2)
    yPosition += 8
    
    // Dados dos animais
    report.localizacao_atual.forEach((animal, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
        
        // Repetir cabeçalho na nova página
        doc.setFillColor(240, 240, 240)
        doc.rect(20, yPosition - 2, 170, 6, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text('Animal', 22, yPosition + 2)
        doc.text('Raça', 55, yPosition + 2)
        doc.text('Sexo', 85, yPosition + 2)
        doc.text('Piquete', 105, yPosition + 2)
        doc.text('Data Entrada', 145, yPosition + 2)
        yPosition += 8
      }
      
      // Linha alternada
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, yPosition - 2, 170, 5, 'F')
      }
      
      const dataEntrada = animal.data_entrada ? 
        new Date(animal.data_entrada).toLocaleDateString('pt-BR') : 'N/A'
      
      doc.setTextColor(0, 0, 0)
      doc.text(`${animal.serie}-${animal.rg}`, 22, yPosition + 1)
      doc.text((animal.raca || 'N/A').substring(0, 12), 55, yPosition + 1)
      doc.text(animal.sexo || 'N/A', 85, yPosition + 1)
      doc.text((animal.piquete || 'Sem localização').substring(0, 15), 105, yPosition + 1)
      doc.text(dataEntrada, 145, yPosition + 1)
      yPosition += 5
    })
    yPosition += 10
  }

  // Animais por piquete
  if (report.animais_por_piquete && report.animais_por_piquete.length > 0) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Resumo por Piquete:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    
    report.animais_por_piquete.slice(0, 15).forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(20, yPosition - 2, 170, 5, 'F')
      }
      
      doc.text(`${item.piquete}: ${item.total_animais} animais (${item.machos || 0} machos, ${item.femeas || 0} fêmeas)`, 25, yPosition + 1)
      yPosition += 5
    })
    yPosition += 10
  }

  // Animais sem localização
  if (report.animais_sem_localizacao && report.animais_sem_localizacao.length > 0) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text(`Animais Sem Localização (${report.animais_sem_localizacao.length}):`, 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    
    report.animais_sem_localizacao.slice(0, 10).forEach((animal, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(255, 240, 240)
        doc.rect(20, yPosition - 2, 170, 5, 'F')
      }
      
      doc.text(`${animal.serie}-${animal.rg} (${animal.raca} - ${animal.sexo})`, 25, yPosition + 1)
      yPosition += 5
    })
    yPosition += 10
  }

  return yPosition + 10
}

export async function generateExcelReport(reportData, period) {
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Metadata
    workbook.creator = 'Beef-Sync'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.title = 'Relatório Beef-Sync'
    workbook.subject = 'Relatório de Gestão Pecuária'
    workbook.description = 'Relatório gerado pelo sistema Beef-Sync'

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumo')
    
    // Configurar propriedades da planilha
    summarySheet.properties.defaultRowHeight = 20
    summarySheet.views = [{ showGridLines: true }]
    
    // Header
    summarySheet.addRow(['Beef-Sync - Relatório Gerencial'])
    summarySheet.addRow([`Período: ${formatPeriod(period)}`])
    summarySheet.addRow([`Gerado em: ${new Date().toLocaleString('pt-BR')}`])
    summarySheet.addRow([]) // Empty row

    // Style header
    summarySheet.getRow(1).font = { size: 16, bold: true, color: { argb: '2563EB' } }
    summarySheet.getRow(2).font = { size: 12 }
    summarySheet.getRow(3).font = { size: 10, italic: true }

    let currentRow = 5

    // Add data for each report type
    if (reportData.data?.data?.monthly_summary) {
      currentRow = addMonthlySummaryToExcel(summarySheet, reportData.data.data.monthly_summary, currentRow)
    }

    if (reportData.data?.data?.births_analysis) {
      const birthsSheet = workbook.addWorksheet('Análise de Nascimentos')
      addBirthsAnalysisToExcel(birthsSheet, reportData.data.data.births_analysis)
    }

    if (reportData.data?.data?.breeding_report) {
      const breedingSheet = workbook.addWorksheet('Relatório de Reprodução')
      addBreedingReportToExcel(breedingSheet, reportData.data.data.breeding_report)
    }

    if (reportData.data?.data?.financial_summary) {
      const financialSheet = workbook.addWorksheet('Resumo Financeiro')
      addFinancialSummaryToExcel(financialSheet, reportData.data.data.financial_summary)
    }

    if (reportData.data?.data?.inventory_report) {
      const inventorySheet = workbook.addWorksheet('Relatório de Estoque')
      addInventoryReportToExcel(inventorySheet, reportData.data.data.inventory_report)
    }

    if (reportData.data?.data?.location_report) {
      const locationSheet = workbook.addWorksheet('Localização')
      addLocationReportToExcel(locationSheet, reportData.data.data.location_report, period)
    }

    // Auto-fit columns
    summarySheet.columns.forEach(column => {
      column.width = 20
    })

    // Proteger a planilha contra alterações acidentais
    summarySheet.protect('beef-sync-2024', {
      selectLockedCells: true,
      selectUnlockedCells: true
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
    
  } catch (error) {
    console.error('Erro ao gerar relatório Excel:', error)
    throw new Error(`Erro ao gerar arquivo Excel: ${error.message}`)
  }
}

function addMonthlySummaryToExcel(sheet, summary, startRow) {
  let currentRow = startRow

  sheet.addRow(['RESUMO MENSAL'], currentRow)
  sheet.getRow(currentRow).font = { size: 14, bold: true, color: { argb: '2563EB' } }
  currentRow += 2

  if (summary.nascimentos) {
    sheet.addRow(['Nascimentos'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total', summary.nascimentos.total || 0])
    sheet.addRow(['Machos', summary.nascimentos.machos || 0])
    sheet.addRow(['Fêmeas', summary.nascimentos.femeas || 0])
    sheet.addRow(['Peso Médio (kg)', parseFloat(summary.nascimentos.peso_medio || 0).toFixed(2)])
    currentRow += 5
  }

  if (summary.vendas) {
    sheet.addRow(['Vendas'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total', summary.vendas.total || 0])
    sheet.addRow(['Valor Total (R$)', parseFloat(summary.vendas.valor_total || 0)])
    sheet.addRow(['Valor Médio (R$)', parseFloat(summary.vendas.valor_medio || 0)])
    currentRow += 4
  }

  if (summary.mortes) {
    sheet.addRow(['Mortes'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total', summary.mortes.total || 0])
    sheet.addRow(['Machos', summary.mortes.machos || 0])
    sheet.addRow(['Fêmeas', summary.mortes.femeas || 0])
    currentRow += 4
  }

  return currentRow + 2
}

function addBirthsAnalysisToExcel(sheet, analysis) {
  sheet.addRow(['ANÁLISE DE NASCIMENTOS'])
  sheet.getRow(1).font = { size: 14, bold: true, color: { argb: '2563EB' } }
  
  let currentRow = 3

  if (analysis.distribuicao_sexo && analysis.distribuicao_sexo.length > 0) {
    sheet.addRow(['Distribuição por Sexo'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    sheet.addRow(['Sexo', 'Total', 'Percentual (%)'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    analysis.distribuicao_sexo.forEach(item => {
      sheet.addRow([item.sexo, item.total, item.percentual])
      currentRow++
    })
    currentRow++
  }

  if (analysis.nascimentos_por_pai && analysis.nascimentos_por_pai.length > 0) {
    sheet.addRow(['Nascimentos por Pai'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    sheet.addRow(['Pai', 'Total Filhos', 'Machos', 'Fêmeas', 'Peso Médio'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    analysis.nascimentos_por_pai.forEach(item => {
      sheet.addRow([
        item.pai, 
        item.total_filhos, 
        item.machos, 
        item.femeas, 
        parseFloat(item.peso_medio || 0).toFixed(2)
      ])
      currentRow++
    })
  }
}

function addBreedingReportToExcel(sheet, report) {
  sheet.addRow(['RELATÓRIO DE REPRODUÇÃO'])
  sheet.getRow(1).font = { size: 14, bold: true, color: { argb: '2563EB' } }
  
  let currentRow = 3

  if (report.femeas_gestantes) {
    sheet.addRow(['Fêmeas Gestantes'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total Gestantes', report.femeas_gestantes.total_gestantes || 0])
    sheet.addRow(['Dias Médios de Gestação', parseFloat(report.femeas_gestantes.dias_medio_gestacao || 0).toFixed(0)])
    currentRow += 3
  }

  if (report.taxa_prenhez) {
    sheet.addRow(['Taxa de Prenhez'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Gestantes', report.taxa_prenhez.gestantes || 0])
    sheet.addRow(['Vazias', report.taxa_prenhez.vazias || 0])
    sheet.addRow(['Taxa (%)', report.taxa_prenhez.taxa_prenhez || 0])
    currentRow += 4
  }

  if (report.previsao_partos && report.previsao_partos.length > 0) {
    sheet.addRow(['Previsão de Partos'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    sheet.addRow(['Mês', 'Partos Previstos'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    
    report.previsao_partos.forEach(item => {
      const mes = new Date(item.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      sheet.addRow([mes, item.partos_previstos])
      currentRow++
    })
  }
}

function addFinancialSummaryToExcel(sheet, summary) {
  sheet.addRow(['RESUMO FINANCEIRO'])
  sheet.getRow(1).font = { size: 14, bold: true, color: { argb: '2563EB' } }
  
  let currentRow = 3

  if (summary.receitas) {
    sheet.addRow(['Receitas'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total de Vendas (R$)', parseFloat(summary.receitas.total_vendas || 0)])
    sheet.addRow(['Animais Vendidos', summary.receitas.animais_vendidos || 0])
    sheet.addRow(['Valor Médio (R$)', parseFloat(summary.receitas.valor_medio_venda || 0)])
    currentRow += 4
  }

  if (summary.custos) {
    sheet.addRow(['Custos'])
    sheet.getRow(currentRow).font = { bold: true }
    currentRow++
    sheet.addRow(['Total (R$)', parseFloat(summary.custos.total_custos || 0)])
    sheet.addRow(['Custo Médio (R$)', parseFloat(summary.custos.custo_medio || 0)])
    sheet.addRow(['Total de Lançamentos', summary.custos.total_lancamentos || 0])
    currentRow += 4
  }
}

function addInventoryReportToExcel(sheet, report) {
  // Título principal
  sheet.mergeCells('A1:H1')
  const titleRow = sheet.getRow(1)
  titleRow.getCell(1).value = '📦 RELATÓRIO DE ESTOQUE DE SÊMEN'
  titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
  titleRow.height = 30

  let currentRow = 3

  // Estatísticas Gerais
  if (report.estoque_semen) {
    sheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const statsHeaderRow = sheet.getRow(currentRow)
    statsHeaderRow.getCell(1).value = '📊 ESTATÍSTICAS GERAIS'
    statsHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    statsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    statsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    const statsData = [
      ['Total de Registros', report.estoque_semen.total_registros || 0],
      ['Total de Touros', report.estoque_semen.total_touros || 0],
      ['Total de Doses', report.estoque_semen.total_doses || 0],
      ['Doses Disponíveis', report.estoque_semen.doses_disponiveis || 0],
      ['Doses Usadas', report.estoque_semen.doses_usadas || 0],
      ['Alertas Estoque Baixo', report.estoque_semen.alertas_estoque_baixo || 0],
      ['Valor Médio por Dose', `R$ ${parseFloat(report.estoque_semen.valor_medio || 0).toFixed(2)}`],
      ['Valor Total do Estoque', `R$ ${parseFloat(report.estoque_semen.valor_total_estoque || 0).toFixed(2)}`]
    ]

    statsData.forEach(([label, value]) => {
      const row = sheet.getRow(currentRow)
      row.getCell(1).value = label
      row.getCell(2).value = value
      row.font = { bold: label.includes('Total') }
      row.alignment = { vertical: 'middle' }
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
      row.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, 
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
      currentRow++
    })
    currentRow++
  }

  // Detalhes por Touro
  if (report.detalhes_touros && report.detalhes_touros.length > 0) {
    sheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const tourosHeaderRow = sheet.getRow(currentRow)
    tourosHeaderRow.getCell(1).value = '🐂 DETALHES POR TOURO'
    tourosHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    tourosHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    tourosHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    // Cabeçalhos da tabela
    const headers = ['Nome do Touro', 'RG', 'Raça', 'Localização', 'Doses Totais', 'Disponíveis', 'Usadas', 'Valor Médio']
    const headerRow = sheet.getRow(currentRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    currentRow++

    // Dados dos touros
    report.detalhes_touros.forEach((touro, index) => {
      const row = sheet.getRow(currentRow)
      const rowData = [
        touro.nome_touro || '',
        touro.rg_touro || '',
        touro.raca || '',
        touro.localizacao || '',
        touro.total_doses || 0,
        touro.doses_disponiveis || 0,
        touro.doses_usadas || 0,
        `R$ ${parseFloat(touro.valor_medio || 0).toFixed(2)}`
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colIndex >= 4 ? 'center' : 'left'
        }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
        }
      })
      currentRow++
    })
    currentRow++
  }

  // Movimentações no Período
  if (report.movimentacoes_periodo && report.movimentacoes_periodo.length > 0) {
    sheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const movHeaderRow = sheet.getRow(currentRow)
    movHeaderRow.getCell(1).value = '📈 MOVIMENTAÇÕES NO PERÍODO'
    movHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    movHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    movHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    // Cabeçalhos
    const movHeaders = ['Nome do Touro', 'Operação', 'Quantidade', 'Valor', 'Data', 'Fornecedor', 'NF']
    const movHeaderRow2 = sheet.getRow(currentRow)
    movHeaders.forEach((header, index) => {
      const cell = movHeaderRow2.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    currentRow++

    // Dados das movimentações
    report.movimentacoes_periodo.forEach((mov, index) => {
      const row = sheet.getRow(currentRow)
      const rowData = [
        mov.nome_touro || '',
        mov.tipo_operacao || '',
        mov.quantidade_doses || 0,
        `R$ ${parseFloat(mov.valor_compra || 0).toFixed(2)}`,
        mov.data_compra ? new Date(mov.data_compra).toLocaleDateString('pt-BR') : '',
        mov.fornecedor || '',
        mov.numero_nf || ''
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colIndex === 2 || colIndex === 3 ? 'center' : 'left'
        }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
        }
      })
      currentRow++
    })
  }

  // Ajustar largura das colunas
  sheet.columns = [
    { width: 20 },  // Nome do Touro
    { width: 15 },  // RG
    { width: 12 },  // Raça
    { width: 15 },  // Localização
    { width: 12 },  // Doses Totais
    { width: 12 },  // Disponíveis
    { width: 10 },  // Usadas
    { width: 15 }   // Valor
  ]
}

function addLocationReportToExcel(sheet, report, period) {
  // Título principal
  sheet.mergeCells('A1:G1')
  const titleRow = sheet.getRow(1)
  titleRow.getCell(1).value = '📍 RELATÓRIO DE LOCALIZAÇÃO DE ANIMAIS'
  titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
  titleRow.height = 30

  // Período
  sheet.mergeCells('A2:G2')
  const periodRow = sheet.getRow(2)
  periodRow.getCell(1).value = `Período: ${formatPeriod(period)} | Gerado em: ${new Date().toLocaleString('pt-BR')}`
  periodRow.font = { size: 11, italic: true }
  periodRow.alignment = { vertical: 'middle', horizontal: 'center' }
  periodRow.height = 25

  let currentRow = 4

  // Estatísticas Gerais
  if (report.estatisticas) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`)
    const statsHeaderRow = sheet.getRow(currentRow)
    statsHeaderRow.getCell(1).value = '📊 ESTATÍSTICAS GERAIS'
    statsHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    statsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    statsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    const statsData = [
      ['Total de Animais', report.estatisticas.total_animais || 0],
      ['Animais Localizados', report.estatisticas.animais_localizados || 0],
      ['Animais Sem Localização', report.estatisticas.animais_sem_localizacao || 0],
      ['Total de Piquetes', report.estatisticas.total_piquetes || 0]
    ]

    statsData.forEach(([label, value]) => {
      const row = sheet.getRow(currentRow)
      row.getCell(1).value = label
      row.getCell(2).value = value
      row.font = { bold: label.includes('Total') }
      row.alignment = { vertical: 'middle' }
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
      row.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, 
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
      currentRow++
    })
    currentRow++
  }

  // Localização Atual
  if (report.localizacao_atual && report.localizacao_atual.length > 0) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`)
    const locHeaderRow = sheet.getRow(currentRow)
    locHeaderRow.getCell(1).value = '📍 LOCALIZAÇÃO ATUAL DOS ANIMAIS'
    locHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    locHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    locHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    // Cabeçalhos da tabela
    const headers = ['Série', 'RG', 'Raça', 'Sexo', 'Piquete', 'Data Entrada', 'Responsável']
    const headerRow = sheet.getRow(currentRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    currentRow++

    // Dados dos animais
    report.localizacao_atual.forEach((animal, index) => {
      const row = sheet.getRow(currentRow)
      const rowData = [
        animal.serie || '',
        animal.rg || '',
        animal.raca || '',
        animal.sexo || '',
        animal.piquete || 'Sem localização',
        animal.data_entrada ? new Date(animal.data_entrada).toLocaleDateString('pt-BR') : '-',
        animal.usuario_responsavel || '-'
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        // Cor alternada nas linhas
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
        }
      })
      currentRow++
    })
    currentRow++
  }

  // Animais por Piquete
  if (report.animais_por_piquete && report.animais_por_piquete.length > 0) {
    sheet.mergeCells(`A${currentRow}:E${currentRow}`)
    const piqueteHeaderRow = sheet.getRow(currentRow)
    piqueteHeaderRow.getCell(1).value = '📊 DISTRIBUIÇÃO POR PIQUETE'
    piqueteHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    piqueteHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    piqueteHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    // Cabeçalhos
    const piqueteHeaders = ['Piquete', 'Total', 'Machos', 'Fêmeas', 'Raças']
    const piqueteHeaderRow2 = sheet.getRow(currentRow)
    piqueteHeaders.forEach((header, index) => {
      const cell = piqueteHeaderRow2.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    currentRow++

    // Dados
    report.animais_por_piquete.forEach((piquete, index) => {
      const row = sheet.getRow(currentRow)
      const rowData = [
        piquete.piquete || '',
        piquete.total_animais || 0,
        piquete.machos || 0,
        piquete.femeas || 0,
        piquete.racas || ''
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colIndex === 4 ? 'left' : 'center' 
        }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
        }
      })
      currentRow++
    })
    currentRow++
  }

  // Animais Sem Localização
  if (report.animais_sem_localizacao && report.animais_sem_localizacao.length > 0) {
    sheet.mergeCells(`A${currentRow}:D${currentRow}`)
    const semLocHeaderRow = sheet.getRow(currentRow)
    semLocHeaderRow.getCell(1).value = '⚠️ ANIMAIS SEM LOCALIZAÇÃO DEFINIDA'
    semLocHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
    semLocHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } }
    semLocHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    currentRow++

    // Cabeçalhos
    const semLocHeaders = ['Série', 'RG', 'Raça', 'Sexo']
    const semLocHeaderRow2 = sheet.getRow(currentRow)
    semLocHeaders.forEach((header, index) => {
      const cell = semLocHeaderRow2.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    currentRow++

    // Dados
    report.animais_sem_localizacao.forEach((animal, index) => {
      const row = sheet.getRow(currentRow)
      const rowData = [
        animal.serie || '',
        animal.rg || '',
        animal.raca || '',
        animal.sexo || ''
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }
        }
      })
      currentRow++
    })
  }

  // Ajustar largura das colunas
  sheet.columns = [
    { width: 12 },  // Série
    { width: 12 },  // RG
    { width: 18 },  // Raça
    { width: 10 },  // Sexo
    { width: 20 },  // Piquete
    { width: 15 },  // Data
    { width: 20 }   // Responsável
  ]
}

function formatPeriod(period) {
  const startDate = new Date(period.startDate).toLocaleDateString('pt-BR')
  const endDate = new Date(period.endDate).toLocaleDateString('pt-BR')
  return `${startDate} a ${endDate}`
}