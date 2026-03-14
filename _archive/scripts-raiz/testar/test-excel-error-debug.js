const fetch = require('node-fetch')

async function testExcelErrorDebug() {
  console.log('≈∏‚Äùç Testando cen√°rios que podem causar erro no Excel...\n')
  
  const testCases = [
    {
      name: 'Teste 1: Relat√≥rio de Localiza√ß√£o apenas',
      data: {
        reports: ['location_report'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx'
      }
    },
    {
      name: 'Teste 2: M√∫ltiplos relat√≥rios',
      data: {
        reports: ['location_report', 'monthly_summary'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx'
      }
    },
    {
      name: 'Teste 3: Com filtros',
      data: {
        reports: ['location_report'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx',
        filters: {
          animalType: 'bovino',
          location: 'Piquete 1'
        }
      }
    },
    {
      name: 'Teste 4: Per√≠odo longo',
      data: {
        reports: ['location_report'],
        period: { startDate: '2023-01-01', endDate: '2024-12-31' },
        format: 'xlsx'
      }
    },
    {
      name: 'Teste 5: Todos os tipos de relat√≥rio',
      data: {
        reports: ['monthly_summary', 'births_analysis', 'breeding_report', 'financial_summary', 'inventory_report', 'location_report'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx'
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n≈∏ß™ ${testCase.name}`)
    console.log('≈∏‚Äú‚Äπ Dados:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch('http://localhost:3020/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      })

      console.log(`≈∏‚Äú° Status: ${response.status}`)
      console.log(`≈∏‚Äú‚Äπ Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`‚ù≈í Erro: ${errorText}`)
        continue
      }

      const buffer = await response.buffer()
      console.log(`≈∏‚Äú≈† Tamanho: ${buffer.length} bytes`)

      // Verificar se √© um arquivo Excel v√°lido
      if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
        console.log('‚≈ì‚Ä¶ Arquivo Excel v√°lido')
      } else {
        console.log('‚ù≈í Arquivo inv√°lido')
        console.log('≈∏‚Äùç Primeiros bytes:', Array.from(buffer.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '))
      }

    } catch (error) {
      console.error(`‚ù≈í Erro na requisi√ß√£o: ${error.message}`)
    }
  }

  console.log('\n≈∏èÅ Teste de debug conclu√≠do')
}

testExcelErrorDebug()