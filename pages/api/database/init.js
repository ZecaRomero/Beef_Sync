import { createTables } from '../../../lib/database'
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler, HTTP_STATUS } from '../../../utils/apiResponse'

async function handler(req, res) {
  const { method } = req
  if (method !== 'POST' && method !== 'GET') return sendMethodNotAllowed(res, method)

  try {
    await createTables()
    return sendSuccess(res, { recreated: true }, 'Estrutura do banco atualizada com sucesso')
  } catch (error) {
    return sendError(
      res,
      'Erro ao atualizar estrutura do banco',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error?.message || error
    )
  }
}

export default asyncHandler(handler)

