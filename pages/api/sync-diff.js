/**
 * Compara contagens entre banco local e Supabase
 * Retorna quais tabelas têm diferença e quantos registros
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
]

const SUPABASE_URL = 'postgresql://postgres.bpsltnglmbwdpvumjeaf:softZecaromero85@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

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

  const remotePool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
    max: 2,
  })

  try {
    // Buscar contagens locais e remotas em paralelo
    const [localCounts, remoteCounts] = await Promise.all([
      getCounts(localPool, TABLES),
      getCounts(remotePool, TABLES).catch(() => null), // não travar se Supabase offline
    ])

    const diff = []
    let totalPending = 0

    for (const { key, label } of TABLES) {
      const local = localCounts[key] ?? 0
      const remote = remoteCounts ? (remoteCounts[key] ?? 0) : null
      const delta = remote !== null ? local - remote : null

      if (delta !== null && delta !== 0) {
        diff.push({ key, label, local, remote, delta })
        totalPending += Math.abs(delta)
      } else if (remote === null) {
        // Supabase offline — mostrar só local
        if (local > 0) diff.push({ key, label, local, remote: null, delta: null })
      }
    }

    return res.status(200).json({
      success: true,
      supabaseOnline: remoteCounts !== null,
      totalPending,
      diff,
      localCounts,
      remoteCounts,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  } finally {
    await localPool.end().catch(() => {})
    await remotePool.end().catch(() => {})
  }
}

async function getCounts(pool, tables) {
  const counts = {}
  await Promise.all(
    tables.map(async ({ key }) => {
      try {
        const r = await pool.query(`SELECT COUNT(*) FROM ${key}`)
        counts[key] = parseInt(r.rows[0].count)
      } catch {
        counts[key] = 0
      }
    })
  )
  return counts
}

export const config = { api: { externalResolver: true } }
