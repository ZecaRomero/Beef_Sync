const { query } = require('../../lib/database')
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler } from '../../utils/apiResponse'

function isMobileUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return false
  const u = ua.toLowerCase()
  // Detecção mais abrangente de dispositivos mobile
  return /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini|tablet|kindle|silk|fennec|mobile safari|windows phone|symbian|palm|nokia|samsung|lg|htc|motorola|xiaomi|huawei|oppo|vivo|realme|oneplus/i.test(u)
}

function parseUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return { browser: '-', os: '-', device: '-' }
  const u = ua
  let browser = '-'
  let os = '-'
  let device = '-'

  if (/Edg\/\d+/i.test(u)) browser = 'Edge'
  else if (/OPR\/\d+|Opera\/\d+/i.test(u)) browser = 'Opera'
  else if (/Chrome\/\d+/i.test(u) && !/Edg/i.test(u)) browser = 'Chrome'
  else if (/Firefox\/\d+/i.test(u)) browser = 'Firefox'
  else if (/Safari\/\d+/i.test(u) && !/Chrome/i.test(u)) browser = 'Safari'
  else if (/SamsungBrowser/i.test(u)) browser = 'Samsung Internet'

  if (/Windows NT/i.test(u)) os = 'Windows'
  else if (/Mac OS X/i.test(u)) os = 'macOS'
  else if (/Android/i.test(u)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(u)) os = 'iOS'
  else if (/Linux/i.test(u)) os = 'Linux'

  if (/iPhone/i.test(u)) device = 'iPhone'
  else if (/iPad/i.test(u)) device = 'iPad'
  else if (/iPod/i.test(u)) device = 'iPod'
  else if (/Android/i.test(u)) {
    const m = u.match(/Android[^;]*;\s*([^);]+)/)
    if (m) {
      device = m[1].trim().replace(/\s+Build\/.*$/i, '').trim() || 'Android'
    } else {
      device = 'Android'
    }
  }
  else if (/Windows/i.test(u)) device = 'PC'
  else if (/Mac/i.test(u)) device = 'Mac'

  return { browser, os, device }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    const { stats, limit = 50 } = req.query

    try {
      await query(`
        CREATE TABLE IF NOT EXISTS access_logs (
          id SERIAL PRIMARY KEY,
          user_name VARCHAR(100) NOT NULL,
          user_type VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          hostname VARCHAR(255),
          user_agent TEXT,
          action VARCHAR(100) DEFAULT 'Login',
          access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      try { await query(`ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)`) } catch (_) {}

      if (stats === 'true') {
        const logs = await query(`
          SELECT user_agent, ip_address, access_time FROM access_logs
          WHERE access_time >= NOW() - INTERVAL '30 days'
        `)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)

        let totalHoje = 0, totalSemana = 0, totalMes = 0
        let mobileHoje = 0, mobileSemana = 0, mobileMes = 0
        const uniqueMobileHoje = new Set()
        const uniqueMobileSemana = new Set()
        const uniqueMobileMes = new Set()

        for (const row of logs.rows) {
          const t = new Date(row.access_time)
          const isMobile = isMobileUserAgent(row.user_agent)
          const fingerprint = `${row.ip_address || ''}|${row.user_agent || ''}`

          if (t >= today) {
            totalHoje++
            if (isMobile) {
              mobileHoje++
              uniqueMobileHoje.add(fingerprint)
            }
          }
          if (t >= weekAgo) {
            totalSemana++
            if (isMobile) {
              mobileSemana++
              uniqueMobileSemana.add(fingerprint)
            }
          }
          if (t >= monthAgo) {
            totalMes++
            if (isMobile) {
              mobileMes++
              uniqueMobileMes.add(fingerprint)
            }
          }
        }

        return sendSuccess(res, {
          hoje: {
            total: totalHoje,
            mobile: mobileHoje,
            desktop: totalHoje - mobileHoje,
            celulares_unicos: uniqueMobileHoje.size
          },
          semana: {
            total: totalSemana,
            mobile: mobileSemana,
            desktop: totalSemana - mobileSemana,
            celulares_unicos: uniqueMobileSemana.size
          },
          mes: {
            total: totalMes,
            mobile: mobileMes,
            desktop: totalMes - mobileMes,
            celulares_unicos: uniqueMobileMes.size
          }
        }, 'Estatísticas de acesso')
      }

      const result = await query(`
        SELECT 
          id,
          user_name,
          user_type,
          ip_address,
          hostname,
          user_agent,
          telefone,
          access_time,
          action,
          created_at
        FROM access_logs 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [Math.min(parseInt(limit) || 50, 200)])

      const rows = result.rows.map(r => {
        const parsed = parseUserAgent(r.user_agent)
        const isMob = isMobileUserAgent(r.user_agent)
        // Log para debug: registrar todos os user agents para análise
        if (process.env.NODE_ENV === 'development') {
          console.log('Access log:', {
            user: r.user_name,
            isMobile: isMob,
            ua: r.user_agent?.substring(0, 100)
          })
        }
        return {
          ...r,
          is_mobile: isMob,
          browser: parsed.browser,
          os: parsed.os,
          device: parsed.device
        }
      })

      return sendSuccess(res, rows, 'Logs de acesso recuperados com sucesso')
    } catch (error) {
      console.error('Erro ao buscar logs de acesso:', error)
      return sendError(res, 'Erro ao buscar logs de acesso', 500, error.message)
    }
  } else if (req.method === 'POST') {
    // Registrar novo acesso
    const { 
      userName, 
      userType, 
      ipAddress, 
      hostname, 
      userAgent, 
      telefone,
      action = 'Login' 
    } = req.body

    try {
      await query(`
        CREATE TABLE IF NOT EXISTS access_logs (
          id SERIAL PRIMARY KEY,
          user_name VARCHAR(100) NOT NULL,
          user_type VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45) NOT NULL,
          hostname VARCHAR(255),
          user_agent TEXT,
          telefone VARCHAR(20),
          action VARCHAR(100) DEFAULT 'Login',
          access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      try { await query(`ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)`) } catch (_) {}

      const result = await query(`
        INSERT INTO access_logs (
          user_name, user_type, ip_address, hostname, user_agent, telefone, action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [userName, userType, ipAddress, hostname, userAgent, telefone || null, action])

      return sendSuccess(res, result.rows[0], 'Acesso registrado com sucesso')
    } catch (error) {
      console.error('Erro ao registrar acesso:', error)
      return sendError(res, 'Erro ao registrar acesso')
    }

  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST'])
  }
}

export default asyncHandler(handler)