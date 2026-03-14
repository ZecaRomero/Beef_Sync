/**
 * API para limpar todas as localizaÃ§Ãµes de animais
 * DELETE - Remove todas as localizaÃ§Ãµes da tabela localizacoes_animais
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return sendMethodNotAllowed(res, ['DELETE'])
  }

  try {
    // Verificar senha de desenvolvedor
    const senha = req.headers['x-dev-password'] || req.body?.senha || req.query?.senha
    
    if (senha !== 'bfzk26') {
      return sendError(res, 'ðÅ¸â€�â€™ Acesso negado. Senha de desenvolvedor incorreta.', 403)
    }
    
    // Contar quantas localizaÃ§Ãµes existem antes de deletar
    const countResult = await query('SELECT COUNT(*) as total FROM localizacoes_animais')
    const totalLocalizacoes = parseInt(countResult.rows[0]?.total || 0)

    if (totalLocalizacoes === 0) {
      return sendSuccess(res, {
        message: 'Nenhuma localizaÃ§Ã£o encontrada para limpar',
        deleted: 0
      })
    }

    // Deletar todas as localizaÃ§Ãµes
    await query('DELETE FROM localizacoes_animais')

    // Limpar tambÃ©m o campo piquete_atual dos animais (opcional)
    await query(`
      UPDATE animais 
      SET piquete_atual = NULL, 
          data_entrada_piquete = NULL
      WHERE piquete_atual IS NOT NULL
    `)

    return sendSuccess(res, {
      message: `${totalLocalizacoes} localizaÃ§Ã£o(Ãµes) removida(s) com sucesso`,
      deleted: totalLocalizacoes
    })

  } catch (error) {
    console.error('Erro ao limpar localizaÃ§Ãµes:', error)
    return sendError(res, error.message || 'Erro ao limpar localizaÃ§Ãµes', 500)
  }
}
