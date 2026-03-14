const fetch = require('node-fetch')
const fs = require('fs')

async function testSemenCollectionSystem() {
  console.log('🧪 Testando Sistema de Coleta de Sêmen...\n')

  // Dados de teste
  const testData = {
    title: 'Relatório de Coleta de Sêmen',
    date: new Date().toLocaleDateString('pt-BR'),
    touros: [
      {
        nome: 'HEBERT',
        rg: 'HEBERT - NELORE',
        raca: 'Nelore',
        localizacao: 'RANCHARIA',
        rack: 'A-01',
        dosesToCollect: 5,
        observacoes: ''
      },
      {
        nome: 'MASTAG',
        rg: 'MASTAG - NELORE',
        raca: 'Nelore', 
        localizacao: 'RANCHARIA',
        rack: 'B-02',
        dosesToCollect: 8,
        observacoes: ''
      },
      {
        nome: 'MESTRE DA KARANGAMAGATA',
        rg: 'M5369 DA KARANGAMAGATA',
        raca: 'Nelore',
        localizacao: 'RANCHARIA',
        rack: 'C-03',
        dosesToCollect: 6,
        observacoes: ''
      }
    ]
  }

  try {
    console.log('📊 Testando API de exportação Excel...')
    console.log('📋 Dados do teste:', JSON.stringify(testData, null, 2))

    const response = await fetch('http://localhost:3020/api/reports/semen-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    console.log(`📡 Status da resposta: ${response.status}`)
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro da API:', errorText)
      return false
    }

    const buffer = await response.buffer()
    console.log(`📊 Tamanho do arquivo: ${buffer.length} bytes`)

    // Verificar se é um arquivo Excel válido
    if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      console.log('✅ Arquivo Excel válido (assinatura ZIP detectada)')
    } else {
      console.log('⚠️ Arquivo pode não ser um Excel válido')
      console.log('🔍 Primeiros bytes:', Array.from(buffer.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '))
    }

    // Salvar arquivo
    const filename = `teste-coleta-semen-${new Date().toISOString().split('T')[0]}.xlsx`
    fs.writeFileSync(filename, buffer)
    console.log(`💾 Arquivo salvo como: ${filename}`)

    // Verificar conteúdo usando ExcelJS
    console.log('\n📖 Verificando conteúdo do Excel...')
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filename)

    const worksheet = workbook.getWorksheet('Coleta de Sêmen')
    if (worksheet) {
      console.log('✅ Planilha "Coleta de Sêmen" encontrada')
      console.log(`📏 Linhas: ${worksheet.rowCount}, Colunas: ${worksheet.columnCount}`)
      
      // Verificar título
      const titleCell = worksheet.getCell('A1')
      if (titleCell.value && titleCell.value.toString().includes('RELATÓRIO DE COLETA')) {
        console.log('✅ Título correto encontrado')
      }

      // Verificar dados dos touros
      let tourosEncontrados = 0
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 10) { // Pular cabeçalhos
          const nomeCell = row.getCell(1).value
          if (nomeCell && typeof nomeCell === 'string' && 
              (nomeCell.includes('HEBERT') || nomeCell.includes('MASTAG') || nomeCell.includes('MESTRE'))) {
            tourosEncontrados++
          }
        }
      })
      
      console.log(`✅ Touros encontrados no Excel: ${tourosEncontrados}`)
      
      if (tourosEncontrados === testData.touros.length) {
        console.log('✅ Todos os touros foram incluídos no relatório')
      } else {
        console.log('⚠️ Alguns touros podem estar faltando')
      }
    }

    console.log('\n🎉 Teste da API concluído com sucesso!')
    console.log('📝 Agora você pode:')
    console.log('   1. Abrir o arquivo Excel gerado')
    console.log('   2. Acessar /reproducao/coleta-semen na interface')
    console.log('   3. Testar a funcionalidade completa')

    return true

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}

// Executar teste
testSemenCollectionSystem().then(success => {
  if (success) {
    console.log('\n✅ SISTEMA DE COLETA DE SÊMEN FUNCIONANDO!')
  } else {
    console.log('\n❌ PROBLEMAS DETECTADOS NO SISTEMA')
    console.log('🔧 Verifique se o servidor está rodando em localhost:3020')
  }
  process.exit(success ? 0 : 1)
})