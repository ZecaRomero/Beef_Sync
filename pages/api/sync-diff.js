/**
 * Compara contagens entre banco local e Supabase via REST API (HTTPS)
 */
const { Pool } = require('pg')

const TABLES = [
  { key: 'animais', label: 'Animais' },
  { key: 'custos', label: 'Custos' },
  { key: 'pesagens', label: 'Pesagens' },
  { key: 'inseminacoes', label: 'Inseminações' },
  { key: 'gestacoes', label: 'Gestações' },
  { key: 'nascimentos', label: 'Nascimentos' },
  { key: 'localizacoes_animais', label: 'Localizações' },
  { key: 'estoque_semen', label: 'Estoque Sêmen' },
  { key: 'transferencias_embrioes', label: 'Transferências' },
  { key: 'coleta_fiv', label: 'Coletas FIV' },
  { key: 'baixas', label: 'Baixas' },
  { key: 'mortes', label: 'Mortes' },
  { key: 'notas_fiscais', label: 'Notas Fiscais' },
  { key: 'historia_ocorrencias', label: 'Ocorrências' },
  { key: 'abastecimento_nitrogenio', label: 'Abastecimento Nitrogênio' },
]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function getSupabaseCount(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact',
      'Range': '0-0',
    },
  })
  if (!res.ok) return 0
  const range = res.headers.get('content-range') // ex: "0-0/312"
  if (range) {
    const total = range.split('/')[1]
    return parseInt(total) || 0
  }
  return 0
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const localPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'beef_sync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
    connectionTimeoutMillis: 5000,
    max: 2,
  })

  try {
    // Contagens locais
    const localCounts = {}
    await Promise.all(
      TABLES.map(async ({ key }) => {
        try {
          const r = await localPool.query(
            `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) as exists`,
            [key]
          )
          if (!r.rows[0].exists) { localCounts[key] = 0; return }
          const c = await localPool.query(`SELECT COUNT(*) FROM ${key}`)
          localCounts[key] = parseInt(c.rows[0].count)
        } catch { localCounts[key] = 0 }
      })
    )

    // Contagens Supabase via HTTPS
    let remoteCounts = null
    let supabaseOnline = false
    try {
      const counts = {}
      await Promise.all(
        TABLES.map(async ({ key }) => {
          counts[key] = await getSupabaseCount(key).catch(() => 0)
        })
      )
      remoteCounts = counts
      supabaseOnline = true
    } catch { supabaseOnline = false }

    const diff = []
    let totalPending = 0

    for (const { key, label } of TABLES) {
      const local = localCounts[key] ?? 0
      const remote = remoteCounts ? (remoteCounts[key] ?? 0) : null
      const delta = remote !== null ? local - remote : null

      if (delta !== null && delta !== 0) {
        diff.push({ key, label, local, remote, delta })
        totalPending += Math.abs(delta)
      }
    }

    return res.status(200).json({
      success: true,
      supabaseOnline,
      totalPending,
      diff,
      localCounts,
      remoteCounts,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  } finally {
    await localPool.end().catch(() => {})
  }
}

export const config = { api: { externalResolver: true } }
