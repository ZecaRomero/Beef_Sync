const { query } = require('../../lib/database')
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler } from '../../utils/apiResponse'

const STALE_SECONDS = 120

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_presence_sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(80) UNIQUE NOT NULL,
      user_name VARCHAR(200),
      user_type VARCHAR(80),
      telefone VARCHAR(30),
      email VARCHAR(200),
      current_path TEXT,
      user_agent TEXT,
      is_mobile BOOLEAN DEFAULT false,
      session_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_presence_last_ping ON user_presence_sessions(last_ping_at)`)
}

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await ensureTable()
      await query(
        `DELETE FROM user_presence_sessions WHERE last_ping_at < NOW() - INTERVAL '30 days'`
      ).catch(() => {})

      const r = await query(
        `
        SELECT
          session_id,
          user_name,
          user_type,
          telefone,
          email,
          current_path,
          is_mobile,
          session_started_at,
          last_ping_at,
          EXTRACT(EPOCH FROM (NOW() - session_started_at))::int AS session_seconds,
          EXTRACT(EPOCH FROM (NOW() - last_ping_at))::int AS seconds_since_ping
        FROM user_presence_sessions
        WHERE last_ping_at > NOW() - ($1 * interval '1 second')
        ORDER BY last_ping_at DESC
        `,
        [STALE_SECONDS]
      )
      return sendSuccess(res, {
        staleSeconds: STALE_SECONDS,
        online: r.rows || [],
        count: (r.rows || []).length,
      })
    } catch (e) {
      console.error('presence GET:', e)
      return sendError(res, 'Erro ao listar presença', 500, e.message)
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        sessionId,
        userName,
        userType,
        telefone,
        email,
        path: currentPath,
        isMobile,
        userAgent,
      } = req.body || {}

      if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 80) {
        return sendError(res, 'sessionId inválido', 400)
      }
      const name = (userName && String(userName).trim()) || ''
      if (!name) {
        return sendError(res, 'userName obrigatório', 400)
      }

      await ensureTable()

      const result = await query(
        `
        INSERT INTO user_presence_sessions (
          session_id, user_name, user_type, telefone, email, current_path, user_agent, is_mobile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (session_id) DO UPDATE SET
          user_name = EXCLUDED.user_name,
          user_type = EXCLUDED.user_type,
          telefone = EXCLUDED.telefone,
          email = EXCLUDED.email,
          current_path = EXCLUDED.current_path,
          user_agent = EXCLUDED.user_agent,
          is_mobile = EXCLUDED.is_mobile,
          last_ping_at = NOW()
        RETURNING session_id, session_started_at, last_ping_at
        `,
        [
          sessionId.slice(0, 80),
          name.slice(0, 200),
          (userType && String(userType).slice(0, 80)) || 'App',
          telefone ? String(telefone).replace(/\D/g, '').slice(0, 20) : null,
          email ? String(email).slice(0, 200) : null,
          currentPath ? String(currentPath).slice(0, 500) : null,
          userAgent ? String(userAgent).slice(0, 500) : null,
          !!isMobile,
        ]
      )

      return sendSuccess(res, result.rows[0] || { ok: true })
    } catch (e) {
      console.error('presence POST:', e)
      return sendError(res, 'Erro ao registrar presença', 500, e.message)
    }
  }

  return sendMethodNotAllowed(res, ['GET', 'POST'])
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(handler)
