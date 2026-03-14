import { Pool } from 'pg'
import { 
  sendSuccess, 
  sendValidationError, 
  sendMethodNotAllowed,
  asyncHandler, 
  HTTP_STATUS 
} from '../../../utils/apiResponse'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function bulkDeleteHandler(req, res) {
  if (req.method !== 'DELETE') {
    return sendMethodNotAllowed(res, ['DELETE'])
  }

  const { ids } = req.body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'IDs não fornecidos ou inválidos', {
      required: ['ids'],
      provided: { ids: !!ids }
    })
  }

  try {
    // Criar placeholders para a query
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',')
    
    const result = await pool.query(
      `DELETE FROM abastecimento_nitrogenio WHERE id IN (${placeholders}) RETURNING id`,
      ids
    )

    const deletedCount = result.rowCount
    const deletedIds = result.rows.map(row => row.id)

    console.log(`✅ ${deletedCount} abastecimento(s) de nitrogênio excluído(s)`)

    return sendSuccess(res, {
      deletedCount,
      deletedIds,
      requestedIds: ids
    }, `${deletedCount} abastecimento(s) excluído(s) com sucesso`)

  } catch (error) {
    console.error('Erro ao excluir abastecimentos:', error)
    throw error
  }
}

export default asyncHandler(bulkDeleteHandler)