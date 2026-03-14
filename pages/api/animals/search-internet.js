/**
 * API para buscar informações de animais na internet
 * POST /api/animals/search-internet
 * Body: { serie: string, rg: string }
 */

import animalSearchService from '../../../services/animalSearchService'
import { asyncHandler, sendSuccess, sendValidationError } from '../../../utils/apiResponse'
import logger from '../../../utils/logger'

export default asyncHandler(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' })
  }

  const { serie, rg } = req.body

  if (!serie || !rg) {
    return sendValidationError(res, 'Série e RG são obrigatórios')
  }

  try {
    logger.info(`🔍 Buscando informações na internet para ${serie}${rg}`)
    
    const result = await animalSearchService.searchAnimal(serie, rg)
    
    return sendSuccess(res, result, 'Busca realizada com sucesso')
  } catch (error) {
    logger.error('Erro ao buscar animal na internet:', error)
    return sendValidationError(res, `Erro ao buscar: ${error.message}`)
  }
})
