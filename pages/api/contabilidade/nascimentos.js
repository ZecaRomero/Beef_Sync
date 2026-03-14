import ExcelJS from 'exceljs'
import databaseService from '../../../services/databaseService'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period } = req.body

    console.log('📋 Recebida requisição para gerar relatório de nascimentos:', { period })

    if (!period || !period.startDate || !period.endDate) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    // Buscar nascimentos do período usando query direta
    const { query } = await import('../../../lib/database')
    
    // Normalizar datas
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

    const pgStart = toPgDate(period.startDate)
    const pgEnd = toPgDate(period.endDate)
    
    let nascimentos = []
    if (pgStart && pgEnd) {
      // Tentar filtrar por data_nascimento ou data
      const result = await query(`
        SELECT * FROM nascimentos 
        WHERE (data_nascimento >= $1 AND data_nascimento <= $2)
           OR (data >= $1 AND data <= $2)
           OR (created_at >= $1 AND created_at <= $2)
        ORDER BY COALESCE(data_nascimento, data, created_at) DESC
      `, [pgStart, pgEnd])
      nascimentos = result.rows
    } else {
      // Se não conseguir filtrar, buscar todos
      nascimentos = await databaseService.buscarNascimentos({})
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Nascimentos')

    // Cabeçalho
    sheet.mergeCells('A1:H1')
    sheet.getCell('A1').value = '🐄 RELATÓRIO DE NASCIMENTOS - BEEF SYNC'
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '059669' } }
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D1FAE5' }
    }
    sheet.getRow(1).height = 30

    // Período
    sheet.mergeCells('A2:H2')
    sheet.getCell('A2').value = `Período: ${period.startDate} até ${period.endDate}`
    sheet.getCell('A2').font = { size: 12, bold: true }
    sheet.getCell('A2').alignment = { horizontal: 'center' }
    sheet.getRow(2).height = 20

    // Data de geração
    sheet.mergeCells('A3:H3')
    sheet.getCell('A3').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`
    sheet.getCell('A3').font = { size: 10, italic: true }
    sheet.getCell('A3').alignment = { horizontal: 'center' }
    sheet.getRow(3).height = 18

    sheet.addRow([])

    // Resumo
    const totalNascimentos = nascimentos.length
    const machos = nascimentos.filter(n => n.sexo === 'M' || n.sexo === 'Macho').length
    const femeas = nascimentos.filter(n => n.sexo === 'F' || n.sexo === 'Fêmea').length

    const resumoRow = sheet.addRow(['RESUMO DO PERÍODO'])
    sheet.mergeCells(`A${resumoRow.number}:H${resumoRow.number}`)
    resumoRow.getCell(1).font = { bold: true, size: 14 }
    resumoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DBEAFE' }
    }
    resumoRow.getCell(1).alignment = { horizontal: 'center' }
    resumoRow.height = 25

    sheet.addRow(['Total de Nascimentos:', totalNascimentos])
    sheet.addRow(['Machos:', machos])
    sheet.addRow(['Fêmeas:', femeas])
    sheet.addRow([])

    // Cabeçalho da tabela
    const headerRow = sheet.addRow([
      'Data Nascimento',
      'Série',
      'RG',
      'Sexo',
      'Pai',
      'Mãe',
      'Peso (kg)',
      'Observações'
    ])
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '059669' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Dados
    nascimentos.forEach(nascimento => {
      // Tentar vários campos possíveis para data
      const dataNasc = nascimento.data_nascimento || nascimento.data || nascimento.nascimento || nascimento.created_at || ''
      const dataFormatada = dataNasc ? new Date(dataNasc).toLocaleDateString('pt-BR') : ''
      
      // Determinar sexo
      let sexo = 'Não informado'
      if (nascimento.sexo) {
        if (nascimento.sexo === 'M' || nascimento.sexo === 'Macho' || nascimento.sexo.toLowerCase().includes('macho')) {
          sexo = 'Macho'
        } else if (nascimento.sexo === 'F' || nascimento.sexo === 'Fêmea' || nascimento.sexo.toLowerCase().includes('fêmea') || nascimento.sexo.toLowerCase().includes('femea')) {
          sexo = 'Fêmea'
        }
      }
      
      sheet.addRow([
        dataFormatada,
        nascimento.serie || '',
        nascimento.rg || '',
        sexo,
        nascimento.pai || nascimento.touro || '',
        nascimento.mae || nascimento.receptora || '',
        nascimento.peso || nascimento.custo_dna || '',
        nascimento.observacao || nascimento.observacoes || ''
      ])
    })

    // Ajustar largura das colunas
    sheet.columns = [
      { width: 15 }, // Data
      { width: 10 }, // Série
      { width: 10 }, // RG
      { width: 10 }, // Sexo
      { width: 15 }, // Pai
      { width: 15 }, // Mãe
      { width: 12 }, // Peso
      { width: 30 }  // Observações
    ]

    // Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="nascimentos-${period.startDate}-${period.endDate}.xlsx"`)
    res.send(Buffer.from(buffer))

  } catch (error) {
    console.error('Erro ao gerar relatório de nascimentos:', error)
    res.status(500).json({ 
      message: 'Erro ao gerar relatório de nascimentos',
      error: error.message 
    })
  }
}

