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
    // Tenta extrair a mensagem do erro do Supabase (geralmente JSON com "message").
    let message = text
    try {
      const parsed = JSON.parse(text)
      message =
        parsed?.message ||
        parsed?.error_description ||
        parsed?.details ||
        text
      if (parsed?.details) message += ` | details: ${parsed.details}`
      if (parsed?.hint) message += ` | hint: ${parsed.hint}`
    } catch {
      // mantém "text" como fallback
    }
    throw new Error(`HTTP ${res.status}: ${message}`)
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

      // Sanitizacao para divergencias de tipo:
      // Ajusta strings do tipo "8.00" (inteiro com zeros decimais) para inteiro,
      // que normalmente falham quando o Supabase espera `integer`.
      if (table === 'animais') {
        for (const row of batch) {
          if (!row || typeof row !== 'object') continue
          for (const [k, v] of Object.entries(row)) {
            if (typeof v === 'string') {
              const t = v.trim()
              if (/^-?\d+\.0+$/.test(t)) row[k] = parseInt(t.split('.')[0], 10)
            }
          }
        }
      }

      // tenta removendo colunas faltantes progressivamente
      // (pode haver mais de uma coluna divergente entre local x Supabase)
      for (let attempt = 0; attempt < 30; attempt++) {
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

          // Caso de divergencia de tipo: Supabase espera integer e recebemos decimal como string ("0.50").
          // Tentativa: banir as colunas que tenham exatamente o valor que causou o erro no lote.
          if (table === 'animais') {
            const intSyntax = message.match(/invalid input syntax for type integer:\s*"([^"]+)"/i)
            if (intSyntax && intSyntax[1]) {
              const badValue = intSyntax[1].trim()
              const keysToBan = new Set()
              for (const row of batch) {
                if (!row || typeof row !== 'object') continue
                for (const [k, v] of Object.entries(row)) {
                  if (typeof v === 'string' && v.trim() === badValue) keysToBan.add(k)
                }
              }
              if (keysToBan.size > 0) {
                for (const col of keysToBan) {
                  if (!forbidden.has(col)) {
                    forbidden.add(col)
                    log(`  ⚠ ${table}: coluna com tipo incompativel removida do lote (${col}=${badValue})`)
                  }
                }
                // tenta novamente sem essas colunas
                continue
              }
            }
          }

          // Variações do texto do PostgREST/Supabase
          const m =
            message.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/) ||
            message.match(/Could not find the "([^"]+)" column of "([^"]+)" in the schema cache/) ||
            message.match(/Could not find the '([^']+)' column of ([^ ]+) in the schema cache/) ||
            message.match(/Could not find the '([^']+)' column/) ||
            message.match(/Could not find the "([^"]+)" column/)

          if (!m) throw err

          // Preferimos o formato completo (coluna + tabela). Se cair nos outros,
          // assumimos apenas a coluna.
          const missingCol = m.length >= 3 ? m[1] : m[1]
          const missingTable = m.length >= 3 ? m[2] : table
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
    //    Observacao: nao deletar 'animais' por enquanto para evitar deixar o Supabase vazio
    //    caso a insercao dessa tabela falhe (isso quebra as FK das tabelas filhas).
    log('\n🧹 Limpando dados remotos (ordem reversa)...')
    const reversedTables = [...TABLES].reverse()
    for (const table of reversedTables) {
      if (table === 'animais') {
        log(`  ⚠ ${table}: pulando delecao remota (vamos inserir via upsert primeiro)`)
        continue
      }
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
        // `animais` e pai de varias FK: se falhar, nao faz sentido seguir para filhas
        if (table === 'animais') {
          return { success: false, results, error: `Falha em ${table}: ${err.message}` }
        }
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
