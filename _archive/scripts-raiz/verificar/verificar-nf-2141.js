const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function verificarNF() {
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT * FROM notas_fiscais 
      WHERE numero_nf = '2141'
      ORDER BY id DESC
      LIMIT 1
    `)
    
    if (result.rows.length > 0) {
      console.log('NF encontrada:')
      console.log(JSON.stringify(result.rows[0], null, 2))
    } else {
      console.log('NF não encontrada')
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

verificarNF()
