/**
 * Snapshot do histórico do relatório de vendas (linhas Excel + base) para mesmo dado em localhost/Vercel/mobile.
 * GET: leitura (header Zeca) / POST: gravação (mesma regra do import-excel — desenvolvedor Zeca).
 */
import { query } from '../../../lib/database'
import { asyncHandler, sendSuccess, sendError } from '../../../utils/apiResponse'
import { blockIfNotZecaDeveloper, canReadRelatorioVendasCloudSync } from '../../../utils/importAccess'

const KEY = 'beef_vendas_relatorio_v1'

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export default asyncHandler(async function handler(req, res) {
  await ensureSettingsTable()

  if (req.method === 'GET') {
    if (!canReadRelatorioVendasCloudSync(req)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado ao snapshot do relatório.',
      })
    }
    const r = await query(
      'SELECT value, updated_at FROM system_settings WHERE key = $1',
      [KEY]
    )
    const row = r.rows[0]
    if (!row?.value) {
      return sendSuccess(res, { vendas: [], updatedAt: null }, 'Sem snapshot salvo')
    }
    let parsed
    try {
      parsed = JSON.parse(row.value)
    } catch {
      return sendSuccess(res, { vendas: [], updatedAt: row.updated_at }, 'Snapshot inválido')
    }
    const vendas = Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed)
        ? parsed
        : []
    return sendSuccess(res, { vendas, updatedAt: row.updated_at }, 'OK')
  }

  if (req.method === 'POST') {
    const blocked = blockIfNotZecaDeveloper(req, res)
    if (blocked) return blocked

    const { vendas } = req.body || {}
    if (!Array.isArray(vendas)) {
      return sendError(res, 'Envie vendas como array', 400)
    }

    const payload = JSON.stringify({
      items: vendas,
      savedAt: new Date().toISOString(),
    })

    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [KEY, payload]
    )

    return sendSuccess(res, { saved: vendas.length }, `${vendas.length} linhas salvas na nuvem`)
  }

  return res.status(405).json({ success: false, message: 'Método não permitido' })
})
