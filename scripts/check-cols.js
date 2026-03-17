require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT)||5432, database: process.env.DB_NAME||'beef_sync', user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'', ssl: false })

async function run() {
  const r1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='animais' AND column_name LIKE 'pmgz%' ORDER BY column_name")
  console.log('PMGZ cols:', r1.rows.map(c => c.column_name).join(', '))
  const r2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='animais' AND column_name SIMILAR TO '(pub|carc|ancp)_%' ORDER BY column_name")
  console.log('Outros:', r2.rows.map(c => c.column_name).join(', '))
  // checar um animal com dados
  const r3 = await pool.query("SELECT serie, rg, iqg, mgte, pub_classe, carc_aol, pmgz_pn_dep FROM animais WHERE pmgz_pn_dep IS NOT NULL LIMIT 3")
  console.log('Exemplo PMGZ:', r3.rows)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
