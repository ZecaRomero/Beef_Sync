const NFService = require('../../../services/NFService')
import { sendSuccess, sendValidationError, sendMethodNotAllowed, asyncHandler } from '../../../utils/apiResponse'

/**
 * API para gerenciar Naturezas de Operação
 * GET /api/nf/naturezas - Listar naturezas
 * POST /api/nf/naturezas - Criar nova natureza
 * PUT /api/nf/naturezas?id=X - Atualizar natureza
 * DELETE /api/nf/naturezas?id=X - Deletar natureza (soft delete)
 */
async function handler(req, res) {
  const { method, query } = req

  switch (method) {
    case 'GET': {
      const { id, tipo, q, limit, offset } = query
      
      if (id) {
        const natureza = await NFService.getNaturezaOperacaoById(id)
        if (!natureza) {
          return sendValidationError(res, 'Natureza não encontrada')
        }
        return sendSuccess(res, natureza)
      }
      
      const naturezas = await NFService.getNaturezasOperacao(tipo, q, limit, offset)
      return sendSuccess(res, naturezas)
    }

    case 'POST': {
      const { nome, tipo, descricao } = req.body

      if (!nome || !tipo) {
        return sendValidationError(res, 'Nome e tipo são obrigatórios')
      }

      const novaNatureza = await NFService.createNaturezaOperacao({ nome, tipo, descricao })
      return sendSuccess(res, novaNatureza, 'Natureza de operação criada com sucesso', 201)
    }

    case 'PUT': {
      const { id } = query
      const { nome, tipo, descricao, ativo } = req.body

      if (!id) {
        return sendValidationError(res, 'ID da natureza é obrigatório')
      }

      if (!nome || !tipo) {
        return sendValidationError(res, 'Nome e tipo são obrigatórios')
      }

      const naturezaAtualizada = await NFService.updateNaturezaOperacao(id, { nome, tipo, descricao, ativo })
      return sendSuccess(res, naturezaAtualizada, 'Natureza de operação atualizada com sucesso')
    }

    case 'DELETE': {
      const { id } = query

      if (!id) {
        return sendValidationError(res, 'ID da natureza é obrigatório')
      }

      await NFService.deleteNaturezaOperacao(id)
      return sendSuccess(res, null, 'Natureza de operação excluída com sucesso')
    }

    default:
      return sendMethodNotAllowed(res, 'GET, POST, PUT, DELETE')
  }
}

export default asyncHandler(handler)
