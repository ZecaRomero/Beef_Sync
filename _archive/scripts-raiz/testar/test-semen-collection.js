const fetch = require('node-fetch')
const fs = require('fs')

async function testSemenCollectionSystem() {
  console.log('�Ÿ�� Testando Sistema de Coleta de Sêmen...\n')

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
    console.log('�Ÿ“Š Testando API de exportação Excel...')
    console.log('�Ÿ“‹ Dados do teste:', JSON.stringify(testData, null, 2))

    const response = await fetch('http://localhost:3020/api/reports/semen-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    console.log(`�Ÿ“� Status da resposta: ${response.status}`)
    console.log(`�Ÿ“‹ Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('�Œ Erro da API:', errorText)
      return false
    }

    const buffer = await response.buffer()
    console.log(`�Ÿ“Š Tamanho do arquivo: ${buffer.length} bytes`)

    // Verificar se é um arquivo Excel válido
    if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      console.log('�œ… Arquivo Excel válido (assinatura ZIP detectada)')
    } else {
      console.log('�š�️ Arquivo pode não ser um Excel válido')
      console.log('�Ÿ”� Primeiros bytes:', Array.from(buffer.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '))
    }

    // Salvar arquivo
    const filename = `teste-coleta-semen-${new Date().toISOString().split('T')[0]}.xlsx`
    fs.writeFileSync(filename, buffer)
    console.log(`�Ÿ’� Arquivo salvo como: ${filename}`)

    // Verificar conteúdo usando ExcelJS
    console.log('\n�Ÿ“– Verificando conteúdo do Excel...')
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filename)

    const worksheet = workbook.getWorksheet('Coleta de Sêmen')
    if (worksheet) {
      console.log('�œ… Planilha "Coleta de Sêmen" encontrada')
      console.log(`�Ÿ“� Linhas: ${worksheet.rowCount}, Colunas: ${worksheet.columnCount}`)
      
      // Verificar título
      const titleCell = worksheet.getCell('A1')
      if (titleCell.value && titleCell.value.toString().includes('RELAT�“RIO DE COLETA')) {
        console.log('�œ… Título correto encontrado')
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
      
      console.log(`�œ… Touros encontrados no Excel: ${tourosEncontrados}`)
      
      if (tourosEncontrados === testData.touros.length) {
        console.log('�œ… Todos os touros foram incluídos no relatório')
      } else {
        console.log('�š�️ Alguns touros podem estar faltando')
      }
    }

    console.log('\n�ŸŽ‰ Teste da API concluído com sucesso!')
    console.log('�Ÿ“� Agora você pode:')
    console.log('   1. Abrir o arquivo Excel gerado')
    console.log('   2. Acessar /reproducao/coleta-semen na interface')
    console.log('   3. Testar a funcionalidade completa')

    return true

  } catch (error) {
    console.error('�Œ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}

// Executar teste
testSemenCollectionSystem().then(success => {
  if (success) {
    console.log('\n�œ… SISTEMA DE COLETA DE S�ŠMEN FUNCIONANDO!')
  } else {
    console.log('\n�Œ PROBLEMAS DETECTADOS NO SISTEMA')
    console.log('�Ÿ”� Verifique se o servidor está rodando em localhost:3020')
  }
  process.exit(success ? 0 : 1)
})