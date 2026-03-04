const { query } = require('../lib/database')

async function generateMonthlySummary(period, sections) {
  console.log('🔍 Iniciando generateMonthlySummary...')
  console.log('Period:', period)
  console.log('Sections:', sections)
  
  const summary = {}

  try {
    console.log('\n📊 Executando consultas...')
    
    // Nascimentos
    if (!sections || sections.nascimentos !== false) {
      console.log('Executando consulta de nascimentos...')
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
      console.log('Resultado nascimentos:', summary.nascimentos)
    }

    // Mortes
    if (!sections || sections.mortes !== false) {
      console.log('Executando consulta de mortes...')
      const mortesResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
          COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as femeas
        FROM animais 
        WHERE situacao = 'Morto' AND updated_at BETWEEN $1 AND $2
      `, [period.startDate, period.endDate])

      summary.mortes = mortesResult.rows[0]
      console.log('Resultado mortes:', summary.mortes)
    }

    // Vendas
    if (!sections || sections.vendas !== false) {
      console.log('Executando consulta de vendas...')
      const vendasResult = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(valor_venda) as valor_total,
          AVG(valor_venda) as valor_medio
        FROM animais 
        WHERE situacao = 'Vendido' AND updated_at BETWEEN $1 AND $2
      `, [period.startDate, period.endDate])

      summary.vendas = vendasResult.rows[0]
      console.log('Resultado vendas:', summary.vendas)
    }

    console.log('\n📋 Summary final antes do return:')
    console.log(JSON.stringify(summary, null, 2))
    
    return summary
  } catch (error) {
    console.error('❌ Erro ao gerar resumo mensal:', error)
    return {}
  }
}

async function testAPI() {
  const period = {
    startDate: '2025-09-01',
    endDate: '2025-10-31'
  }
  
  console.log('🧪 Testando função generateMonthlySummary com logs...')
  
  const result = await generateMonthlySummary(period)
  
  console.log('\n🎯 Resultado final retornado:')
  console.log(JSON.stringify(result, null, 2))
  
  console.log('\n🔍 Análise do resultado:')
  console.log('- É objeto vazio?', JSON.stringify(result) === '{}')
  console.log('- Número de chaves:', Object.keys(result).length)
  console.log('- Chaves:', Object.keys(result))
  
  process.exit(0)
}

testAPI().catch(console.error)