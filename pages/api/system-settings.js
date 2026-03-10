const { query } = require('../../lib/database')
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler } from '../../utils/apiResponse'

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getSetting(key) {
  const r = await query('SELECT value FROM system_settings WHERE key = $1', [key])
  return r.rows[0]?.value
}

async function setSetting(key, value) {
  await query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
  `, [key, value])
}

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureTable()
      const maintenanceMode = await getSetting('maintenance_mode')
      const maintenanceMessage = await getSetting('maintenance_message') || 'Sistema em manutenção. Volte em breve.'
      const blockAccess = await getSetting('block_access')
      const sessionToken = await getSetting('session_token') || Date.now().toString()

      const mobileReportsEnabled = await getSetting('mobile_reports_enabled')

      return sendSuccess(res, {
        maintenance_mode: maintenanceMode === 'true',
        maintenance_message: maintenanceMessage,
        block_access: blockAccess === 'true',
        session_token: sessionToken,
        mobile_reports_enabled: mobileReportsEnabled ? JSON.parse(mobileReportsEnabled) : []
      })
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      return sendError(res, 'Erro ao buscar configurações', 500, error.message)
    }
  } else if (req.method === 'PUT') {
    const { maintenance_mode, maintenance_message, block_access, session_token, mobile_reports_enabled } = req.body

    try {
      await ensureTable()
      if (maintenance_mode !== undefined) {
        await setSetting('maintenance_mode', maintenance_mode ? 'true' : 'false')
      }
      if (maintenance_message !== undefined) {
        await setSetting('maintenance_message', maintenance_message)
      }
      if (block_access !== undefined) {
        await setSetting('block_access', block_access ? 'true' : 'false')
      }
      if (session_token !== undefined) {
        await setSetting('session_token', session_token)
      }
      if (mobile_reports_enabled !== undefined && Array.isArray(mobile_reports_enabled)) {
        await setSetting('mobile_reports_enabled', JSON.stringify(mobile_reports_enabled))
      }

      const maintenanceMode = await getSetting('maintenance_mode')
      const maintenanceMessage = await getSetting('maintenance_message') || 'Sistema em manutenção. Volte em breve.'
      const blockAccess = await getSetting('block_access')
      const currentSessionToken = await getSetting('session_token') || Date.now().toString()

      const mobileReportsEnabled = await getSetting('mobile_reports_enabled')

      return sendSuccess(res, {
        maintenance_mode: maintenanceMode === 'true',
        maintenance_message: maintenanceMessage,
        block_access: blockAccess === 'true',
        session_token: currentSessionToken,
        mobile_reports_enabled: mobileReportsEnabled ? JSON.parse(mobileReportsEnabled) : []
      })
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      return sendError(res, 'Erro ao atualizar configurações', 500, error.message)
    }
  } else {
    return sendMethodNotAllowed(res, ['GET', 'PUT'])
  }
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(handler)
