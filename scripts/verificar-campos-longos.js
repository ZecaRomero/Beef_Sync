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

async function verificar() {
  const client = await pool.connect()
  
  try {
    // Buscar filhos com campos longos
    const result = await client.query(`
      SELECT 
        serie, rg, serie_mae, rg_mae,
        LENGTH(serie::text) as len_serie,
        LENGTH(rg::text) as len_rg,
        LENGTH(serie_mae::text) as len_serie_mae,
        LENGTH(rg_mae::text) as len_rg_mae
      FROM baixas
      WHERE NOT EXISTS (
        SELECT 1 FROM animais a 
        WHERE UPPER(TRIM(a.serie)) = UPPER(TRIM(baixas.serie))
          AND TRIM(a.rg::text) = TRIM(baixas.rg::text)
      )
      AND (
        LENGTH(serie::text) > 10 
        OR LENGTH(rg::text) > 10
        OR LENGTH(serie_mae::text) > 10
        OR LENGTH(rg_mae::text) > 10
      )
      ORDER BY 
        GREATEST(
          LENGTH(serie::text),
          LENGTH(rg::text),
          LENGTH(COALESCE(serie_mae::text, '')),
          LENGTH(COALESCE(rg_mae::text, ''))
        ) DESC
      LIMIT 20
    `)
    
    console.log('ðÅ¸â€œÅ  Campos com mais de 10 caracteres:\n')
    
    for (const row of result.rows) {
      console.log(`Serie: "${row.serie}" (${row.len_serie} chars)`)
      console.log(`RG: "${row.rg}" (${row.len_rg} chars)`)
      console.log(`Serie MÃ£e: "${row.serie_mae}" (${row.len_serie_mae} chars)`)
      console.log(`RG MÃ£e: "${row.rg_mae}" (${row.len_rg_mae} chars)`)
      console.log('---')
    }
    
    console.log(`\nTotal de registros com campos longos: ${result.rows.length}`)
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificar()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('ðÅ¸â€™¥ Erro fatal:', error)
    process.exit(1)
  })
