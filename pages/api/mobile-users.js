/**
 * API para gerenciar usuários mobile
 */
import { query } from '../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../utils/apiResponse'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Listar todos os usuários mobile
      const result = await query(`
        SELECT 
          id, nome, telefone, ip_address, user_agent,
          first_access, last_access, access_count, ativo,
          observacoes, created_at, updated_at
        FROM mobile_access_logs
        ORDER BY last_access DESC
      `)

      return sendSuccess(res, result.rows)
    }

    if (req.method === 'PUT') {
      // Atualizar status do usuário
      const { id, ativo } = req.body

      if (!id) {
        return sendError(res, 'ID é obrigatório', 400)
      }

      const result = await query(`
        UPDATE mobile_access_logs
        SET ativo = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [ativo, id])

      if (result.rows.length === 0) {
        return sendError(res, 'Usuário não encontrado', 404)
      }

      return sendSuccess(res, {
        message: 'Status atualizado com sucesso',
        user: result.rows[0]
      })
    }

    return sendMethodNotAllowed(res, ['GET', 'PUT'])

  } catch (error) {
    console.error('Erro na API mobile-users:', error)
    return sendError(res, error.message || 'Erro ao processar requisição', 500)
  }
}
