const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function checkReportData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando dados para relatório mensal (2025-09-01 a 2025-10-31)...\n')
    
    // 1. Verificar nascimentos
    console.log('👶 NASCIMENTOS:')
    const nascimentos = await client.query(`
      SELECT * FROM nascimentos 
      WHERE data_nascimento BETWEEN $1 AND $2
      ORDER BY data_nascimento
    `, ['2025-09-01', '2025-10-31'])
    
    console.log(`Total encontrado: ${nascimentos.rows.length}`)
    if (nascimentos.rows.length > 0) {
      console.table(nascimentos.rows.map(row => ({
        id: row.id,
        serie: row.serie,
        rg: row.rg,
        sexo: row.sexo,
        data_nascimento: row.data_nascimento,
        peso: row.peso
      })))
    }
    
    // 2. Verificar mortes
    console.log('\n💀 MORTES:')
    const mortes = await client.query(`
      SELECT m.*, a.serie, a.rg, a.sexo 
      FROM mortes m
      JOIN animais a ON m.animal_id = a.id
      WHERE m.data_morte BETWEEN $1 AND $2
      ORDER BY m.data_morte
    `, ['2025-09-01', '2025-10-31'])
    
    console.log(`Total encontrado: ${mortes.rows.length}`)
    if (mortes.rows.length > 0) {
      console.table(mortes.rows.map(row => ({
        id: row.id,
        serie: row.serie,
        rg: row.rg,
        sexo: row.sexo,
        data_morte: row.data_morte,
        causa_morte: row.causa_morte
      })))
    }
    
    // 3. Verificar animais vendidos
    console.log('\n💰 VENDAS (animais com situação "Vendido"):')
    const vendas = await client.query(`
      SELECT * FROM animais 
      WHERE situacao = 'Vendido' AND updated_at BETWEEN $1 AND $2
      ORDER BY updated_at
    `, ['2025-09-01', '2025-10-31'])
    
    console.log(`Total encontrado: ${vendas.rows.length}`)
    if (vendas.rows.length > 0) {
      console.table(vendas.rows.map(row => ({
        id: row.id,
        serie: row.serie,
        rg: row.rg,
        situacao: row.situacao,
        valor_venda: row.valor_venda,
        updated_at: row.updated_at
      })))
    }
    
    // 4. Verificar todos os animais para debug
    console.log('\n🐄 TODOS OS ANIMAIS (para debug):')
    const todosAnimais = await client.query(`
      SELECT id, serie, rg, sexo, situacao, data_nascimento, updated_at 
      FROM animais 
      ORDER BY id
    `)
    
    console.log(`Total de animais: ${todosAnimais.rows.length}`)
    console.table(todosAnimais.rows)
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkReportData().catch(console.error)