const fetch = require('node-fetch')

async function testExcelErrorDebug() {
  console.log('🔍 Testando cenários que podem causar erro no Excel...\n')
  
  const testCases = [
    {
      name: 'Teste 1: Relatório de Localização apenas',
      data: {
        reports: ['location_report'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx'
      }
    },
    {
      name: 'Teste 2: Múltiplos relatórios',
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
      name: 'Teste 4: Período longo',
      data: {
        reports: ['location_report'],
        period: { startDate: '2023-01-01', endDate: '2024-12-31' },
        format: 'xlsx'
      }
    },
    {
      name: 'Teste 5: Todos os tipos de relatório',
      data: {
        reports: ['monthly_summary', 'births_analysis', 'breeding_report', 'financial_summary', 'inventory_report', 'location_report'],
        period: { startDate: '2024-01-01', endDate: '2024-01-31' },
        format: 'xlsx'
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`)
    console.log('📋 Dados:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch('http://localhost:3020/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      })

      console.log(`📡 Status: ${response.status}`)
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erro: ${errorText}`)
        continue
      }

      const buffer = await response.buffer()
      console.log(`📊 Tamanho: ${buffer.length} bytes`)

      // Verificar se é um arquivo Excel válido
      if (buffer.length > 0 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
        console.log('✅ Arquivo Excel válido')
      } else {
        console.log('❌ Arquivo inválido')
        console.log('🔍 Primeiros bytes:', Array.from(buffer.slice(0, 10)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '))
      }

    } catch (error) {
      console.error(`❌ Erro na requisição: ${error.message}`)
    }
  }

  console.log('\n🏁 Teste de debug concluído')
}

testExcelErrorDebug()