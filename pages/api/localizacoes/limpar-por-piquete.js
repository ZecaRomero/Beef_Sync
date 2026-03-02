/**
 * API para limpar localizações de um piquete específico
 * DELETE - Remove localizações de um piquete específico
 */
import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../../utils/apiResponse'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return sendMethodNotAllowed(res, ['DELETE'])
  }

  const { piquete } = req.query

  if (!piquete) {
    return sendError(res, 'Nome do piquete é obrigatório', 400)
  }

  try {
    // Contar quantas localizações existem para este piquete
    const countResult = await query(
      'SELECT COUNT(*) as total FROM localizacoes_animais WHERE piquete = $1',
      [piquete]
    )
    const totalLocalizacoes = parseInt(countResult.rows[0]?.total || 0)

    if (totalLocalizacoes === 0) {
      return sendSuccess(res, {
        message: `Nenhuma localização encontrada para o piquete "${piquete}"`,
        deleted: 0,
        piquete: piquete
      })
    }

    // Buscar IDs dos animais afetados
    const animaisResult = await query(
      'SELECT DISTINCT animal_id FROM localizacoes_animais WHERE piquete = $1',
      [piquete]
    )
    const animalIds = animaisResult.rows.map(r => r.animal_id)

    // Deletar localizações do piquete específico
    await query('DELETE FROM localizacoes_animais WHERE piquete = $1', [piquete])

    // Limpar piquete_atual apenas dos animais que estavam neste piquete
    if (animalIds.length > 0) {
      await query(
        `UPDATE animais 
         SET piquete_atual = NULL, 
             data_entrada_piquete = NULL
         WHERE id = ANY($1::int[])
         AND piquete_atual = $2`,
        [animalIds, piquete]
      )
    }

    return sendSuccess(res, {
      message: `${totalLocalizacoes} localização(ões) do piquete "${piquete}" removida(s) com sucesso`,
      deleted: totalLocalizacoes,
      piquete: piquete,
      animais_afetados: animalIds.length
    })

  } catch (error) {
    console.error('Erro ao limpar localizações do piquete:', error)
    return sendError(res, error.message || 'Erro ao limpar localizações', 500)
  }
}
