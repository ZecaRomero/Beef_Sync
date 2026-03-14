/**
 * API para gerenciar restrições de usuários (banir, colocar em espera).
 * Tipos: banido | em_espera
 * Identificadores: email | phone | ip | uid (Supabase user id)
 */
const { query } = require('../../lib/database')
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler } from '../../utils/apiResponse'

const TIPOS = ['banido', 'em_espera']
const IDENTIFICADORES = ['email', 'phone', 'ip', 'uid']

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios_restricoes (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('banido', 'em_espera')),
      identificador VARCHAR(20) NOT NULL CHECK (identificador IN ('email', 'phone', 'ip', 'uid')),
      valor VARCHAR(255) NOT NULL,
      motivo TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tipo, identificador, valor)
    )
  `)
}

async function handler(req, res) {
  if (req.method === 'GET') {
    const { check, email, phone, ip, uid } = req.query
    try {
      await ensureTable()

      // Verificar se um usuário específico está restrito (para login/acesso)
      if (check === '1') {
        const checks = []
        const params = []
        let idx = 1
        if (email) { checks.push(`(identificador='email' AND valor=$${idx})`); params.push(String(email).trim().toLowerCase()); idx++ }
        if (phone) { checks.push(`(identificador='phone' AND valor=$${idx})`); params.push(String(phone).replace(/\D/g, '')); idx++ }
        if (ip) { checks.push(`(identificador='ip' AND valor=$${idx})`); params.push(String(ip).trim()); idx++ }
        if (uid) { checks.push(`(identificador='uid' AND valor=$${idx})`); params.push(String(uid).trim()); idx++ }
        if (checks.length === 0) {
          return sendSuccess(res, { banned: false, em_espera: false }, 'Nenhum identificador para verificar')
        }
        const r = await query(`
          SELECT tipo FROM usuarios_restricoes
          WHERE ${checks.join(' OR ')}
        `, params)
        const banned = r.rows.some(x => x.tipo === 'banido')
        const em_espera = r.rows.some(x => x.tipo === 'em_espera')
        return sendSuccess(res, { banned, em_espera, restricoes: r.rows }, 'Verificação concluída')
      }

      const result = await query(`
        SELECT id, tipo, identificador, valor, motivo, created_at
        FROM usuarios_restricoes
        ORDER BY created_at DESC
      `)
      return sendSuccess(res, result.rows, 'Restrições obtidas')
    } catch (err) {
      console.error('Erro usuarios-restricoes GET:', err)
      return sendError(res, 'Erro ao buscar restrições', 500, err.message)
    }
  }

  if (req.method === 'POST') {
    const { tipo, identificador, valor, motivo } = req.body || {}
    if (!tipo || !identificador || !valor) {
      return sendError(res, 'tipo, identificador e valor são obrigatórios', 400)
    }
    if (!TIPOS.includes(tipo)) {
      return sendError(res, `tipo deve ser: ${TIPOS.join(', ')}`, 400)
    }
    if (!IDENTIFICADORES.includes(identificador)) {
      return sendError(res, `identificador deve ser: ${IDENTIFICADORES.join(', ')}`, 400)
    }
    const valorNorm = identificador === 'phone'
      ? String(valor).replace(/\D/g, '')
      : String(valor).trim().toLowerCase()
    if (!valorNorm) return sendError(res, 'valor não pode ser vazio', 400)

    try {
      await ensureTable()
      await query(`
        INSERT INTO usuarios_restricoes (tipo, identificador, valor, motivo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tipo, identificador, valor) DO UPDATE SET motivo = $4, created_at = CURRENT_TIMESTAMP
      `, [tipo, identificador, valorNorm, motivo || null])
      const r = await query('SELECT * FROM usuarios_restricoes WHERE tipo=$1 AND identificador=$2 AND valor=$3',
        [tipo, identificador, valorNorm])
      return sendSuccess(res, r.rows[0], tipo === 'banido' ? 'Usuário banido' : 'Usuário colocado em espera')
    } catch (err) {
      console.error('Erro usuarios-restricoes POST:', err)
      return sendError(res, 'Erro ao aplicar restrição', 500, err.message)
    }
  }

  if (req.method === 'DELETE') {
    const { id, tipo, identificador, valor } = req.query
    try {
      await ensureTable()
      if (id) {
        await query('DELETE FROM usuarios_restricoes WHERE id = $1', [id])
      } else if (tipo && identificador && valor) {
        const valorNorm = String(valor).trim().toLowerCase()
        await query('DELETE FROM usuarios_restricoes WHERE tipo=$1 AND identificador=$2 AND valor=$3',
          [tipo, identificador, valorNorm])
      } else {
        return sendError(res, 'Informe id ou (tipo, identificador, valor)', 400)
      }
      return sendSuccess(res, null, 'Restrição removida')
    } catch (err) {
      console.error('Erro usuarios-restricoes DELETE:', err)
      return sendError(res, 'Erro ao remover restrição', 500, err.message)
    }
  }

  return sendMethodNotAllowed(res, ['GET', 'POST', 'DELETE'])
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(handler)
