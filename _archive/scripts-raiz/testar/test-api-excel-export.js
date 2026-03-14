const fetch = require('node-fetch')
const fs = require('fs')

async function testAPIExcelExport() {
  console.log('ğÅ¸§ª Testando exportaÃ§Ã£o Excel via API...')
  
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

    console.log(`ğÅ¸â€œ¡ Status da resposta: ${response.status}`)
    console.log(`ğÅ¸â€œâ€¹ Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('âÅ’ Erro na API:', errorText)
      return false
    }

    const buffer = await response.buffer()
    console.log(`ğÅ¸â€œÅ  Tamanho do arquivo: ${buffer.length} bytes`)

    // Salvar arquivo
    fs.writeFileSync('teste-api-excel.xlsx', buffer)
    console.log('ğÅ¸â€™¾ Arquivo salvo como: teste-api-excel.xlsx')

    // Verificar se Ã© um arquivo Excel vÃ¡lido
    if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      console.log('âÅ“â€¦ Arquivo Excel vÃ¡lido (assinatura ZIP detectada)')
    } else {
      console.log('âÅ¡ ï¸ Arquivo pode nÃ£o ser um Excel vÃ¡lido')
    }

    return true

  } catch (error) {
    console.error('âÅ’ Erro no teste:', error.message)
    return false
  }
}

// Executar teste
testAPIExcelExport().then(success => {
  if (success) {
    console.log('\nğÅ¸Å½â€° Teste da API concluÃ­do com sucesso!')
    console.log('ğÅ¸â€œ Agora vocÃª pode abrir o arquivo teste-api-excel.xlsx para verificar')
  } else {
    console.log('\nğÅ¸â€™¥ Teste da API falhou!')
    console.log('ğÅ¸â€§ Verifique se o servidor estÃ¡ rodando em localhost:3020')
  }
})