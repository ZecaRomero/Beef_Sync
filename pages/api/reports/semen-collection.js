import ExcelJS from 'exceljs'
import { sendSuccess, sendValidationError, sendMethodNotAllowed, sendError, asyncHandler } from '../../../utils/apiResponse'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, 'POST')
  }

  const { title, date, touros } = req.body

  if (!touros || !Array.isArray(touros) || touros.length === 0) {
    return sendValidationError(res, 'Lista de touros é obrigatória')
  }

  try {
    const workbook = new ExcelJS.Workbook()
    
    // Metadados
    workbook.creator = 'Beef-Sync'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.title = 'Relatório de Coleta de Sêmen'
    workbook.subject = 'Coleta de Sêmen - Beef-Sync'

    const worksheet = workbook.addWorksheet('Coleta de Sêmen')

    // Configurações da planilha
    worksheet.properties.defaultRowHeight = 20
    worksheet.views = [{ showGridLines: true }]

    // Título principal
    worksheet.mergeCells('A1:G1')
    const titleRow = worksheet.getRow(1)
    titleRow.getCell(1).value = 'RELATÓRIO DE COLETA DE SÊMEN'
    titleRow.font = { size: 18, bold: true, color: { argb: '2563EB' } }
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
    titleRow.height = 35

    // Data e hora
    worksheet.mergeCells('A2:G2')
    const dateRow = worksheet.getRow(2)
    dateRow.getCell(1).value = `Data: ${date} | Gerado em: ${new Date().toLocaleString('pt-BR')}`
    dateRow.font = { size: 12, italic: true }
    dateRow.alignment = { vertical: 'middle', horizontal: 'center' }
    dateRow.height = 25

    // Linha em branco
    worksheet.getRow(3).height = 10

    // Resumo
    const totalDoses = touros.reduce((sum, t) => sum + t.dosesToCollect, 0)
    const mediaDoses = Math.round(totalDoses / touros.length)

    worksheet.mergeCells('A4:G4')
    const summaryHeaderRow = worksheet.getRow(4)
    summaryHeaderRow.getCell(1).value = '📊 RESUMO DA COLETA'
    summaryHeaderRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
    summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    summaryHeaderRow.height = 30

    // Dados do resumo
    const summaryData = [
      ['Total de Touros:', touros.length],
      ['Total de Doses a Coletar:', totalDoses],
      ['Média de Doses por Touro:', mediaDoses]
    ]

    let currentRow = 5
    summaryData.forEach(([label, value]) => {
      const row = worksheet.getRow(currentRow)
      row.getCell(1).value = label
      row.getCell(2).value = value
      row.getCell(1).font = { bold: true }
      row.getCell(2).font = { bold: true, color: { argb: '2563EB' } }
      row.getCell(2).alignment = { horizontal: 'center' }
      currentRow++
    })

    // Linha em branco
    currentRow++
    worksheet.getRow(currentRow).height = 10
    currentRow++

    // Cabeçalho da tabela
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`)
    const tableHeaderRow = worksheet.getRow(currentRow)
    tableHeaderRow.getCell(1).value = '🐂 TOUROS PARA COLETA'
    tableHeaderRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
    tableHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    tableHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    tableHeaderRow.height = 30
    currentRow++

    // Cabeçalhos das colunas
    const headers = ['Nome do Touro', 'RG', 'Raça', 'Localização', 'Rack', 'Doses a Coletar', 'Observações']
    const headerRow = worksheet.getRow(currentRow)
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
    touros.forEach((touro, index) => {
      const row = worksheet.getRow(currentRow)
      const rowData = [
        touro.nome || '',
        touro.rg || '',
        touro.raca || 'N/A',
        touro.localizacao || '',
        touro.rack || 'N/A',
        touro.dosesToCollect || 0,
        touro.observacoes || ''
      ]
      
      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1)
        cell.value = value
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colIndex === 5 ? 'center' : 'left'
        }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        }
        
        // Cor alternada nas linhas
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
        }

        // Destacar coluna de doses
        if (colIndex === 5) {
          cell.font = { bold: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } }
        }
      })
      currentRow++
    })

    // Linha de total
    const totalRow = worksheet.getRow(currentRow)
    totalRow.getCell(5).value = 'TOTAL:'
    totalRow.getCell(6).value = totalDoses
    totalRow.getCell(5).font = { bold: true }
    totalRow.getCell(6).font = { bold: true, color: { argb: '2563EB' } }
    totalRow.getCell(6).alignment = { horizontal: 'center' }
    totalRow.getCell(5).border = {
      top: { style: 'thick' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
    totalRow.getCell(6).border = {
      top: { style: 'thick' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
    totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } }
    currentRow += 2

    // Seção de assinaturas
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`)
    const signatureHeaderRow = worksheet.getRow(currentRow)
    signatureHeaderRow.getCell(1).value = '✍️ CONTROLE DE EXECUÇÃO'
    signatureHeaderRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
    signatureHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } }
    signatureHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
    signatureHeaderRow.height = 30
    currentRow += 2

    // Campos de assinatura
    const signatureFields = [
      'Responsável pela Coleta:',
      'Data/Hora da Coleta:',
      'Observações Gerais:'
    ]

    signatureFields.forEach((field, index) => {
      const row = worksheet.getRow(currentRow)
      row.getCell(1).value = field
      row.getCell(1).font = { bold: true }
      
      if (index < 2) {
        // Campos de uma linha
        worksheet.mergeCells(`B${currentRow}:G${currentRow}`)
        const cell = row.getCell(2)
        cell.border = { bottom: { style: 'thin' } }
        row.height = 25
      } else {
        // Campo de observações (múltiplas linhas)
        for (let i = 0; i < 3; i++) {
          const obsRow = worksheet.getRow(currentRow + i + 1)
          worksheet.mergeCells(`A${currentRow + i + 1}:G${currentRow + i + 1}`)
          const obsCell = obsRow.getCell(1)
          obsCell.border = { bottom: { style: 'thin' } }
          obsRow.height = 25
        }
        currentRow += 3
      }
      currentRow++
    })

    // Ajustar largura das colunas
    worksheet.columns = [
      { width: 25 },  // Nome do Touro
      { width: 15 },  // RG
      { width: 15 },  // Raça
      { width: 20 },  // Localização
      { width: 12 },  // Rack
      { width: 15 },  // Doses
      { width: 30 }   // Observações
    ]

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Configurar resposta
    const filename = `coleta-semen-${new Date().toISOString().split('T')[0]}.xlsx`
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)

    res.send(Buffer.from(buffer))

  } catch (error) {
    console.error('Erro ao gerar relatório de coleta:', error)
    return sendError(res, `Erro ao gerar relatório: ${error.message}`)
  }
}

export default asyncHandler(handler)