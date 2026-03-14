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

async function testar() {
  const client = await pool.connect()
  
  try {
    console.log('ðÅ¸â€�� Testando consulta de filhos da CJCJ 16013...\n')
    
    const serie = 'CJCJ'
    const rg = '16013'
    
    // Mesma consulta que a API usa
    const result = await client.query(`
      SELECT * FROM animais 
      WHERE (serie_mae = $1 AND rg_mae = $2) 
         OR mae LIKE $3 
         OR mae = $4 
      ORDER BY data_nascimento DESC
    `, [serie, rg, `%${serie}-${rg}%`, `${serie} ${rg}`])
    
    console.log(`ðÅ¸â€œÅ  Total de filhos encontrados: ${result.rows.length}\n`)
    
    if (result.rows.length > 0) {
      console.log('ðÅ¸â€œâ€¹ Lista de filhos:')
      result.rows.forEach((f, i) => {
        console.log(`${i + 1}. ${f.serie} ${f.rg} | ${f.nome || 'sem nome'} | ${f.sexo} | ${f.situacao}`)
        if (f.data_nascimento) {
          const nasc = new Date(f.data_nascimento)
          console.log(`   Nascimento: ${nasc.toLocaleDateString('pt-BR')}`)
        }
      })
    }
    
  } catch (error) {
    console.error('â�Å’ Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

testar()
