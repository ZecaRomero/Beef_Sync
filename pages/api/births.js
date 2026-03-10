import { query } from '../../lib/database'
import { logger } from '../../utils/logger'
import { broadcast } from '../../lib/sseClients'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendMethodNotAllowed, 
  asyncHandler, 
  HTTP_STATUS 
} from '../../utils/apiResponse'
import { withLoteTracking, LOTE_CONFIGS } from '../../utils/loteMiddleware'

async function birthsHandler(req, res) {
  if (req.method === 'GET') {
    // Buscar todos os nascimentos
    const { touro, sexo, status, mes, ano } = req.query
    let queryText = 'SELECT * FROM nascimentos WHERE 1=1'
    const params = []
    let paramCount = 0

    if (touro) {
      paramCount++
      queryText += ` AND touro ILIKE $${paramCount}`
      params.push(`%${touro}%`)
    }

    if (sexo) {
      paramCount++
      queryText += ` AND sexo = $${paramCount}`
      params.push(sexo)
    }

    if (status) {
      paramCount++
      queryText += ` AND status = $${paramCount}`
      params.push(status)
    }

    if (mes || ano) {
      // Filtrar por mês/ano no campo nascimento ou data
      const filterValue = mes || ano
      paramCount++
      queryText += ` AND (nascimento LIKE $${paramCount} OR data LIKE $${paramCount})`
      params.push(`%${filterValue}%`)
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, params)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Converter para o formato esperado pelo frontend
    const formattedRows = result.rows.map(row => {
      const dataNasc = row.data_nascimento ? new Date(row.data_nascimento) : null
      const dataNascLimpa = dataNasc ? new Date(dataNasc.getFullYear(), dataNasc.getMonth(), dataNasc.getDate()) : null
      // Se data_nascimento é FUTURA = parto previsto (receptora prenha, ainda não pariu)
      const status = (dataNascLimpa && dataNascLimpa > hoje)
        ? 'parto_previsto'
        : (row.status || 'nascido')
      return {
        id: row.id,
        gestacao_id: row.gestacao_id,
        receptora: row.serie ? `${row.serie} ${row.rg}` : '',
        doador: '',
        rg: row.serie + ' ' + row.rg,
        prevParto: row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '',
        nascimento: row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '',
        tatuagem: '',
        cc: '',
        ps1: '',
        ps2: '',
        sexo: row.sexo === 'M' ? 'M' : 'F',
        status,
        touro: row.touro || '',
        data: row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '',
        observacao: row.observacoes || '',
        tipoCobertura: '',
        custoDNA: row.custo_nascimento || 0,
        descarte: false,
        morte: ''
      }
    })
    
    return sendSuccess(res, formattedRows, `${result.rows.length} nascimentos encontrados`, HTTP_STATUS.OK, {
      count: result.rows.length,
      filters: { touro, sexo, status, mes, ano }
    })

  } else if (req.method === 'POST') {
    // Criar novo nascimento
    const {
      receptora,
      doador,
      rg,
      prevParto,
      nascimento,
      tatuagem,
      cc,
      ps1,
      ps2,
      sexo,
      status,
      touro,
      data,
      observacao,
      tipoCobertura,
      custoDNA,
      descarte,
      morte
    } = req.body

    const queryText = `
      INSERT INTO nascimentos (
        receptora, doador, rg, prev_parto, nascimento, tatuagem,
        cc, ps1, ps2, sexo, status, touro, data, observacao,
        tipo_cobertura, custo_dna, descarte, morte
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `

    const params = [
      receptora || '',
      doador || '',
      rg || '',
      prevParto || '',
      nascimento || '',
      tatuagem || '',
      cc || '',
      ps1 || '',
      ps2 || '',
      sexo || '',
      status || 'gestante',
      touro || '',
      data || '',
      observacao || '',
      tipoCobertura || '',
      custoDNA || 0,
      descarte || false,
      morte || ''
    ]

    const result = await query(queryText, params)
    
    broadcast('birth.created', { animalId: result.rows[0]?.mae_id })
    return sendSuccess(res, result.rows[0], 'Nascimento criado com sucesso', HTTP_STATUS.CREATED)

  } else if (req.method === 'DELETE' && req.query.ids) {
    // Exclusão múltipla
    const ids = JSON.parse(req.query.ids)
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendValidationError(res, 'IDs inválidos', {
        required: ['ids'],
        provided: { ids: req.query.ids }
      })
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ')
    const queryText = `DELETE FROM nascimentos WHERE id IN (${placeholders}) RETURNING id`
    
    const result = await query(queryText, ids)
    
    return sendSuccess(res, {
      deletedCount: result.rows.length,
      deletedIds: result.rows.map(row => row.id)
    }, `${result.rows.length} nascimentos excluídos com sucesso`, HTTP_STATUS.OK)

  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  }
}

// Determinar configuração de lote baseado no método
function getBirthLoteConfig(req) {
  switch (req.method) {
    case 'POST':
      return LOTE_CONFIGS.REGISTRO_NASCIMENTO
    case 'DELETE':
      return LOTE_CONFIGS.EXCLUSAO_NASCIMENTO
    default:
      return null
  }
}

export const config = { api: { externalResolver: true } }
export default asyncHandler(withLoteTracking(birthsHandler, getBirthLoteConfig))

