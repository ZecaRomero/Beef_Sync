/**
 * API para limpar todas as localizações de animais
 * DELETE - Remove todas as localizações da tabela localizacoes_animais
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return sendMethodNotAllowed(res, ['DELETE'])
  }

  try {
    // Contar quantas localizações existem antes de deletar
    const countResult = await query('SELECT COUNT(*) as total FROM localizacoes_animais')
    const totalLocalizacoes = parseInt(countResult.rows[0]?.total || 0)

    if (totalLocalizacoes === 0) {
      return sendSuccess(res, {
        message: 'Nenhuma localização encontrada para limpar',
        deleted: 0
      })
    }

    // Deletar todas as localizações
    await query('DELETE FROM localizacoes_animais')

    // Limpar também o campo piquete_atual dos animais (opcional)
    await query(`
      UPDATE animais 
      SET piquete_atual = NULL, 
          data_entrada_piquete = NULL
      WHERE piquete_atual IS NOT NULL
    `)

    return sendSuccess(res, {
      message: `${totalLocalizacoes} localização(ões) removida(s) com sucesso`,
      deleted: totalLocalizacoes
    })

  } catch (error) {
    console.error('Erro ao limpar localizações:', error)
    return sendError(res, error.message || 'Erro ao limpar localizações', 500)
  }
}
