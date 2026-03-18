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

async function run() {
  const GP_TRAITS = ['pn', 'p120', 'pd', 'ps', 'stay', 'pes', 'ipp', 'pp30', 'rd']
  const alters = []
  for (const t of GP_TRAITS) {
    alters.push(`ALTER COLUMN gp_${t}_acc TYPE NUMERIC(6,2) USING gp_${t}_acc::NUMERIC(6,2)`)
    alters.push(`ALTER COLUMN gp_${t}_pt  TYPE NUMERIC(6,2) USING gp_${t}_pt::NUMERIC(6,2)`)
  }

  const ancpTops = ['ancp_top_dipp','ancp_top_dpe365','ancp_top_dpn','ancp_top_dstay','ancp_top_mp120','ancp_top_mp210','ancp_top_dp450','ancp_top_dacab']
  for (const c of ancpTops) {
    alters.push(`ALTER COLUMN ${c} TYPE NUMERIC(6,2) USING ${c}::NUMERIC(6,2)`)
  }

  await pool.query(`ALTER TABLE animais\n  ${alters.join(',\n  ')}`)
  console.log(`${alters.length} colunas alteradas para NUMERIC!`)
  await pool.end()
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
