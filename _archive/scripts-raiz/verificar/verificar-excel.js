const ExcelJS = require('exceljs')
const fs = require('fs')

async function verificarExcel() {
  try {
    console.log('�Ÿ”� Verificando arquivo Excel gerado...')
    
    // Ler o arquivo Excel
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile('teste_exportacao_nova.xlsx')
    
    const worksheet = workbook.getWorksheet('Detalhes dos Animais')
    
    console.log(`�Ÿ“Š Planilha: ${worksheet.name}`)
    console.log(`�Ÿ“� Total de linhas: ${worksheet.rowCount}`)
    console.log(`�Ÿ“� Total de colunas: ${worksheet.columnCount}`)
    
    // Verificar cabeçalhos
    console.log('\n�Ÿ“‹ Cabeçalhos das colunas:')
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      console.log(`${colNumber}. ${cell.value}`)
    })
    
    // Verificar dados dos animais mortos
    console.log('\n�Ÿ’€ Animais mortos encontrados:')
    let animaisMortos = 0
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Pular cabeçalho
        const situacao = row.getCell(6).value // Coluna Situação
        if (situacao === 'Morto') {
          animaisMortos++
          console.log(`\n${animaisMortos}. Animal morto (linha ${rowNumber}):`)
          console.log(`   Série: ${row.getCell(1).value}`)
          console.log(`   RG: ${row.getCell(2).value}`)
          console.log(`   Situação: ${row.getCell(6).value}`)
          console.log(`   Data da Morte: ${row.getCell(12).value}`)
          console.log(`   Causa da Morte: ${row.getCell(13).value}`)
          console.log(`   Valor da Perda: ${row.getCell(14).value}`)
          console.log(`   Observações da Morte: ${row.getCell(15).value}`)
        }
      }
    })
    
    console.log(`\n�Ÿ“Š Resumo:`)
    console.log(`   Total de animais mortos: ${animaisMortos}`)
    console.log(`   Total de linhas de dados: ${worksheet.rowCount - 1}`)
    
    if (animaisMortos > 0) {
      console.log('�œ… Dados de morte estão incluídos no Excel!')
    } else {
      console.log('�Œ Nenhum animal morto encontrado no Excel')
    }
    
  } catch (error) {
    console.error('�Œ Erro ao verificar Excel:', error.message)
  }
}

verificarExcel()
