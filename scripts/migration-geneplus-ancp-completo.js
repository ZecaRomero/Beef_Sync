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
  const gpCols = []
  for (const t of GP_TRAITS) {
    gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_dep  NUMERIC(8,3)`)
    gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_acc  SMALLINT`)
    gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_pt   SMALLINT`)
  }

  const ancpCols = [
    'ADD COLUMN IF NOT EXISTS ancp_d3p       NUMERIC(8,2)',
    'ADD COLUMN IF NOT EXISTS ancp_dipp      NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dipp  SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_dpe365    NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dpe365 SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_dpn       NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dpn   SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_dstay     NUMERIC(8,2)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dstay SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_mp120     NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_mp120 SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_mp210     NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_mp210 SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_dp450     NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dp450 SMALLINT',
    'ADD COLUMN IF NOT EXISTS ancp_daol      NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_dacab     NUMERIC(8,3)',
    'ADD COLUMN IF NOT EXISTS ancp_top_dacab SMALLINT',
  ]

  const allCols = [...gpCols, ...ancpCols]
  await pool.query(`ALTER TABLE animais\n  ${allCols.join(',\n  ')}`)
  console.log(`${allCols.length} colunas criadas (${gpCols.length} GENEPLUS + ${ancpCols.length} ANCP)!`)
  await pool.end()
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
