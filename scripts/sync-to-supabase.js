/**
 * Sincronização Local → Supabase
 * Exporta dados do banco local e importa no Supabase via pg_dump + psql
 * ou via queries diretas usando a API REST do Supabase
 */

const { Pool } = require('pg')
require('dotenv').config()

const SUPABASE_URL = 'postgresql://postgres.bpsltnglmbwdpvumjeaf:softZecaromero85@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

// Tabelas para sincronizar (ordem importa por causa de FK)
const TABLES = [
  'animais',
  'custos',
  'pesagens',
  'inseminacoes',
  'gestacoes',
  'nascimentos',
  'localizacoes_animais',
  'estoque_semen',
  'transferencias_embrioes',
  'coleta_fiv',
  'baixas',
  'mortes',
  'notas_fiscais',
  'notas_fiscais_itens',
  'boletim_contabil',
  'movimentacoes_contabeis',
  'historia_ocorrencias',
]

async function syncToSupabase(onProgress) {
  const localPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
    connectionTimeoutMillis: 10000,
  })

  const remotePool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    query_timeout: 60000,
  })

  const log = (msg) => {
    console.log(msg)
    if (onProgress) onProgress(msg)
  }

  try {
    log('Conectando ao banco local...')
    await localPool.query('SELECT 1')
    log('✓ Banco local OK')

    log('Conectando ao Supabase...')
    await remotePool.query('SELECT 1')
    log('✓ Supabase OK')

    const results = {}

    for (const table of TABLES) {
      try {
        // Verificar se tabela existe localmente
        const exists = await localPool.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        )
        if (!exists.rows[0].exists) {
          log(`⚠ Tabela ${table} não existe localmente, pulando...`)
          continue
        }

        log(`Sincronizando ${table}...`)
        const { rows } = await localPool.query(`SELECT * FROM ${table}`)

        if (rows.length === 0) {
          log(`  → ${table}: vazia, pulando`)
          results[table] = { inserted: 0, skipped: 0 }
          continue
        }

        // Truncar tabela remota e reinserir
        await remotePool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`)

        // Inserir em lotes de 100
        const cols = Object.keys(rows[0])
        const batchSize = 100
        let inserted = 0

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const placeholders = batch.map((_, bi) =>
            `(${cols.map((_, ci) => `$${bi * cols.length + ci + 1}`).join(', ')})`
          ).join(', ')
          const values = batch.flatMap(row => cols.map(c => row[c]))

          await remotePool.query(
            `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
            values
          )
          inserted += batch.length
        }

        log(`  ✓ ${table}: ${inserted} registros`)
        results[table] = { inserted, skipped: 0 }
      } catch (err) {
        log(`  ✗ ${table}: ${err.message}`)
        results[table] = { error: err.message }
      }
    }

    log('\n✅ Sincronização concluída!')
    return { success: true, results }
  } catch (err) {
    log(`\n❌ Erro: ${err.message}`)
    return { success: false, error: err.message }
  } finally {
    await localPool.end().catch(() => {})
    await remotePool.end().catch(() => {})
  }
}

// Executar direto se chamado via CLI
if (require.main === module) {
  syncToSupabase(console.log).then(result => {
    process.exit(result.success ? 0 : 1)
  })
}

module.exports = { syncToSupabase, SUPABASE_URL }
