import { query } from '../../../lib/database'
import { withLoteTracking, LOTE_CONFIGS } from '../../../utils/loteMiddleware'
import { ensureNitrogenioTables } from '../../../utils/nitrogenioSchema'

async function handleGet(req, res) {
  try {
    // Obter parâmetros de paginação
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    // Buscar total de registros e total de litros
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(quantidade_litros), 0) as total_litros
      FROM abastecimento_nitrogenio
    `)
    const totalItems = parseInt(statsResult.rows[0].total) || 0
    const totalLitros = parseFloat(statsResult.rows[0].total_litros) || 0

    // Buscar registros paginados
    const result = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        valor_unitario,
        valor_total,
        motorista,
        observacoes,
        proximo_abastecimento,
        notificacao_enviada,
        created_at,
        updated_at
      FROM abastecimento_nitrogenio 
      ORDER BY data_abastecimento DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    // Retornar estrutura esperada pelo frontend
    return res.status(200).json({
      data: result.rows,
      meta: {
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit)
        },
        stats: {
          totalLitros
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar abastecimentos:', error)
    return res.status(500).json({ 
      error: 'Erro ao buscar abastecimentos',
      message: error.message,
      details: error.message 
    })
  }
}

async function handlePost(req, res) {
  const { data_abastecimento, quantidade_litros, valor_unitario, valor_total, motorista, observacoes } = req.body
  
  console.log('Recebendo POST /api/nitrogenio:', { 
    data_abastecimento, 
    quantidade_litros, 
    valor_unitario, 
    valor_total, 
    motorista, 
    observacoes 
  })

  // Validação dos dados
  if (!data_abastecimento || !quantidade_litros || !motorista) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: data_abastecimento, quantidade_litros, motorista' 
    })
  }

  // Validar quantidade
  const quantidade = parseFloat(quantidade_litros)
  if (isNaN(quantidade) || quantidade <= 0) {
    return res.status(400).json({ 
      error: 'Quantidade deve ser um número positivo' 
    })
  }

  // Validar data
  const dataAbastecimento = new Date(data_abastecimento)
  if (isNaN(dataAbastecimento.getTime())) {
    return res.status(400).json({ 
      error: 'Data de abastecimento inválida' 
    })
  }

  try {
    const result = await query(`
      INSERT INTO abastecimento_nitrogenio 
      (data_abastecimento, quantidade_litros, valor_unitario, valor_total, motorista, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [data_abastecimento, quantidade, valor_unitario || null, valor_total || null, motorista.trim(), observacoes || null])

    // Registrar no boletim contábil se houver valor total
    if (valor_total && parseFloat(valor_total) > 0) {
      try {
        const periodo = new Date(data_abastecimento).toISOString().slice(0, 7) // YYYY-MM
        
        // Obter ou criar boletim do período
        let boletimResult = await query(`
          SELECT id FROM boletim_contabil WHERE periodo = $1
        `, [periodo])
        
        let boletimId
        if (boletimResult.rows.length === 0) {
          // Criar novo boletim
          const newBoletim = await query(`
            INSERT INTO boletim_contabil (periodo, status, resumo)
            VALUES ($1, 'aberto', '{}')
            RETURNING id
          `, [periodo])
          boletimId = newBoletim.rows[0].id
        } else {
          boletimId = boletimResult.rows[0].id
        }
        
        // Registrar movimentação contábil
        await query(`
          INSERT INTO movimentacoes_contabeis 
          (boletim_id, tipo, subtipo, data_movimento, valor, descricao, observacoes, dados_extras)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          boletimId,
          'custo',
          'nitrogenio',
          data_abastecimento,
          valor_total,
          `Abastecimento de nitrogênio - ${quantidade}L`,
          observacoes || null,
          JSON.stringify({
            quantidade_litros: quantidade,
            valor_unitario: valor_unitario,
            motorista: motorista.trim(),
            abastecimento_id: result.rows[0].id
          })
        ])
        
        console.log(`Movimentação contábil registrada para abastecimento ID ${result.rows[0].id}`)
      } catch (contabilError) {
        console.error('Erro ao registrar no boletim contábil:', contabilError)
        // Não falha a operação principal, apenas loga o erro
      }
    }

    return res.status(201).json({
      message: 'Abastecimento registrado com sucesso',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Erro ao criar abastecimento:', error)
    return res.status(500).json({ 
      error: 'Erro ao registrar abastecimento',
      message: error.message,
      details: error.message 
    })
  }
}

async function handler(req, res) {
  const { method } = req

  try {
    await ensureNitrogenioTables()

    switch (method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Erro na API de nitrogênio:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    })
  }
}

export default withLoteTracking(handler, (req) => {
  return req.method === 'POST' ? LOTE_CONFIGS.ABASTECIMENTO_NITROGENIO : null
})
