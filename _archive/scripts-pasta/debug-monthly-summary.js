const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function debugMonthlySummary() {
  const client = await pool.connect()
  
  try {
    const period = {
      startDate: '2025-09-01',
      endDate: '2025-10-31'
    }
    
    console.log('🔍 Debugando generateMonthlySummary...')
    console.log(`Período: ${period.startDate} a ${period.endDate}\n`)
    
    const summary = {}
    
    // 1. Nascimentos
    console.log('👶 NASCIMENTOS:')
    const nascimentosResult = await client.query(`
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
    console.log('Resultado:', summary.nascimentos)
    
    // 2. Mortes
    console.log('\n💀 MORTES:')
    const mortesResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as machos,
        COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as femeas
      FROM animais 
      WHERE situacao = 'Morto' AND updated_at BETWEEN $1 AND $2
    `, [period.startDate, period.endDate])
    
    summary.mortes = mortesResult.rows[0]
    console.log('Resultado:', summary.mortes)
    
    // 3. Vendas
    console.log('\n💰 VENDAS:')
    const vendasResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(valor_venda) as valor_total,
        AVG(valor_venda) as valor_medio
      FROM animais 
      WHERE situacao = 'Vendido' AND updated_at BETWEEN $1 AND $2
    `, [period.startDate, period.endDate])
    
    summary.vendas = vendasResult.rows[0]
    console.log('Resultado:', summary.vendas)
    
    // 4. Compras
    console.log('\n🛒 COMPRAS:')
    const comprasResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(custo_total) as valor_total
      FROM animais 
      WHERE created_at BETWEEN $1 AND $2 AND custo_total > 0
    `, [period.startDate, period.endDate])
    
    summary.compras = comprasResult.rows[0]
    console.log('Resultado:', summary.compras)
    
    // 5. Estatísticas gerais
    console.log('\n📊 ESTATÍSTICAS GERAIS:')
    const estatisticasResult = await client.query(`
      SELECT 
        COUNT(*) as total_rebanho,
        COUNT(CASE WHEN sexo = 'Macho' THEN 1 END) as total_machos,
        COUNT(CASE WHEN sexo = 'Fêmea' THEN 1 END) as total_femeas,
        COUNT(CASE WHEN situacao = 'Ativo' THEN 1 END) as ativos
      FROM animais
    `)
    
    summary.estatisticas_gerais = estatisticasResult.rows[0]
    console.log('Resultado:', summary.estatisticas_gerais)
    
    console.log('\n📋 RESUMO COMPLETO:')
    console.log(JSON.stringify(summary, null, 2))
    
    // Verificar se há dados no período
    console.log('\n🔍 VERIFICAÇÃO ADICIONAL:')
    
    // Verificar se há nascimentos no período
    const nascimentosCheck = await client.query(`
      SELECT COUNT(*) as count, MIN(data_nascimento) as min_date, MAX(data_nascimento) as max_date
      FROM nascimentos
    `)
    console.log('Nascimentos na base:', nascimentosCheck.rows[0])
    
    // Verificar se há mortes no período
    const mortesCheck = await client.query(`
      SELECT COUNT(*) as count, MIN(data_morte) as min_date, MAX(data_morte) as max_date
      FROM mortes
    `)
    console.log('Mortes na base:', mortesCheck.rows[0])
    
  } catch (error) {
    console.error('❌ Erro ao debugar:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

debugMonthlySummary().catch(console.error)