const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'estoque_semen',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
})

async function addCustoColumn() {
  const client = await pool.connect()
  try {
    console.log('Verificando se a coluna custo_dose existe...')
    
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'custo_dose'
    `)

    if (checkColumn.rows.length === 0) {
      console.log('Adicionando coluna custo_dose...')
      await client.query(`
        ALTER TABLE inseminacoes 
        ADD COLUMN custo_dose DECIMAL(12,2) DEFAULT 18.00,
        ADD COLUMN custo_id INTEGER REFERENCES custos(id) ON DELETE SET NULL
      `)
      console.log('✅ Colunas adicionadas com sucesso!')
    } else {
      console.log('✅ Coluna custo_dose já existe')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

addCustoColumn()
