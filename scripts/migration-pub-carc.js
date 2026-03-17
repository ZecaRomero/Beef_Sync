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
  await pool.query(`
    ALTER TABLE animais
      ADD COLUMN IF NOT EXISTS pub_classe VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pub_idade NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS pub_pct_media NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS pub_grupo VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pub_classif INTEGER,
      ADD COLUMN IF NOT EXISTS carc_aol NUMERIC(8,2),
      ADD COLUMN IF NOT EXISTS carc_aol_100kg NUMERIC(8,2),
      ADD COLUMN IF NOT EXISTS carc_ratio NUMERIC(6,3),
      ADD COLUMN IF NOT EXISTS carc_mar NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS carc_egs NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS carc_egs_100kg NUMERIC(8,2),
      ADD COLUMN IF NOT EXISTS carc_picanha NUMERIC(6,2)
  `)
  console.log('✅ Colunas criadas com sucesso!')
  await pool.end()
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1) })
