import { query } from '../../lib/database'
import { sendSuccess, sendError, sendValidationError, sendMethodNotAllowed, asyncHandler } from '../../utils/apiResponse'
import logger from '../../utils/logger'
import LoteTracker from '../../utils/loteTracker'

async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGet(req, res)
  } else if (req.method === 'POST') {
    return await handlePost(req, res)
  } else if (req.method === 'PUT') {
    return await handlePut(req, res)
  } else if (req.method === 'DELETE') {
    return await handleDelete(req, res)
  } else {
    return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
  }
}

async function handleGet(req, res) {
  try {
    const { search = '', ativo = 'true' } = req.query

    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(nome ILIKE $${paramIndex} OR descricao ILIKE $${paramIndex + 1})`)
      queryParams.push(`%${search}%`, `%${search}%`)
      paramIndex += 2
    }

    if (ativo !== 'all') {
      whereConditions.push(`ativo = $${paramIndex}`)
      queryParams.push(ativo === 'true')
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(`
      SELECT * FROM medicamentos
      ${whereClause}
      ORDER BY nome
    `, queryParams)

    return sendSuccess(res, {
      medicamentos: result.rows,
      total: result.rows.length
    }, 'Medicamentos recuperados com sucesso')

  } catch (error) {
    logger.error('Erro ao buscar medicamentos:', error)
    return sendError(res, 'Erro ao buscar medicamentos', 500)
  }
}

async function handlePost(req, res) {
  try {
    const { 
      nome, 
      preco, 
      unidade, 
      descricao, 
      principioAtivo,
      categoria,
      fabricante,
      lote,
      dataVencimento,
      quantidadeEstoque,
      quantidadeMinima,
      prescricaoVeterinaria,
      carenciaLeite,
      carenciaCarne,
      indicacoes,
      dosagem,
      viaAplicacao,
      observacoes,
      usuario = 'Sistema' 
    } = req.body

    // Validações
    if (!nome) {
      return sendValidationError(res, 'Nome do medicamento é obrigatório')
    }

    // Inserir medicamento
    const result = await query(`
      INSERT INTO medicamentos (
        nome, preco, unidade, descricao,
        principio_ativo, categoria, fabricante, lote,
        data_vencimento, quantidade_estoque, quantidade_minima,
        prescricao_veterinaria, carencia_leite, carencia_carne,
        indicacoes, dosagem, via_aplicacao, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      nome, 
      preco || null, 
      unidade || 'ml', 
      descricao || null,
      principioAtivo || null,
      categoria || null,
      fabricante || null,
      lote || null,
      dataVencimento || null,
      quantidadeEstoque || 0,
      quantidadeMinima || 0,
      prescricaoVeterinaria || false,
      carenciaLeite || null,
      carenciaCarne || null,
      indicacoes || null,
      dosagem || null,
      viaAplicacao || null,
      observacoes || null
    ])

    const novoMedicamento = result.rows[0]

    // Registrar no histórico de lançamentos
    try {
      await LoteTracker.registrarOperacao({
        tipo_operacao: 'CADASTRO_MEDICAMENTO',
        descricao: `Novo medicamento cadastrado: ${nome} - R$ ${preco} (${unidade})`,
        modulo: 'PROTOCOLOS',
        detalhes: {
          medicamento_id: novoMedicamento.id,
          nome,
          preco,
          unidade,
          descricao,
          timestamp: new Date().toISOString()
        },
        usuario,
        quantidade_registros: 1,
        status: 'concluido',
        req
      })
    } catch (trackError) {
      logger.error('Erro ao registrar no sistema de lotes:', trackError)
      // Não falhar a operação principal por erro no tracking
    }

    logger.info(`Novo medicamento cadastrado: ${nome}`)

    return sendSuccess(res, {
      medicamento: novoMedicamento
    }, 'Medicamento cadastrado com sucesso', 201)

  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return sendValidationError(res, 'Já existe um medicamento com este nome')
    }
    logger.error('Erro ao cadastrar medicamento:', error)
    return sendError(res, 'Erro ao cadastrar medicamento', 500)
  }
}

async function handlePut(req, res) {
  try {
    const { id } = req.query
    const { 
      nome, 
      preco, 
      unidade, 
      descricao, 
      ativo,
      principioAtivo,
      categoria,
      fabricante,
      lote,
      dataVencimento,
      quantidadeEstoque,
      quantidadeMinima,
      prescricaoVeterinaria,
      carenciaLeite,
      carenciaCarne,
      indicacoes,
      dosagem,
      viaAplicacao,
      observacoes,
      usuario = 'Sistema' 
    } = req.body

    if (!id) {
      return sendValidationError(res, 'ID do medicamento é obrigatório')
    }

    // Verificar se o medicamento existe
    const existingResult = await query('SELECT * FROM medicamentos WHERE id = $1', [id])
    if (existingResult.rows.length === 0) {
      return sendError(res, 'Medicamento não encontrado', 404)
    }

    const medicamentoAnterior = existingResult.rows[0]

    // Atualizar medicamento
    const result = await query(`
      UPDATE medicamentos 
      SET 
        nome = COALESCE($1, nome),
        preco = COALESCE($2, preco),
        unidade = COALESCE($3, unidade),
        descricao = COALESCE($4, descricao),
        ativo = COALESCE($5, ativo),
        principio_ativo = COALESCE($6, principio_ativo),
        categoria = COALESCE($7, categoria),
        fabricante = COALESCE($8, fabricante),
        lote = COALESCE($9, lote),
        data_vencimento = COALESCE($10, data_vencimento),
        quantidade_estoque = COALESCE($11, quantidade_estoque),
        quantidade_minima = COALESCE($12, quantidade_minima),
        prescricao_veterinaria = COALESCE($13, prescricao_veterinaria),
        carencia_leite = COALESCE($14, carencia_leite),
        carencia_carne = COALESCE($15, carencia_carne),
        indicacoes = COALESCE($16, indicacoes),
        dosagem = COALESCE($17, dosagem),
        via_aplicacao = COALESCE($18, via_aplicacao),
        observacoes = COALESCE($19, observacoes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `, [
      nome, 
      preco, 
      unidade, 
      descricao, 
      ativo,
      principioAtivo,
      categoria,
      fabricante,
      lote,
      dataVencimento,
      quantidadeEstoque,
      quantidadeMinima,
      prescricaoVeterinaria,
      carenciaLeite,
      carenciaCarne,
      indicacoes,
      dosagem,
      viaAplicacao,
      observacoes,
      id
    ])

    const medicamentoAtualizado = result.rows[0]

    // Registrar no histórico de lançamentos
    try {
      const alteracoes = []
      if (nome && nome !== medicamentoAnterior.nome) alteracoes.push(`nome: ${medicamentoAnterior.nome} → ${nome}`)
      if (preco && preco !== medicamentoAnterior.preco) alteracoes.push(`preço: R$ ${medicamentoAnterior.preco} → R$ ${preco}`)
      if (unidade && unidade !== medicamentoAnterior.unidade) alteracoes.push(`unidade: ${medicamentoAnterior.unidade} → ${unidade}`)
      if (ativo !== undefined && ativo !== medicamentoAnterior.ativo) alteracoes.push(`status: ${medicamentoAnterior.ativo ? 'ativo' : 'inativo'} → ${ativo ? 'ativo' : 'inativo'}`)

      if (alteracoes.length > 0) {
        await LoteTracker.registrarOperacao({
          tipo_operacao: 'ATUALIZACAO_MEDICAMENTO',
          descricao: `Medicamento ${medicamentoAnterior.nome} atualizado: ${alteracoes.join(', ')}`,
          modulo: 'PROTOCOLOS',
          detalhes: {
            medicamento_id: id,
            dados_anteriores: medicamentoAnterior,
            dados_novos: medicamentoAtualizado,
            alteracoes,
            timestamp: new Date().toISOString()
          },
          usuario,
          quantidade_registros: 1,
          status: 'concluido',
          req
        })
      }
    } catch (trackError) {
      logger.error('Erro ao registrar no sistema de lotes:', trackError)
    }

    logger.info(`Medicamento atualizado: ${medicamentoAtualizado.nome}`)

    return sendSuccess(res, {
      medicamento: medicamentoAtualizado
    }, 'Medicamento atualizado com sucesso')

  } catch (error) {
    if (error.code === '23505') {
      return sendValidationError(res, 'Já existe um medicamento com este nome')
    }
    logger.error('Erro ao atualizar medicamento:', error)
    return sendError(res, 'Erro ao atualizar medicamento', 500)
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query
    const { usuario = 'Sistema' } = req.body

    if (!id) {
      return sendValidationError(res, 'ID do medicamento é obrigatório')
    }

    // Verificar se o medicamento existe
    const existingResult = await query('SELECT * FROM medicamentos WHERE id = $1', [id])
    if (existingResult.rows.length === 0) {
      return sendError(res, 'Medicamento não encontrado', 404)
    }

    const medicamento = existingResult.rows[0]

    // Remover medicamento (soft delete - marcar como inativo)
    await query('UPDATE medicamentos SET ativo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id])

    // Registrar no histórico de lançamentos
    try {
      await LoteTracker.registrarOperacao({
        tipo_operacao: 'EXCLUSAO_MEDICAMENTO',
        descricao: `Medicamento removido: ${medicamento.nome} - R$ ${medicamento.preco} (${medicamento.unidade})`,
        modulo: 'PROTOCOLOS',
        detalhes: {
          medicamento_id: id,
          medicamento_removido: medicamento,
          timestamp: new Date().toISOString()
        },
        usuario,
        quantidade_registros: 1,
        status: 'concluido',
        req
      })
    } catch (trackError) {
      logger.error('Erro ao registrar no sistema de lotes:', trackError)
    }

    logger.info(`Medicamento removido: ${medicamento.nome}`)

    return sendSuccess(res, null, 'Medicamento removido com sucesso')

  } catch (error) {
    logger.error('Erro ao remover medicamento:', error)
    return sendError(res, 'Erro ao remover medicamento', 500)
  }
}

export default asyncHandler(handler)