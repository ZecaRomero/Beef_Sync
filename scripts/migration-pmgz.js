require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false
})

// 10 traits × 3 colunas = 30 colunas novas
const TRAITS = ['pn', 'pd', 'pa', 'ps', 'ipp', 'stay', 'pe365', 'aol', 'acab', 'mar']

async function run() {
  const cols = []
  for (const t of TRAITS) {
    cols.push(`ADD COLUMN IF NOT EXISTS pmgz_${t}_dep  NUMERIC(8,3)`)
    cols.push(`ADD COLUMN IF NOT EXISTS pmgz_${t}_deca SMALLINT`)
    cols.push(`ADD COLUMN IF NOT EXISTS pmgz_${t}_pct  NUMERIC(5,1)`)
  }
  await pool.query(`ALTER TABLE animais\n  ${cols.join(',\n  ')}`)
  console.log(`✅ ${cols.length} colunas PMGZ criadas!`)
  await pool.end()
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
