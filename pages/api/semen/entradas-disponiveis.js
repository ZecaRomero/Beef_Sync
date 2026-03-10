import semenService from '../../../services/semenService'
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler, HTTP_STATUS } from '../../../utils/apiResponse'

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const tipo = req.query.tipo || null // 'semen' | 'embriao' | null (todos)
      const result = await semenService.buscarEstoqueDisponivel(tipo)
      
      if (result.success) {
        return sendSuccess(res, result.data, 'Entradas disponíveis obtidas com sucesso')
      } else {
        return sendError(res, result.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error)
      }
    } catch (error) {
      console.error('Erro ao buscar entradas disponíveis:', error)
      return sendError(res, 'Erro ao buscar entradas disponíveis', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    }
  } else {
    return sendMethodNotAllowed(res, req.method)
  }
}

export default asyncHandler(handler)