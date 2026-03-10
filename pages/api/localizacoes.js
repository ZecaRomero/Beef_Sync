const { query } = require('../../lib/database')
const logger = require('../../utils/logger.cjs')
const { canDelete } = require('../../utils/permissions')
import LoteTracker from '../../utils/loteTracker'

export const config = { api: { externalResolver: true } }
export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await ensureLocalizacoesIndex()
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).json({ error: `Método ${method} não permitido` })
    }
  } catch (error) {
    logger.error('Erro na API de localizações:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    })
  }
}

async function ensureLocalizacoesIndex() {
  try {
    await query(`
      ALTER TABLE localizacoes_animais
      DROP CONSTRAINT IF EXISTS localizacoes_animais_animal_id_key
    `)
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_localizacoes_animais_animal_id_ativa
      ON localizacoes_animais (animal_id) WHERE data_saida IS NULL
    `)
  } catch (e) {
    logger.error('Falha ao garantir índice de localizações:', e)
  }
}

// GET - Buscar localizações
async function handleGet(req, res) {
  const { animal_id, piquete, data_inicio, data_fim, atual } = req.query

  try {
    let queryText = `
      SELECT 
        l.*,
        a.serie,
        a.rg,
        a.raca,
        a.sexo
      FROM localizacoes_animais l
      JOIN animais a ON l.animal_id = a.id
      WHERE a.situacao = 'Ativo'
        AND COALESCE(LOWER(a.raca), '') NOT LIKE '%receptora%'
    `
    const params = []
    const conditions = []

    // Filtrar por animal específico
    if (animal_id) {
      conditions.push(`l.animal_id = $${params.length + 1}`)
      params.push(animal_id)
    }

    // Filtrar por piquete (match exato para evitar PIQUETE 11 pegar 110, 111, etc.)
    if (piquete) {
      conditions.push(`LOWER(TRIM(l.piquete)) = LOWER(TRIM($${params.length + 1}))`)
      params.push(String(piquete).trim())
    }

    // Filtrar por período
    if (data_inicio) {
      conditions.push(`l.data_entrada >= $${params.length + 1}`)
      params.push(data_inicio)
    }

    if (data_fim) {
      conditions.push(`l.data_entrada <= $${params.length + 1}`)
      params.push(data_fim)
    }

    // Filtrar apenas localizações atuais (sem data de saída)
    if (atual === 'true') {
      conditions.push(`l.data_saida IS NULL`)
    }

    if (conditions.length > 0) {
      queryText += ` AND ${conditions.join(' AND ')}`
    }

    queryText += ` ORDER BY l.data_entrada DESC, l.created_at DESC`

    const result = await query(queryText, params)

    res.status(200).json({
      success: true,
      data: result.rows,
      total: result.rows.length
    })

  } catch (error) {
    logger.error('Erro ao buscar localizações:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar localizações',
      details: error.message 
    })
  }
}

// POST - Criar nova localização
async function handlePost(req, res) {
  const {
    animal_id,
    piquete,
    data_entrada,
    motivo_movimentacao,
    observacoes,
    usuario_responsavel
  } = req.body

  // Validações
  if (!animal_id || !piquete || !data_entrada) {
    return res.status(400).json({
      error: 'Campos obrigatórios: animal_id, piquete, data_entrada'
    })
  }

  try {
    // Verificar se o animal existe
    const animalResult = await query(
      'SELECT id, serie, rg FROM animais WHERE id = $1',
      [animal_id]
    )

    if (animalResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Animal não encontrado'
      })
    }

    // Verificar se já existe uma localização ativa para este animal
    const localizacaoAtiva = await query(`
      SELECT id, piquete FROM localizacoes_animais 
      WHERE animal_id = $1 AND data_saida IS NULL
      ORDER BY data_entrada DESC 
      LIMIT 1
    `, [animal_id])

    let result

    if (localizacaoAtiva.rows.length > 0) {
      // Se já existe uma localização ativa, atualizar ela em vez de criar nova
      const localizacaoId = localizacaoAtiva.rows[0].id
      const piquete_origem = localizacaoAtiva.rows[0].piquete
      
      // Se o piquete é o mesmo, não fazer nada
      if (piquete_origem === piquete) {
        return res.status(200).json({
          success: true,
          data: localizacaoAtiva.rows[0],
          message: 'Animal já está neste piquete'
        })
      }
      
      // Finalizar a localização atual
      await query(`
        UPDATE localizacoes_animais 
        SET data_saida = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [data_entrada, localizacaoId])
      
      // Criar nova localização
      result = await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, motivo_movimentacao, 
          observacoes, usuario_responsavel
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        animal_id,
        piquete,
        data_entrada,
        motivo_movimentacao || null,
        observacoes || null,
        usuario_responsavel || null
      ])
      
      // Registrar operação no sistema de lotes
      try {
        const animal = animalResult.rows[0]
        
        await LoteTracker.registrarLocalizacao({
          animal_id,
          animal_identificacao: `${animal.serie}-${animal.rg}`,
          piquete_origem,
          piquete_destino: piquete,
          motivo: motivo_movimentacao || 'Localização registrada',
          usuario: usuario_responsavel || 'Sistema',
          req
        })
      } catch (trackError) {
        logger.error('Erro ao registrar no sistema de lotes:', trackError)
      }
      
    } else {
      // Não existe localização ativa, criar nova
      result = await query(`
        INSERT INTO localizacoes_animais (
          animal_id, piquete, data_entrada, motivo_movimentacao, 
          observacoes, usuario_responsavel
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        animal_id,
        piquete,
        data_entrada,
        motivo_movimentacao || null,
        observacoes || null,
        usuario_responsavel || null
      ])
      
      // Registrar operação no sistema de lotes
      try {
        const animal = animalResult.rows[0]
        
        await LoteTracker.registrarLocalizacao({
          animal_id,
          animal_identificacao: `${animal.serie}-${animal.rg}`,
          piquete_origem: null,
          piquete_destino: piquete,
          motivo: motivo_movimentacao || 'Localização inicial',
          usuario: usuario_responsavel || 'Sistema',
          req
        })
      } catch (trackError) {
        logger.error('Erro ao registrar no sistema de lotes:', trackError)
      }
    }

    logger.info(`Nova localização criada para animal ${animalResult.rows[0].serie}${animalResult.rows[0].rg}`)

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Localização registrada com sucesso'
    })

  } catch (error) {
    logger.error('Erro ao criar localização:', error)
    
    // Se for erro de constraint UNIQUE, tentar remover a constraint e tentar novamente
    if (error.message && error.message.includes('localizacoes_animais_animal_id_key')) {
      try {
        logger.info('Tentando remover constraint UNIQUE problemática...')
        await query(`
          ALTER TABLE localizacoes_animais 
          DROP CONSTRAINT IF EXISTS localizacoes_animais_animal_id_key
        `)
        logger.info('Constraint removida, tente novamente')
        
        return res.status(409).json({ 
          error: 'Constraint UNIQUE foi removida. Por favor, tente novamente.',
          details: 'A constraint que impedia múltiplas localizações foi corrigida.',
          retry: true
        })
      } catch (dropError) {
        logger.error('Erro ao remover constraint:', dropError)
      }
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar localização',
      details: error.message 
    })
  }
}

// PUT - Atualizar localização
async function handlePut(req, res) {
  const { id } = req.query
  const {
    piquete,
    data_entrada,
    data_saida,
    motivo_movimentacao,
    observacoes,
    usuario_responsavel
  } = req.body

  if (!id) {
    return res.status(400).json({
      error: 'ID da localização é obrigatório'
    })
  }

  try {
    // Verificar se a localização existe
    const existingResult = await query(
      'SELECT * FROM localizacoes_animais WHERE id = $1',
      [id]
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Localização não encontrada'
      })
    }

    // Atualizar localização
    const result = await query(`
      UPDATE localizacoes_animais 
      SET 
        piquete = COALESCE($1, piquete),
        data_entrada = COALESCE($2, data_entrada),
        data_saida = $3,
        motivo_movimentacao = $4,
        observacoes = $5,
        usuario_responsavel = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      piquete,
      data_entrada,
      data_saida,
      motivo_movimentacao,
      observacoes,
      usuario_responsavel,
      id
    ])

    logger.info(`Localização ${id} atualizada`)

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Localização atualizada com sucesso'
    })

  } catch (error) {
    logger.error('Erro ao atualizar localização:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar localização',
      details: error.message 
    })
  }
}

// DELETE - Remover localização
async function handleDelete(req, res) {
  // Verificar permissão de exclusão
  if (!canDelete(req)) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Esta ação é permitida apenas para o desenvolvedor (acesso local).',
      permissionRequired: true
    })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({
      error: 'ID da localização é obrigatório'
    })
  }

  try {
    // Verificar se a localização existe
    const existingResult = await query(
      'SELECT * FROM localizacoes_animais WHERE id = $1',
      [id]
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Localização não encontrada'
      })
    }

    // Remover localização
    await query('DELETE FROM localizacoes_animais WHERE id = $1', [id])

    logger.info(`Localização ${id} removida`)

    res.status(200).json({
      success: true,
      message: 'Localização removida com sucesso'
    })

  } catch (error) {
    logger.error('Erro ao remover localização:', error)
    res.status(500).json({ 
      error: 'Erro ao remover localização',
      details: error.message 
    })
  }
}
