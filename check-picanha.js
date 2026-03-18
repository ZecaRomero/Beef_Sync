require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function check() {
  try {
    const result = await pool.query(
      'SELECT serie, rg, carc_picanha FROM animais WHERE serie = $1 AND rg = $2',
      ['CJCJ', '16681']
    )
    console.log('Resultado:', JSON.stringify(result.rows, null, 2))
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await pool.end()
  }
}

check()
