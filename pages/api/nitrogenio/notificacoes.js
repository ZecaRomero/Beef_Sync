import { query } from '../../../lib/database'

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        return await handlePost(req, res)
      case 'GET':
        return await handleGet(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} not allowed` })
    }
  } catch (error) {
    console.error('Erro na API de notificações de nitrogênio:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    })
  }
}

async function handleGet(req, res) {
  try {
    // Buscar abastecimentos que precisam de notificação (5 dias antes de 1 mês)
    const result = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento,
        notificacao_enviada,
        (proximo_abastecimento - INTERVAL '5 days') as data_notificacao
      FROM abastecimento_nitrogenio 
      WHERE 
        notificacao_enviada = false 
        AND (proximo_abastecimento - INTERVAL '5 days') <= CURRENT_DATE
      ORDER BY proximo_abastecimento ASC
    `)

    return res.status(200).json({
      abastecimentos_para_notificar: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Erro ao buscar abastecimentos para notificação:', error)
    return res.status(500).json({ 
      error: 'Erro ao buscar abastecimentos para notificação',
      details: error.message 
    })
  }
}

async function handlePost(req, res) {
  try {
    // Buscar abastecimentos que precisam de notificação
    const abastecimentosResult = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento
      FROM abastecimento_nitrogenio 
      WHERE 
        notificacao_enviada = false 
        AND (proximo_abastecimento - INTERVAL '5 days') <= CURRENT_DATE
      ORDER BY proximo_abastecimento ASC
    `)

    const abastecimentos = abastecimentosResult.rows
    const notificacoesCriadas = []

    for (const abastecimento of abastecimentos) {
      const diasRestantes = Math.ceil(
        (new Date(abastecimento.proximo_abastecimento) - new Date()) / (1000 * 60 * 60 * 24)
      )

      // Criar notificação no sistema
      const notificacaoResult = await query(`
        INSERT INTO notificacoes 
        (tipo, titulo, mensagem, prioridade, dados_extras)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        'nitrogenio',
        'Lembrete de Abastecimento de Nitrogênio',
        `É hora de abastecer o nitrogênio! Último abastecimento foi em ${new Date(abastecimento.data_abastecimento).toLocaleDateString('pt-BR')} com ${abastecimento.quantidade_litros}L pelo motorista ${abastecimento.motorista}. ${diasRestantes <= 0 ? 'Prazo vencido!' : `Restam ${diasRestantes} dias.`}`,
        diasRestantes <= 0 ? 'high' : 'medium',
        JSON.stringify({
          abastecimento_id: abastecimento.id,
          data_ultimo_abastecimento: abastecimento.data_abastecimento,
          quantidade_anterior: abastecimento.quantidade_litros,
          motorista_anterior: abastecimento.motorista,
          proximo_abastecimento: abastecimento.proximo_abastecimento,
          dias_restantes: diasRestantes
        })
      ])

      // Marcar como notificação enviada
      await query(`
        UPDATE abastecimento_nitrogenio 
        SET notificacao_enviada = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [abastecimento.id])

      notificacoesCriadas.push({
        abastecimento: abastecimento,
        notificacao: notificacaoResult.rows[0],
        dias_restantes: diasRestantes
      })
    }

    return res.status(200).json({
      message: `${notificacoesCriadas.length} notificações de nitrogênio criadas com sucesso`,
      notificacoes: notificacoesCriadas,
      total: notificacoesCriadas.length
    })
  } catch (error) {
    console.error('Erro ao gerar notificações de nitrogênio:', error)
    return res.status(500).json({ 
      error: 'Erro ao gerar notificações de nitrogênio',
      details: error.message 
    })
  }
}