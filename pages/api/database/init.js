// lib/database.js é CommonJS; para evitar problemas com named exports em ESM,
// usamos require para pegar a função createTables.
const { createTables } = require('../../../lib/database')
import { sendSuccess, sendError, sendMethodNotAllowed, asyncHandler, HTTP_STATUS } from '../../../utils/apiResponse'

export const config = {
  api: { externalResolver: true },
  maxDuration: 300,
}

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

