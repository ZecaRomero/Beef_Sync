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

async function atualizar() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Atualizando animal_id nas baixas...\n')
    
    const updateResult = await client.query(`
      UPDATE baixas b
      SET animal_id = a.id
      FROM animais a
      WHERE UPPER(TRIM(a.serie)) = UPPER(TRIM(b.serie))
        AND TRIM(a.rg::text) = TRIM(b.rg::text)
        AND b.animal_id IS NULL
    `)
    
    console.log(`✅ ${updateResult.rowCount} baixas atualizadas com animal_id`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

atualizar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })
