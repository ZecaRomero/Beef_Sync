/**
 * Sincronização Local → Supabase via REST API (HTTPS porta 443)
 * Usa a PostgREST API do Supabase — não precisa de conexão direta PostgreSQL
 */

const { Pool } = require('pg')
require('dotenv').config()
const { SYNC_TABLES } = require('../utils/syncTables')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpsltnglmbwdpvumjeaf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Tabelas para sincronizar (ordem importa por causa de FK)
const TABLES = SYNC_TABLES

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
    if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida no .env')
    if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL não definida no .env')

    log('Conectando ao banco local...')
    await localPool.query('SELECT 1')
    log('✓ Banco local OK')

    log('Conectando ao Supabase via HTTPS...')
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/animais?limit=1`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    })
    if (!testRes.ok) throw new Error(`Supabase retornou ${testRes.status}`)
    log('✓ Supabase OK')

    const results = {}
    const forbiddenColumnsByTable = new Map()

    /**
     * O PostgREST (Supabase) pode retornar erro PGRST204 quando a carga contém colunas
     * que existem no banco local mas não existem no schema remoto (ex: gp_ipp_dep).
     *
     * Para evitar que uma única coluna incompatível derrube toda a tabela, a gente
     * remove automaticamente a(s) coluna(s) faltante(s) do lote e tenta novamente.
     */
    async function postBatchWithSanitization(table, batch) {
      if (!forbiddenColumnsByTable.has(table)) forbiddenColumnsByTable.set(table, new Set())
      const forbidden = forbiddenColumnsByTable.get(table)

      // tenta até 5 vezes removendo colunas faltantes progressivamente
      for (let attempt = 0; attempt < 5; attempt++) {
        // remove todas as colunas já conhecidas como inválidas
        if (forbidden.size > 0) {
          for (const row of batch) {
            for (const col of forbidden) delete row[col]
          }
        }

        try {
          await supabaseRequest('POST', table, batch)
          return
        } catch (err) {
          const message = err?.message || ''
          const m = message.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/)
          if (!m) throw err

          const missingCol = m[1]
          const missingTable = m[2]
          if (missingTable !== table) throw err

          if (!forbidden.has(missingCol)) {
            forbidden.add(missingCol)
            log(`  ⚠ ${table}: coluna desconhecida no Supabase removida do lote (${missingCol})`)
          } else {
            // se já removemos essa coluna e continua falhando, não há o que tentar
            throw err
          }
        }
      }
    }

    // 1. Limpar TODAS as tabelas remotas primeiro (ordem REVERSA para FK)
    log('\n🧹 Limpando dados remotos (ordem reversa)...')
    const reversedTables = [...TABLES].reverse()
    for (const table of reversedTables) {
      try {
        await supabaseRequest('DELETE', table, null, '?id=gte.0')
        log(`  ✓ ${table}: limpa`)
      } catch (err) {
        log(`  ⚠ ${table}: erro ao limpar (${err.message}). Tentando fallback...`)
        try {
          await supabaseRequest('DELETE', table, null, '?created_at=gte.1900-01-01')
          log(`    ✓ ${table}: limpa (fallback)`)
        } catch (err2) {
          log(`    ✗ ${table}: falha total ao limpar (${err2.message})`)
        }
      }
    }

    // 2. Inserir dados (ordem NORMAL)
    log('\n📤 Enviando dados locais...')
    for (const table of TABLES) {
      try {
        // Verificar se tabela existe localmente
        const exists = await localPool.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        )
        if (!exists.rows[0].exists) {
          log(`⚠ ${table}: não existe localmente, pulando`)
          continue
        }

        const { rows } = await localPool.query(`SELECT * FROM ${table}`)

        if (rows.length === 0) {
          log(`  → ${table}: vazia localmente`)
          results[table] = { inserted: 0 }
          continue
        }

        // Inserir em lotes de 200
        const batchSize = 200
        let inserted = 0

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          // Usar upsert por segurança caso o DELETE tenha falhado para alguns registros
          await postBatchWithSanitization(table, batch)
          inserted += batch.length
        }

        log(`  ✓ ${table}: ${inserted} registros enviados`)
        results[table] = { inserted }
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
  }
}

if (require.main === module) {
  syncToSupabase(console.log).then(r => process.exit(r.success ? 0 : 1))
}

module.exports = { syncToSupabase }
