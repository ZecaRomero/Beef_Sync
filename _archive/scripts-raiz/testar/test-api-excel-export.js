const fetch = require('node-fetch')
const fs = require('fs')

async function testAPIExcelExport() {
  console.log('🧪 Testando exportação Excel via API...')
  
  try {
    const response = await fetch('http://localhost:3020/api/reports/download', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reports: ['location_report', 'monthly_summary'],
        period: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        format: 'xlsx'
      })
    })

    console.log(`📡 Status da resposta: ${response.status}`)
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na API:', errorText)
      return false
    }

    const buffer = await response.buffer()
    console.log(`📊 Tamanho do arquivo: ${buffer.length} bytes`)

    // Salvar arquivo
    fs.writeFileSync('teste-api-excel.xlsx', buffer)
    console.log('💾 Arquivo salvo como: teste-api-excel.xlsx')

    // Verificar se é um arquivo Excel válido
    if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      console.log('✅ Arquivo Excel válido (assinatura ZIP detectada)')
    } else {
      console.log('⚠️ Arquivo pode não ser um Excel válido')
    }

    return true

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    return false
  }
}

// Executar teste
testAPIExcelExport().then(success => {
  if (success) {
    console.log('\n🎉 Teste da API concluído com sucesso!')
    console.log('📝 Agora você pode abrir o arquivo teste-api-excel.xlsx para verificar')
  } else {
    console.log('\n💥 Teste da API falhou!')
    console.log('🔧 Verifique se o servidor está rodando em localhost:3020')
  }
})