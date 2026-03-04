require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: parseInt(process.env.DB_PORT) || 5432,
})
const rgs = process.argv.slice(2).length ? process.argv.slice(2) : ['3617', '3629']
async function main() {
  for (const rg of rgs) {
    const r = await pool.query('SELECT id, nome, serie, rg, raca FROM animais WHERE rg = $1', [rg])
    console.log('RG', rg + ':', r.rows.length, 'registros')
    r.rows.forEach(a => console.log('  -', a.id, a.nome, a.serie, a.raca))
  }
  await pool.end()
}
main()
