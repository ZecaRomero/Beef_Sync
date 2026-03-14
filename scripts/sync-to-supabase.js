/**
 * SincronizaÃ§Ã£o Local ââ€ â€™ Supabase via REST API (HTTPS porta 443)
 * Usa a PostgREST API do Supabase ââ‚¬â€� nÃ£o precisa de conexÃ£o direta PostgreSQL
 */

const { Pool } = require('pg')
require('dotenv').config()

const SUPABASE_URL = 'https://bpsltnglmbwdpvumjeaf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function supabaseRequest(method, table, body = null, extra = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${extra}`
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }
  return res
}

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

  const log = (msg) => {
    console.log(msg)
    if (onProgress) onProgress(msg)
  }

  try {
    if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY nÃ£o definida no .env')

    log('Conectando ao banco local...')
    await localPool.query('SELECT 1')
    log('âÅ“â€œ Banco local OK')

    log('Conectando ao Supabase via HTTPS...')
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/animais?limit=1`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    })
    if (!testRes.ok) throw new Error(`Supabase retornou ${testRes.status}`)
    log('âÅ“â€œ Supabase OK')

    const results = {}

    for (const table of TABLES) {
      try {
        // Verificar se tabela existe localmente
        const exists = await localPool.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        )
        if (!exists.rows[0].exists) {
          log(`âÅ¡  ${table}: nÃ£o existe localmente, pulando`)
          continue
        }

        log(`Sincronizando ${table}...`)
        const { rows } = await localPool.query(`SELECT * FROM ${table}`)

        if (rows.length === 0) {
          // Limpar tabela remota tambÃ©m
          await supabaseRequest('DELETE', table, null, '?id=gte.0').catch(() => {})
          log(`  ââ€ â€™ ${table}: vazia`)
          results[table] = { inserted: 0 }
          continue
        }

        // 1. Deletar todos os registros remotos (truncate via DELETE)
        await supabaseRequest('DELETE', table, null, '?id=gte.0').catch(async () => {
          // Fallback: tentar com campo diferente
          await supabaseRequest('DELETE', table, null, '?created_at=gte.1900-01-01').catch(() => {})
        })

        // 2. Inserir em lotes de 200
        const batchSize = 200
        let inserted = 0

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          await supabaseRequest('POST', table, batch)
          inserted += batch.length
        }

        log(`  âÅ“â€œ ${table}: ${inserted} registros`)
        results[table] = { inserted }
      } catch (err) {
        log(`  âÅ“â€” ${table}: ${err.message}`)
        results[table] = { error: err.message }
      }
    }

    log('\nâÅ“â€¦ SincronizaÃ§Ã£o concluÃ­da!')
    return { success: true, results }
  } catch (err) {
    log(`\nâ�Å’ Erro: ${err.message}`)
    return { success: false, error: err.message }
  } finally {
    await localPool.end().catch(() => {})
  }
}

if (require.main === module) {
  syncToSupabase(console.log).then(r => process.exit(r.success ? 0 : 1))
}

module.exports = { syncToSupabase }
