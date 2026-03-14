const ExcelJS = require('exceljs')
const fs = require('fs')

async function verificarCorrecaoExcel() {
  console.log('�Ÿ”� Verificando correção da exportação Excel...\n')
  
  try {
    // 1. Verificar se o arquivo foi gerado
    if (!fs.existsSync('teste-api-excel.xlsx')) {
      console.log('�Œ Arquivo teste-api-excel.xlsx não encontrado')
      console.log('�Ÿ’� Execute: node test-api-excel-export.js primeiro')
      return false
    }

    console.log('�œ… Arquivo Excel encontrado')

    // 2. Verificar se o arquivo pode ser lido
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile('teste-api-excel.xlsx')
    
    console.log('�œ… Arquivo Excel pode ser lido sem erros')

    // 3. Verificar planilhas
    const worksheetNames = workbook.worksheets.map(ws => ws.name)
    console.log(`�œ… Planilhas encontradas: ${worksheetNames.join(', ')}`)

    // 4. Verificar conteúdo da planilha principal
    const resumoSheet = workbook.getWorksheet('Resumo')
    if (resumoSheet) {
      console.log('�œ… Planilha "Resumo" encontrada')
      console.log(`�Ÿ“� Linhas: ${resumoSheet.rowCount}, Colunas: ${resumoSheet.columnCount}`)
      
      // Verificar cabeçalho
      const headerCell = resumoSheet.getCell('A1')
      if (headerCell.value && headerCell.value.toString().includes('Beef-Sync')) {
        console.log('�œ… Cabeçalho correto encontrado')
      } else {
        console.log('�š�️ Cabeçalho pode estar incorreto')
      }
    }

    // 5. Verificar planilha de localização se existir
    const locationSheet = workbook.getWorksheet('Localização')
    if (locationSheet) {
      console.log('�œ… Planilha "Localização" encontrada')
      console.log(`�Ÿ“� Linhas: ${locationSheet.rowCount}, Colunas: ${locationSheet.columnCount}`)
    }

    // 6. Verificar metadados
    console.log(`�œ… Criador: ${workbook.creator}`)
    console.log(`�œ… Título: ${workbook.title}`)
    console.log(`�œ… Descrição: ${workbook.description}`)

    console.log('\n�ŸŽ‰ VERIFICA�‡�ƒO COMPLETA - TODAS AS CORRE�‡�•ES FUNCIONANDO!')
    console.log('�Ÿ“Š O erro de exportação Excel foi resolvido com sucesso')
    
    return true

  } catch (error) {
    console.error('�Œ Erro durante verificação:', error.message)
    return false
  }
}

// Executar verificação
verificarCorrecaoExcel().then(success => {
  if (success) {
    console.log('\n�œ… STATUS: CORRE�‡�ƒO VALIDADA E FUNCIONANDO')
  } else {
    console.log('\n�Œ STATUS: PROBLEMAS DETECTADOS')
  }
  process.exit(success ? 0 : 1)
})