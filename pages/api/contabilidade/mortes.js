import ExcelJS from 'exceljs'
import databaseService from '../../../services/databaseService'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period } = req.body

    console.log('📋 Recebida requisição para gerar relatório de mortes:', { period })

    if (!period || !period.startDate || !period.endDate) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    // Buscar mortes do período (já vem com dados dos animais no JOIN)
    const mortes = await databaseService.buscarMortes({
      startDate: period.startDate,
      endDate: period.endDate
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Mortes')

    // Cabeçalho
    sheet.mergeCells('A1:H1')
    sheet.getCell('A1').value = '💀 RELATÓRIO DE MORTES - BEEF SYNC'
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'DC2626' } }
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEE2E2' }
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
    const totalMortes = mortes.length
    const causas = {}
    mortes.forEach(morte => {
      const causa = morte.causa_morte || morte.causa || 'Não informado'
      causas[causa] = (causas[causa] || 0) + 1
    })

    const resumoRow = sheet.addRow(['RESUMO DO PERÍODO'])
    sheet.mergeCells(`A${resumoRow.number}:H${resumoRow.number}`)
    resumoRow.getCell(1).font = { bold: true, size: 14 }
    resumoRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEE2E2' }
    }
    resumoRow.getCell(1).alignment = { horizontal: 'center' }
    resumoRow.height = 25

    sheet.addRow(['Total de Mortes:', totalMortes])
    sheet.addRow([])
    sheet.addRow(['Mortes por Causa:'])
    Object.entries(causas).forEach(([causa, count]) => {
      sheet.addRow([`  ${causa}:`, count])
    })
    sheet.addRow([])

    // Cabeçalho da tabela
    const headerRow = sheet.addRow([
      'Data Morte',
      'Animal (Série-RG)',
      'Raça',
      'Sexo',
      'Idade',
      'Causa da Morte',
      'Valor da Perda (R$)',
      'Observações'
    ])
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DC2626' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Dados (os dados dos animais já vêm no JOIN do buscarMortes)
    mortes.forEach(morte => {
      const dataMorte = morte.data_morte || morte.data || ''
      const dataFormatada = dataMorte ? new Date(dataMorte).toLocaleDateString('pt-BR') : ''
      
      const identificacao = morte.serie && morte.rg 
        ? `${morte.serie}-${morte.rg}`
        : morte.animal_id || ''
      
      // Calcular idade se tiver data de nascimento do animal
      let idade = ''
      if (morte.data_nascimento && dataMorte) {
        const nasc = new Date(morte.data_nascimento)
        const morteDate = new Date(dataMorte)
        const diffMs = morteDate - nasc
        const diffMeses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
        idade = `${diffMeses} meses`
      }

      sheet.addRow([
        dataFormatada,
        identificacao,
        morte.raca || '',
        morte.sexo || '',
        idade,
        morte.causa_morte || morte.causa || 'Não informado',
        morte.valor_perda || morte.valor_venda || morte.custo_total || '',
        morte.observacoes || morte.observacao || ''
      ])
    })

    // Ajustar largura das colunas
    sheet.columns = [
      { width: 15 }, // Data
      { width: 18 }, // Animal
      { width: 15 }, // Raça
      { width: 10 }, // Sexo
      { width: 12 }, // Idade
      { width: 20 }, // Causa
      { width: 18 }, // Valor
      { width: 30 }  // Observações
    ]

    // Gerar o arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="mortes-${period.startDate}-${period.endDate}.xlsx"`)
    res.send(Buffer.from(buffer))

  } catch (error) {
    console.error('Erro ao gerar relatório de mortes:', error)
    res.status(500).json({ 
      message: 'Erro ao gerar relatório de mortes',
      error: error.message 
    })
  }
}

