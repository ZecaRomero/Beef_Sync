import ExcelJS from 'exceljs'
import { sendSuccess, sendValidationError, sendMethodNotAllowed, sendError, asyncHandler } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, 'POST')
  }

  const { period } = req.body

  if (!period || !period.startDate || !period.endDate) {
    return sendValidationError(res, 'Período é obrigatório')
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Movimentações do Mês')

  // Cabeçalho principal
  sheet.mergeCells('A1:H1')
  sheet.getCell('A1').value = '📊 RELATÓRIO DE MOVIMENTAÇÕES - BEEF SYNC'
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '7C3AED' } }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'EDE9FE' }
  }
  sheet.getRow(1).height = 30

  // Período
  sheet.mergeCells('A2:H2')
  sheet.getCell('A2').value = `Período: ${formatDate(period.startDate)} até ${formatDate(period.endDate)}`
  sheet.getCell('A2').font = { size: 12, bold: true }
  sheet.getCell('A2').alignment = { horizontal: 'center' }
  sheet.getRow(2).height = 20

  // Data de geração
  sheet.mergeCells('A3:H3')
  sheet.getCell('A3').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`
  sheet.getCell('A3').font = { size: 10, italic: true }
  sheet.getCell('A3').alignment = { horizontal: 'center' }
  sheet.getRow(3).height = 18

  sheet.addRow([]) // Linha vazia

  // SEÇÃO 1: RESUMO GERAL
  const resumoTitle = sheet.addRow(['RESUMO GERAL DO PERÍODO'])
  sheet.mergeCells(`A${resumoTitle.number}:H${resumoTitle.number}`)
  resumoTitle.getCell(1).font = { bold: true, size: 14 }
  resumoTitle.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DBEAFE' }
    }
    resumoTitle.getCell(1).alignment = { horizontal: 'center' }
    resumoTitle.height = 25

    sheet.addRow([])

    // Tabela de resumo
    const resumoHeader = sheet.addRow([
      'Tipo de Movimentação',
      'Quantidade',
      'Valor Total'
    ])
    styleHeaderRow(resumoHeader, '2563EB')

    // Dados de exemplo (em produção virão do banco/localStorage)
    const movimentacoes = [
      ['Vendas', 0, 'R$ 0,00'],
      ['Compras', 0, 'R$ 0,00'],
      ['Transferências', 0, '-'],
      ['Mortes', 0, '-'],
      ['Nascimentos', 0, '-'],
      ['Abates', 0, 'R$ 0,00'],
      ['Doações', 0, '-']
    ]

    movimentacoes.forEach(mov => {
      const row = sheet.addRow(mov)
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.alignment = { horizontal: 'center' }
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        }
      })
    })

    sheet.addRow([])
    sheet.addRow([])

    // SEÇÃO 2: ENTRADAS DETALHADAS
    const entradasTitle = sheet.addRow(['ENTRADAS DETALHADAS'])
    sheet.mergeCells(`A${entradasTitle.number}:H${entradasTitle.number}`)
    entradasTitle.getCell(1).font = { bold: true, size: 14 }
    entradasTitle.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D1FAE5' }
    }
    entradasTitle.getCell(1).alignment = { horizontal: 'center' }
    entradasTitle.height = 25

    sheet.addRow([])

    const entradasHeader = sheet.addRow([
      'Data',
      'Tipo',
      'Número NF',
      'Fornecedor/Origem',
      'Qtd. Animais',
      'Valor Total',
      'Valor/Unidade',
      'Observações'
    ])
    styleHeaderRow(entradasHeader, '059669')

    // Dados serão preenchidos dinamicamente
    // Exemplo de linha vazia para demonstração
    sheet.addRow(['', '', '', '', '', '', '', ''])

    sheet.addRow([])
    sheet.addRow([])

    // SEÇÃO 3: SAÍDAS DETALHADAS
    const saidasTitle = sheet.addRow(['SAÍDAS DETALHADAS'])
    sheet.mergeCells(`A${saidasTitle.number}:H${saidasTitle.number}`)
    saidasTitle.getCell(1).font = { bold: true, size: 14 }
    saidasTitle.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEE2E2' }
    }
    saidasTitle.getCell(1).alignment = { horizontal: 'center' }
    saidasTitle.height = 25

    sheet.addRow([])

    const saidasHeader = sheet.addRow([
      'Data',
      'Tipo',
      'Número NF',
      'Destino/Motivo',
      'Qtd. Animais',
      'Valor Total',
      'Valor/Unidade',
      'Observações'
    ])
    styleHeaderRow(saidasHeader, 'DC2626')

    // Dados serão preenchidos dinamicamente
    sheet.addRow(['', '', '', '', '', '', '', ''])

    sheet.addRow([])
    sheet.addRow([])

    // SEÇÃO 4: SALDO DO PERÍODO
    const saldoTitle = sheet.addRow(['SALDO DO PERÍODO'])
    sheet.mergeCells(`A${saldoTitle.number}:H${saldoTitle.number}`)
    saldoTitle.getCell(1).font = { bold: true, size: 14 }
    saldoTitle.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' }
    }
    saldoTitle.getCell(1).alignment = { horizontal: 'center' }
    saldoTitle.height = 25

    sheet.addRow([])

    const saldoData = [
      ['Rebanho no Início do Período:', '0 animais'],
      ['Total de Entradas:', '0 animais'],
      ['Total de Saídas:', '0 animais'],
      ['Rebanho no Final do Período:', '0 animais'],
      ['', ''],
      ['Receitas Totais (Vendas):', 'R$ 0,00'],
      ['Despesas Totais (Compras):', 'R$ 0,00'],
      ['Saldo Financeiro:', 'R$ 0,00']
    ]

    saldoData.forEach(data => {
      const row = sheet.addRow(data)
      row.getCell(1).font = { bold: true }
      row.getCell(2).font = { bold: true, color: { argb: '2563EB' } }
      row.getCell(2).alignment = { horizontal: 'right' }
    })

    // Ajustar largura das colunas
    sheet.columns = [
      { width: 14 }, // Data/Tipo
      { width: 18 }, // Tipo
      { width: 15 }, // NF
      { width: 25 }, // Origem/Destino
      { width: 12 }, // Qtd
      { width: 15 }, // Valor Total
      { width: 15 }, // Valor/Unidade
      { width: 30 }  // Obs
    ]

    // Adicionar observações finais
    const obsRow = sheet.lastRow.number + 3
    sheet.mergeCells(`A${obsRow}:H${obsRow}`)
    sheet.getCell(`A${obsRow}`).value = 'Observações e Notas'
    sheet.getCell(`A${obsRow}`).font = { bold: true, size: 11 }
    sheet.getCell(`A${obsRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' }
    }

    const obs = [
      '• Este relatório consolida todas as movimentações de entrada e saída do rebanho',
      '• Vendas: Saídas com valor comercial gerado',
      '• Compras: Entradas de animais adquiridos',
      '• Transferências: Movimentações entre propriedades sem valor comercial',
      '• Mortes: Perdas de animais por causas naturais ou acidentais',
      '• Nascimentos: Entradas de bezerros nascidos no período',
      '• Abates: Saídas de animais para abate',
      '• Os valores financeiros incluem apenas operações com NF registrada',
      '• Dados extraídos automaticamente do sistema Beef Sync'
    ]

    obs.forEach(texto => {
      const row = sheet.addRow([texto])
      sheet.mergeCells(`A${row.number}:H${row.number}`)
      row.getCell(1).font = { size: 9, italic: true }
      row.getCell(1).alignment = { horizontal: 'left' }
    })

    // Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="movimentacoes-${period.startDate}-${period.endDate}.xlsx"`)
    res.send(Buffer.from(buffer))
}

export default asyncHandler(handler)

function styleHeaderRow(row, color) {
  row.font = { bold: true, color: { argb: 'FFFFFF' } }
  row.height = 25
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

