require('dotenv').config()
const { Pool } = require('pg')

// Conexão direta ao Supabase (do seu .env)
const SUPABASE_DB_URL = 'postgresql://postgres:softZecaromero85@db.bpsltnglmbwdpvumjeaf.supabase.co:5432/postgres'

async function updateSupabaseSchema() {
  console.log('🔄 Iniciando atualização do schema no Supabase...')
  
  const pool = new Pool({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const client = await pool.connect()
    console.log('✅ Conectado ao Supabase.')

    // 1. Colunas GENEPLUS
    const GP_TRAITS = ['pn', 'p120', 'pd', 'ps', 'stay', 'pes', 'ipp', 'pp30', 'rd']
    const gpCols = []
    for (const t of GP_TRAITS) {
      gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_dep  NUMERIC(8,3)`)
      gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_acc  SMALLINT`)
      gpCols.push(`ADD COLUMN IF NOT EXISTS gp_${t}_pt   SMALLINT`)
    }

    // 2. Colunas ANCP
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

    // 3. Colunas PMGZ
    const pmgzTraits = ['pn', 'pd', 'pa', 'ps', 'ipp', 'stay', 'pe365', 'aol', 'acab', 'mar']
    const pmgzSuffixes = ['dep', 'deca', 'pct']
    const pmgzCols = []
    for (const trait of pmgzTraits) {
      for (const suffix of pmgzSuffixes) {
        pmgzCols.push(`ADD COLUMN IF NOT EXISTS pmgz_${trait}_${suffix} DECIMAL(10,3)`)
      }
    }

    // 4. Colunas DGT (Carcaça) e PROCRIAR (Puberdade)
    const dgtPubCols = [
      'ADD COLUMN IF NOT EXISTS pub_classe VARCHAR(50)',
      'ADD COLUMN IF NOT EXISTS pub_idade NUMERIC(6,2)',
      'ADD COLUMN IF NOT EXISTS pub_pct_media NUMERIC(6,2)',
      'ADD COLUMN IF NOT EXISTS pub_grupo VARCHAR(50)',
      'ADD COLUMN IF NOT EXISTS pub_classif INTEGER',
      'ADD COLUMN IF NOT EXISTS carc_aol NUMERIC(8,2)',
      'ADD COLUMN IF NOT EXISTS carc_aol_100kg NUMERIC(8,2)',
      'ADD COLUMN IF NOT EXISTS carc_ratio NUMERIC(6,3)',
      'ADD COLUMN IF NOT EXISTS carc_mar NUMERIC(6,2)',
      'ADD COLUMN IF NOT EXISTS carc_egs NUMERIC(6,2)',
      'ADD COLUMN IF NOT EXISTS carc_egs_100kg NUMERIC(8,2)',
      'ADD COLUMN IF NOT EXISTS carc_picanha NUMERIC(6,2)'
    ]

    const allCols = [...gpCols, ...ancpCols, ...pmgzCols, ...dgtPubCols]
    
    console.log(`📊 Adicionando ${allCols.length} colunas na tabela "animais" do Supabase...`)
    
    await client.query(`ALTER TABLE animais ${allCols.join(', ')}`)
    
    console.log('✅ Todas as colunas foram criadas no Supabase!')
    
    client.release()
  } catch (err) {
    console.error('❌ Erro ao atualizar schema:', err.message)
  } finally {
    await pool.end()
  }
}

updateSupabaseSchema()
