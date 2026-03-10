import { query } from '../../lib/database'
import logger from '../../utils/logger'
import { 
  sendSuccess, 
  sendValidationError, 
  sendNotFound, 
  sendMethodNotAllowed,
  asyncHandler
} from '../../utils/apiResponse'

async function transferenciasHandler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      await handleGet(req, res)
      break
    case 'POST':
      await handlePost(req, res)
      break
    case 'DELETE':
      await handleDelete(req, res)
      break
    default:
      return sendMethodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  }
}

async function handleGet(req, res) {
  const { id, doadora, touro, receptora_nome, data_te, central } = req.query

  try {
    if (id) {
      const result = await query(
        'SELECT * FROM transferencias_embrioes WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return sendNotFound(res, 'Transferência não encontrada')
      }

      return sendSuccess(res, result.rows[0])
    }

    let queryText = 'SELECT * FROM transferencias_embrioes'
    const queryParams = []
    const conditions = []

    // Add support for precise ID-based searches
    if (req.query.touro_id) {
        conditions.push(`touro_id = $${queryParams.length + 1}`)
        queryParams.push(req.query.touro_id)
    }

    if (req.query.doadora_id) {
        conditions.push(`doadora_id = $${queryParams.length + 1}`)
        queryParams.push(req.query.doadora_id)
    }

    if (req.query.receptora_id) {
        conditions.push(`receptora_id = $${queryParams.length + 1}`)
        queryParams.push(req.query.receptora_id)
    }

    if (doadora) {
        conditions.push(`doadora_nome ILIKE $${queryParams.length + 1}`)
        queryParams.push(`%${doadora}%`)
    }

    if (touro) {
        conditions.push(`touro ILIKE $${queryParams.length + 1}`)
        queryParams.push(`%${touro}%`)
    }

    if (receptora_nome) {
        // Busca exata ou parcial, dependendo da necessidade. Aqui usando ILIKE para flexibilidade
        conditions.push(`receptora_nome ILIKE $${queryParams.length + 1}`)
        queryParams.push(`%${receptora_nome}%`)
    }

    if (data_te) {
        // Pode ser necessário cast para DATE se data_te vier como string
        conditions.push(`data_te::date = $${queryParams.length + 1}::date`)
        queryParams.push(data_te)
    }

    if (central) {
        conditions.push(`central ILIKE $${queryParams.length + 1}`)
        queryParams.push(`%${central}%`)
    }

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ')
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, queryParams)
    
    return sendSuccess(res, result.rows)

  } catch (error) {
    logger.error('Erro ao buscar transferências:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    })
  }
}

async function handlePost(req, res) {
  const { 
    numero_te, 
    data_te, 
    local_te, 
    tecnico_responsavel, 
    observacoes, 
    status = 'Realizada',
    receptora_nome,
    doadora_nome,
    qualidade_embriao,
    central,
    touro,
    sexo_prenhez
  } = req.body

  if (!numero_te || !data_te || !tecnico_responsavel) {
    return sendValidationError(res, 'Número TE, data e técnico responsável são obrigatórios')
  }

  try {
    // Descobrir colunas existentes para evitar erro em bancos sem colunas opcionais
    const colsRes = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'transferencias_embrioes'`
    )
    const existing = colsRes.rows.map(r => r.column_name)
    
    const baseCols = ['numero_te', 'data_te', 'local_te', 'tecnico_responsavel', 'observacoes', 'status']
    const optCols = []
    const values = [numero_te, data_te, local_te || null, tecnico_responsavel, observacoes || null, status || 'Realizada']
    
    if (existing.includes('receptora_nome')) {
      optCols.push('receptora_nome')
      values.push(receptora_nome || null)
    }
    if (existing.includes('doadora_nome')) {
      optCols.push('doadora_nome')
      values.push(doadora_nome || null)
    }
    if (existing.includes('qualidade_embriao')) {
      optCols.push('qualidade_embriao')
      values.push(qualidade_embriao || null)
    }
    if (existing.includes('central')) {
      optCols.push('central')
      values.push(central || null)
    }
    if (existing.includes('touro')) {
      optCols.push('touro')
      values.push(touro || null)
    }
    if (existing.includes('sexo_prenhez')) {
      optCols.push('sexo_prenhez')
      values.push(sexo_prenhez || null)
    }
    if (existing.includes('data_fiv') && req.body.data_fiv) {
      optCols.push('data_fiv')
      values.push(req.body.data_fiv)
    }
    
    const allCols = [...baseCols, ...optCols, 'created_at', 'updated_at']
    const placeholders = allCols.map((_, idx) => idx < allCols.length - 2 ? `$${idx + 1}` : 'CURRENT_TIMESTAMP')
    placeholders[placeholders.length - 1] = 'CURRENT_TIMESTAMP'
    
    const insertSQL = `
      INSERT INTO transferencias_embrioes (${allCols.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *`
    
    const result = await query(insertSQL, values)

    logger.info(`Transferência criada: ${numero_te}`)
    return sendSuccess(res, result.rows[0], 'Transferência criada com sucesso', 201)

  } catch (error) {
    logger.error('Erro ao criar transferência:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar transferência',
      error: error.message 
    })
  }
}

async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return sendValidationError(res, 'ID da transferência é obrigatório')
  }

  try {
    // Check for multiple IDs (comma separated)
    if (id.includes(',')) {
      const ids = id.split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i))
      
      if (ids.length === 0) {
        return sendValidationError(res, 'IDs inválidos')
      }

      const result = await query(
        'DELETE FROM transferencias_embrioes WHERE id = ANY($1::int[]) RETURNING *',
        [ids]
      )

      logger.info(`Transferências excluídas: IDs ${ids.join(', ')}`)
      return sendSuccess(res, result.rows, `${result.rows.length} transferências excluídas com sucesso`)
    }

    // Single ID delete
    const result = await query(
      'DELETE FROM transferencias_embrioes WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Transferência não encontrada')
    }

    logger.info(`Transferência excluída: ID ${id}`)
    return sendSuccess(res, result.rows[0], 'Transferência excluída com sucesso')

  } catch (error) {
    logger.error('Erro ao excluir transferência:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir transferência',
      error: error.message 
    })
  }
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(transferenciasHandler)
