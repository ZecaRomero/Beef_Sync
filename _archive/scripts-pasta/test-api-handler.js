// Simulando o handler da API
const { query } = require('../lib/database')

// Função copiada da API
async function generateMonthlySummary(period, sections) {
  const summary = {}

  try {
    // Nascimentos
    if (!sections || sections.nascimentos !== false) {
      const nascimentosResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sexo = 'M' THEN 1 END) as machos,
          COUNT(CASE WHEN sexo = 'F' THEN 1 END) as femeas,
          AVG(peso) as peso_medio,
          COUNT(CASE WHEN dificuldade_parto IS NOT NULL THEN 1 END) as partos_dificeis
        FROM nascimentos 
        WHERE data_nascimento BETWEEN $1 AND $2
      `, [period.startDate, period.endDate])

      summary.nascimentos = nascimentosResult.rows[0]
    }

    // Mortes
    if (!sections || sections.mortes !== false) {
      const mortesResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as femeas
        FROM animais 
        WHERE situacao = 'Morto' AND updated_at BETWEEN $1 AND $2
      `, [period.startDate, period.endDate])

      summary.mortes = mortesResult.rows[0]
    }

    // Vendas
    if (!sections || sections.vendas !== false) {
      const vendasResult = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(valor_venda) as valor_total,
          AVG(valor_venda) as valor_medio
        FROM animais 
        WHERE situacao = 'Vendido' AND updated_at BETWEEN $1 AND $2
      `, [period.startDate, period.endDate])

      summary.vendas = vendasResult.rows[0]
    }

    return summary
  } catch (error) {
    console.error('Erro ao gerar resumo mensal:', error)
    return {}
  }
}

// Simulando o handler
async function simulateHandler() {
  const req = {
    method: 'POST',
    body: {
      reports: ['monthly_summary'],
      period: {
        startDate: '2025-09-01',
        endDate: '2025-10-31'
      }
    }
  }

  console.log('🧪 Simulando handler da API...')
  console.log('Request body:', JSON.stringify(req.body, null, 2))

  const { reports, period, sections, preview } = req.body

  const reportData = {}

  // Generate each requested report
  for (const reportType of reports) {
    console.log(`\n📊 Gerando relatório: ${reportType}`)
    
    switch (reportType) {
      case 'monthly_summary':
        console.log('Chamando generateMonthlySummary...')
        reportData.monthly_summary = await generateMonthlySummary(period, sections?.[reportType])
        console.log('Resultado de generateMonthlySummary:', JSON.stringify(reportData.monthly_summary, null, 2))
        break
    }
  }

  console.log('\n📋 reportData completo:')
  console.log(JSON.stringify(reportData, null, 2))

  // Simulando a resposta final
  const responseData = {
    data: reportData,
    period,
    generatedAt: new Date().toISOString()
  }

  console.log('\n🎯 Resposta final que seria enviada:')
  console.log(JSON.stringify(responseData, null, 2))

  process.exit(0)
}

simulateHandler().catch(console.error)