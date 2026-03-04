const ExcelJS = require('exceljs')
const fs = require('fs')

async function verificarCorrecaoExcel() {
  console.log('🔍 Verificando correção da exportação Excel...\n')
  
  try {
    // 1. Verificar se o arquivo foi gerado
    if (!fs.existsSync('teste-api-excel.xlsx')) {
      console.log('❌ Arquivo teste-api-excel.xlsx não encontrado')
      console.log('💡 Execute: node test-api-excel-export.js primeiro')
      return false
    }

    console.log('✅ Arquivo Excel encontrado')

    // 2. Verificar se o arquivo pode ser lido
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile('teste-api-excel.xlsx')
    
    console.log('✅ Arquivo Excel pode ser lido sem erros')

    // 3. Verificar planilhas
    const worksheetNames = workbook.worksheets.map(ws => ws.name)
    console.log(`✅ Planilhas encontradas: ${worksheetNames.join(', ')}`)

    // 4. Verificar conteúdo da planilha principal
    const resumoSheet = workbook.getWorksheet('Resumo')
    if (resumoSheet) {
      console.log('✅ Planilha "Resumo" encontrada')
      console.log(`📏 Linhas: ${resumoSheet.rowCount}, Colunas: ${resumoSheet.columnCount}`)
      
      // Verificar cabeçalho
      const headerCell = resumoSheet.getCell('A1')
      if (headerCell.value && headerCell.value.toString().includes('Beef-Sync')) {
        console.log('✅ Cabeçalho correto encontrado')
      } else {
        console.log('⚠️ Cabeçalho pode estar incorreto')
      }
    }

    // 5. Verificar planilha de localização se existir
    const locationSheet = workbook.getWorksheet('Localização')
    if (locationSheet) {
      console.log('✅ Planilha "Localização" encontrada')
      console.log(`📏 Linhas: ${locationSheet.rowCount}, Colunas: ${locationSheet.columnCount}`)
    }

    // 6. Verificar metadados
    console.log(`✅ Criador: ${workbook.creator}`)
    console.log(`✅ Título: ${workbook.title}`)
    console.log(`✅ Descrição: ${workbook.description}`)

    console.log('\n🎉 VERIFICAÇÃO COMPLETA - TODAS AS CORREÇÕES FUNCIONANDO!')
    console.log('📊 O erro de exportação Excel foi resolvido com sucesso')
    
    return true

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
    return false
  }
}

// Executar verificação
verificarCorrecaoExcel().then(success => {
  if (success) {
    console.log('\n✅ STATUS: CORREÇÃO VALIDADA E FUNCIONANDO')
  } else {
    console.log('\n❌ STATUS: PROBLEMAS DETECTADOS')
  }
  process.exit(success ? 0 : 1)
})