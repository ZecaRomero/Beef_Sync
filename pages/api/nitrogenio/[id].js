import { Pool } from 'pg'
import { 
  sendSuccess, 
  sendValidationError, 
  sendMethodNotAllowed, 
  sendNotFound,
  asyncHandler, 
  HTTP_STATUS 
} from '../../../utils/apiResponse'
import { withLoteTracking, LOTE_CONFIGS } from '../../../utils/loteMiddleware'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function nitrogenioByIdHandler(req, res) {
  const { id } = req.query

  if (!id) {
    return sendValidationError(res, 'ID do abastecimento é obrigatório')
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          data_abastecimento,
          quantidade_litros,
          valor_unitario,
          valor_total,
          motorista,
          observacoes,
          proximo_abastecimento,
          created_at
        FROM abastecimento_nitrogenio 
        WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return sendNotFound(res, 'Abastecimento não encontrado')
      }

      return sendSuccess(res, result.rows[0], 'Abastecimento recuperado com sucesso')
    } catch (error) {
      console.error('Erro ao buscar abastecimento:', error)
      throw error
    }
  } else if (req.method === 'PUT') {
    const { 
      data_abastecimento, 
      quantidade_litros, 
      valor_unitario, 
      valor_total, 
      motorista, 
      observacoes,
      proximo_abastecimento
    } = req.body

    // Validar dados obrigatórios
    if (!data_abastecimento || !quantidade_litros || !motorista) {
      return sendValidationError(res, 'Dados obrigatórios não fornecidos', {
        required: ['data_abastecimento', 'quantidade_litros', 'motorista'],
        provided: { 
          data_abastecimento: !!data_abastecimento, 
          quantidade_litros: !!quantidade_litros, 
          motorista: !!motorista 
        }
      })
    }

    try {
      // Verificar se o abastecimento existe
      const checkResult = await pool.query(
        'SELECT id FROM abastecimento_nitrogenio WHERE id = $1',
        [id]
      )

      if (checkResult.rows.length === 0) {
        return sendNotFound(res, 'Abastecimento não encontrado')
      }

      // Atualizar abastecimento
      const result = await pool.query(
        `UPDATE abastecimento_nitrogenio 
        SET 
          data_abastecimento = $1,
          quantidade_litros = $2,
          valor_unitario = $3,
          valor_total = $4,
          motorista = $5,
          observacoes = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
        [
          data_abastecimento,
          parseFloat(quantidade_litros),
          valor_unitario ? parseFloat(valor_unitario) : null,
          valor_total ? parseFloat(valor_total) : null,
          motorista.trim(),
          observacoes || null,
          id
        ]
      )

      const abastecimentoAtualizado = result.rows[0]

      console.log(`✅ Abastecimento de nitrogênio atualizado: ID ${id} - ${quantidade_litros}L`)

      return sendSuccess(res, abastecimentoAtualizado, 'Abastecimento atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar abastecimento:', error)
      throw error
    }
  } else if (req.method === 'DELETE') {
    try {
      // Verificar se o abastecimento existe antes de deletar
      const checkResult = await pool.query(
        'SELECT id, motorista, quantidade_litros FROM abastecimento_nitrogenio WHERE id = $1',
        [id]
      )

      if (checkResult.rows.length === 0) {
        return sendNotFound(res, 'Abastecimento não encontrado')
      }

      const abastecimento = checkResult.rows[0]

      // Deletar abastecimento
      const result = await pool.query(
        'DELETE FROM abastecimento_nitrogenio WHERE id = $1 RETURNING id',
        [id]
      )

      console.log(`✅ Abastecimento de nitrogênio excluído: ID ${id} - ${abastecimento.quantidade_litros}L - Motorista: ${abastecimento.motorista}`)

      return sendSuccess(res, { id: result.rows[0].id }, 'Abastecimento excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir abastecimento:', error)
      throw error
    }
  } else {
    return sendMethodNotAllowed(res, ['GET', 'PUT', 'DELETE'])
  }
}

export default asyncHandler(withLoteTracking(nitrogenioByIdHandler, LOTE_CONFIGS.ABASTECIMENTO_NITROGENIO))
