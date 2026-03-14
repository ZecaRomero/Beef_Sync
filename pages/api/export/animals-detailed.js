import databaseService from '../../../services/databaseService'
import { formatAnimalDataForExport, exportToExcel } from '../../../services/exportUtils'
import { sendSuccess, sendNotFound, sendMethodNotAllowed, sendError, asyncHandler } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, 'GET')
  }

  logger.info('📊 Gerando relatório detalhado de animais...')

  // Buscar todos os animais
  const animais = await databaseService.buscarAnimais()
  
  if (animais.length === 0) {
    return sendNotFound(res, 'Nenhum animal encontrado para exportação')
  }

  // Formatar dados incluindo informações de morte
  const dadosFormatados = await formatAnimalDataForExport(animais)
  
  // Preparar dados para Excel
  const dadosExcel = dadosFormatados.map(animal => ({
    'Série': animal['Série'],
    'RG': animal['RG'],
    'Raça': animal['Raça'],
    'Sexo': animal['Sexo'],
    'Idade (meses)': animal['Idade (meses)'],
    'Situação': animal['Situação'],
    'Custo Total (R$)': animal['Custo Total (R$)'],
    'Data Nascimento': animal['Data Nascimento'],
    'Peso': animal['Peso'] || 'N/A',
    'Observações': animal['Observações'] || 'N/A',
    'Data Cadastro': animal['Data Cadastro'] || 'N/A',
    'Data da Morte': animal['Data da Morte'],
    'Causa da Morte': animal['Causa da Morte'],
    'Valor da Perda (R$)': animal['Valor da Perda (R$)'],
    'Observações da Morte': animal['Observações da Morte']
  }))

  // Gerar arquivo Excel
  const workbook = await generateDetailedExcelReport(dadosExcel)
  
  // Configurar headers para download
  const filename = `Detalhes_dos_Animais_${new Date().toISOString().slice(0, 10)}.xlsx`
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', workbook.length)
  
  res.status(200).send(workbook)
}

async function generateDetailedExcelReport(data) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Detalhes dos Animais')

  // Definir colunas
  worksheet.columns = [
    { header: 'Série', key: 'Série', width: 10 },
    { header: 'RG', key: 'RG', width: 12 },
    { header: 'Raça', key: 'Raça', width: 15 },
    { header: 'Sexo', key: 'Sexo', width: 10 },
    { header: 'Idade (meses)', key: 'Idade (meses)', width: 12 },
    { header: 'Situação', key: 'Situação', width: 12 },
    { header: 'Custo Total', key: 'Custo Total (R$)', width: 15 },
    { header: 'Data Nascimento', key: 'Data Nascimento', width: 15 },
    { header: 'Peso', key: 'Peso', width: 10 },
    { header: 'Observações', key: 'Observações', width: 20 },
    { header: 'Data Cadastro', key: 'Data Cadastro', width: 15 },
    { header: 'Data da Morte', key: 'Data da Morte', width: 15 },
    { header: 'Causa da Morte', key: 'Causa da Morte', width: 15 },
    { header: 'Valor da Perda (R$)', key: 'Valor da Perda (R$)', width: 15 },
    { header: 'Observações da Morte', key: 'Observações da Morte', width: 20 }
  ]

  // Adicionar dados
  data.forEach(row => {
    worksheet.addRow(row)
  })

  // Formatação do cabeçalho - Fundo roxo com texto branco
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7030A0' } // Roxo
    }
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  })

  // Formatação das linhas de dados - Fundo cinza claro com texto centralizado
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' } // Cinza claro
        }
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        }
        
        // Formatação específica por tipo de dado
        const columnKey = worksheet.columns[cell.col - 1].key
        
        // Formatar números monetários
        if (columnKey === 'Custo Total (R$)' || columnKey === 'Valor da Perda (R$)') {
          if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00'
          }
        }
        
        // Formatar datas
        if (columnKey === 'Data Nascimento' || columnKey === 'Data Cadastro' || columnKey === 'Data da Morte') {
          if (cell.value && cell.value !== 'N/A') {
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy'
            }
          }
        }
        
        // Formatar números inteiros
        if (columnKey === 'Idade (meses)' || columnKey === 'Peso') {
          if (cell.value && cell.value !== 'N/A' && typeof cell.value === 'number') {
            cell.numFmt = '0'
          }
        }
      })
    }
  })

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export default asyncHandler(handler)
