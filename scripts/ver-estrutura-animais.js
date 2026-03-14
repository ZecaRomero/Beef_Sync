const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function ver() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Estrutura da tabela animais:\n')
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      ORDER BY ordinal_position
    `)

    result.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type}`)
    })

    // Buscar CJCJ 17037 com todas as colunas
    console.log('\n🔍 Dados da CJCJ 17037:\n')
    const animal = await client.query(`
      SELECT * FROM animais
      WHERE serie ILIKE '%CJCJ%' AND rg::text LIKE '%17037%'
      LIMIT 1
    `)

    if (animal.rows.length > 0) {
      console.log(JSON.stringify(animal.rows[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

ver()
