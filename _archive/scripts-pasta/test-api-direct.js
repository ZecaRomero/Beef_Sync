const { query } = require('../lib/database')

// Função copiada diretamente da API
async function generateMonthlySummary(period, sections) {
  const summary = {}

  try {
    // Nascimentos
    if (!sections || sections.nascimentos !== false) {
      const nascimentosResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as femeas,
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

async function testAPI() {
  const period = {
    startDate: '2025-09-01',
    endDate: '2025-10-31'
  }
  
  console.log('🧪 Testando função generateMonthlySummary da API...')
  console.log(`Período: ${period.startDate} a ${period.endDate}\n`)
  
  const result = await generateMonthlySummary(period)
  
  console.log('📊 Resultado da função:')
  console.log(JSON.stringify(result, null, 2))
  
  console.log('\n🔍 Verificando se o resultado está vazio:')
  console.log('Object.keys(result).length:', Object.keys(result).length)
  console.log('JSON.stringify(result) === "{}":', JSON.stringify(result) === '{}')
  
  process.exit(0)
}

testAPI().catch(console.error)