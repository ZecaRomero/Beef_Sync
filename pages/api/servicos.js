import { query } from '../../lib/database'
import { logger } from '../../utils/logger'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendConflict, 
  sendNotFound,
  sendMethodNotAllowed, 
  sendNotImplemented,
  asyncHandler, 
  HTTP_STATUS 
} from '../../utils/apiResponse'

export default asyncHandler(async function handler(req, res) {
  if (req.method === 'GET') {
    // Garantir que a tabela existe
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS tipos_servicos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(200) NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          valor_padrao DECIMAL(12,2) NOT NULL DEFAULT 0,
          aplicavel_macho BOOLEAN DEFAULT true,
          aplicavel_femea BOOLEAN DEFAULT true,
          descricao TEXT,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (createErr) {
      logger.warn('Tabela tipos_servicos:', createErr.message)
    }

    // Buscar todos os serviços
    const { categoria, ativo, aplicavel } = req.query
    let queryText = 'SELECT * FROM tipos_servicos WHERE 1=1'
    const params = []
    let paramCount = 0

    if (categoria) {
      paramCount++
      queryText += ` AND categoria = $${paramCount}`
      params.push(categoria)
    }

    if (ativo !== undefined) {
      paramCount++
      queryText += ` AND ativo = $${paramCount}`
      params.push(ativo === 'true')
    }

    if (aplicavel === 'macho') {
      queryText += ' AND aplicavel_macho = true'
    } else if (aplicavel === 'femea') {
      queryText += ' AND aplicavel_femea = true'
    }

    queryText += ' ORDER BY categoria, nome'

    const result = await query(queryText, params)
    
    return sendSuccess(res, result.rows || [], `${result.rows?.length || 0} serviços encontrados`, HTTP_STATUS.OK, {
      count: result.rows?.length || 0,
      filters: { categoria, ativo, aplicavel }
    })

  } else if (req.method === 'POST') {
    // Criar novo serviço
    const {
      nome,
      categoria,
      valor_padrao,
      aplicavel_macho,
      aplicavel_femea,
      descricao,
      ativo
    } = req.body

    if (!nome || !categoria || valor_padrao === undefined) {
      return sendValidationError(res, 'Dados obrigatórios não fornecidos', {
        required: ['nome', 'categoria', 'valor_padrao'],
        provided: { 
          nome: !!nome, 
          categoria: !!categoria, 
          valor_padrao: valor_padrao !== undefined 
        }
      })
    }

    const queryText = `
      INSERT INTO tipos_servicos (
        nome, categoria, valor_padrao, aplicavel_macho, 
        aplicavel_femea, descricao, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const params = [
      nome,
      categoria,
      parseFloat(valor_padrao),
      aplicavel_macho !== false,
      aplicavel_femea !== false,
      descricao || '',
      ativo !== false
    ]

    try {
      const result = await query(queryText, params)
      
      return sendSuccess(res, result.rows[0], 'Serviço criado com sucesso', HTTP_STATUS.CREATED)
      
    } catch (error) {
      // Tratar erros específicos do banco de dados
      if (error.code === '23505') {
        return sendConflict(res, 'Serviço já existe', {
          nome,
          categoria
        })
      } else if (error.code === '23502') {
        return sendValidationError(res, 'Dados obrigatórios não fornecidos', {
          field: error.column,
          constraint: 'NOT NULL'
        })
      }
      
      throw error // Re-throw para ser capturado pelo asyncHandler
    }

  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST'])
  }
})
