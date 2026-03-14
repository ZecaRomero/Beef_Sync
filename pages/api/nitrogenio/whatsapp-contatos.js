import { query } from '../../../lib/database'
import { sendSuccess, sendError, sendValidationError, sendMethodNotAllowed, asyncHandler } from '../../../utils/apiResponse'

async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return sendMethodNotAllowed(res, req.method)
    }
  } catch (error) {
    console.error('Erro na API de contatos WhatsApp nitrogÃªnio:', error)
    return sendError(res, 'Erro interno do servidor', 500)
  }
}

async function handleGet(req, res) {
  try {
    const result = await query(`
      SELECT 
        id,
        nome,
        whatsapp,
        ativo,
        created_at,
        updated_at
      FROM nitrogenio_whatsapp_contatos
      ORDER BY nome ASC
    `)

    return sendSuccess(res, {
      contatos: result.rows,
      total: result.rows.length
    }, 'Contatos recuperados com sucesso')
  } catch (error) {
    console.error('Erro ao buscar contatos WhatsApp:', error)
    return sendError(res, 'Erro ao buscar contatos', 500)
  }
}

async function handlePost(req, res) {
  const { nome, whatsapp } = req.body

  // ValidaÃ§Ãµes
  if (!nome || !nome.trim()) {
    return sendValidationError(res, 'Nome Ã© obrigatÃ³rio')
  }

  if (!whatsapp || !whatsapp.trim()) {
    return sendValidationError(res, 'NÃºmero de WhatsApp Ã© obrigatÃ³rio')
  }

  // Limpar e validar nÃºmero de WhatsApp
  const whatsappLimpo = whatsapp.replace(/\D/g, '')
  
  if (whatsappLimpo.length < 10 || whatsappLimpo.length > 15) {
    return sendValidationError(res, 'NÃºmero de WhatsApp invÃ¡lido. Deve ter entre 10 e 15 dÃ­gitos')
  }

  try {
    // Verificar se jÃ¡ existe
    const existeResult = await query(`
      SELECT id FROM nitrogenio_whatsapp_contatos 
      WHERE whatsapp = $1
    `, [whatsappLimpo])

    if (existeResult.rows.length > 0) {
      return sendValidationError(res, 'Este nÃºmero de WhatsApp jÃ¡ estÃ¡ cadastrado')
    }

    // Inserir novo contato
    const result = await query(`
      INSERT INTO nitrogenio_whatsapp_contatos (nome, whatsapp, ativo)
      VALUES ($1, $2, true)
      RETURNING *
    `, [nome.trim(), whatsappLimpo])

    console.log(`âÅ“â€¦ Novo contato WhatsApp cadastrado: ${nome} - ${whatsappLimpo}`)

    return sendSuccess(res, {
      contato: result.rows[0]
    }, 'Contato cadastrado com sucesso', 201)
  } catch (error) {
    console.error('Erro ao cadastrar contato:', error)
    return sendError(res, 'Erro ao cadastrar contato', 500)
  }
}

async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return sendValidationError(res, 'ID do contato Ã© obrigatÃ³rio')
  }

  try {
    // Verificar se existe
    const existeResult = await query(`
      SELECT id, nome FROM nitrogenio_whatsapp_contatos WHERE id = $1
    `, [id])

    if (existeResult.rows.length === 0) {
      return sendError(res, 'Contato nÃ£o encontrado', 404)
    }

    // Remover contato
    await query(`
      DELETE FROM nitrogenio_whatsapp_contatos WHERE id = $1
    `, [id])

    console.log(`âÅ“â€¦ Contato WhatsApp removido: ID ${id}`)

    return sendSuccess(res, null, 'Contato removido com sucesso')
  } catch (error) {
    console.error('Erro ao remover contato:', error)
    return sendError(res, 'Erro ao remover contato', 500)
  }
}

export default asyncHandler(handler)

