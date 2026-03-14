const { query } = require('../lib/database')

/**
 * Script para configurar verificação automática de notificações de nitrogênio
 * Este script deve ser executado periodicamente (diariamente) via cron job ou task scheduler
 */

async function checkNitrogenNotifications() {
  console.log('🔍 Verificando necessidade de notificações de nitrogênio...')
  
  try {
    // Buscar abastecimentos que precisam de notificação
    const result = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento,
        (proximo_abastecimento - INTERVAL '5 days') as data_notificacao,
        (proximo_abastecimento - CURRENT_DATE) as dias_restantes
      FROM abastecimento_nitrogenio 
      WHERE 
        notificacao_enviada = false 
        AND (proximo_abastecimento - INTERVAL '5 days') <= CURRENT_DATE
      ORDER BY proximo_abastecimento ASC
    `)

    if (result.rows.length === 0) {
      console.log('✅ Nenhuma notificação de nitrogênio necessária no momento.')
      return { success: true, notifications: 0 }
    }

    console.log(`📋 Encontrados ${result.rows.length} abastecimentos que precisam de notificação.`)

    let notificationsCreated = 0

    for (const abastecimento of result.rows) {
      const diasRestantes = Math.ceil(
        (new Date(abastecimento.proximo_abastecimento) - new Date()) / (1000 * 60 * 60 * 24)
      )

      console.log(`📅 Processando abastecimento ID ${abastecimento.id} - ${diasRestantes} dias restantes`)

      // Criar notificação
      const notificationResult = await query(`
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
          dias_restantes: diasRestantes,
          tipo_notificacao: 'lembrete_abastecimento'
        })
      ])

      // Marcar como notificação enviada
      await query(`
        UPDATE abastecimento_nitrogenio 
        SET notificacao_enviada = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [abastecimento.id])

      notificationsCreated++
      console.log(`✅ Notificação criada para abastecimento ID ${abastecimento.id}`)
    }

    console.log(`🎉 ${notificationsCreated} notificações de nitrogênio criadas com sucesso!`)
    
    return { 
      success: true, 
      notifications: notificationsCreated,
      details: result.rows.map(r => ({
        id: r.id,
        data_abastecimento: r.data_abastecimento,
        proximo_abastecimento: r.proximo_abastecimento,
        dias_restantes: Math.ceil((new Date(r.proximo_abastecimento) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    }

  } catch (error) {
    console.error('❌ Erro ao verificar notificações de nitrogênio:', error)
    return { success: false, error: error.message }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkNitrogenNotifications()
    .then(result => {
      console.log('📊 Resultado:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { checkNitrogenNotifications }