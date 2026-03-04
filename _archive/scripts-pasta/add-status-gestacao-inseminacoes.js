const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'estoque_semen',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
})

async function addStatusGestacaoColumn() {
  const client = await pool.connect()
  try {
    console.log('Verificando se a coluna status_gestacao existe...')
    
    // Verificar se a coluna existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'status_gestacao'
    `)

    if (checkColumn.rows.length === 0) {
      console.log('Adicionando coluna status_gestacao...')
      await client.query(`
        ALTER TABLE inseminacoes 
        ADD COLUMN status_gestacao VARCHAR(20),
        ADD COLUMN tecnico VARCHAR(100),
        ADD COLUMN protocolo VARCHAR(50)
      `)
      console.log('✅ Colunas adicionadas com sucesso!')
    } else {
      console.log('✅ Coluna status_gestacao já existe')
    }

    // Verificar e adicionar tecnico se não existir
    const checkTecnico = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'tecnico'
    `)
    if (checkTecnico.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN tecnico VARCHAR(100)')
      console.log('✅ Coluna tecnico adicionada')
    }

    // Verificar e adicionar protocolo se não existir
    const checkProtocolo = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inseminacoes' 
      AND column_name = 'protocolo'
    `)
    if (checkProtocolo.rows.length === 0) {
      await client.query('ALTER TABLE inseminacoes ADD COLUMN protocolo VARCHAR(50)')
      console.log('✅ Coluna protocolo adicionada')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

addStatusGestacaoColumn()
