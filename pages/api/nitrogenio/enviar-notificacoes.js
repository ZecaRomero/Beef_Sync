import { query } from '../../../lib/database'
import { sendSuccess, sendError, asyncHandler } from '../../../utils/apiResponse'
import { sendWhatsApp } from '../../../utils/whatsappService'
import { ensureNitrogenioTables } from '../../../utils/nitrogenioSchema'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    await ensureNitrogenioTables()

    // Buscar abastecimentos que precisam de notificação (2 dias antes)
    const abastecimentosResult = await query(`
      SELECT 
        id,
        data_abastecimento,
        quantidade_litros,
        motorista,
        proximo_abastecimento,
        notificacao_enviada_2dias
      FROM abastecimento_nitrogenio 
      WHERE 
        proximo_abastecimento IS NOT NULL
        AND notificacao_enviada_2dias = false
        AND proximo_abastecimento - CURRENT_DATE = 2
      ORDER BY proximo_abastecimento ASC
    `)

    const abastecimentos = abastecimentosResult.rows

    if (abastecimentos.length === 0) {
      return sendSuccess(res, {
        enviados: 0,
        mensagem: 'Nenhum abastecimento precisa de notificação no momento'
      }, 'Verificação concluída')
    }

    // Buscar contatos WhatsApp ativos
    const contatosResult = await query(`
      SELECT id, nome, whatsapp
      FROM nitrogenio_whatsapp_contatos
      WHERE ativo = true
    `)

    const contatos = contatosResult.rows

    if (contatos.length === 0) {
      return sendSuccess(res, {
        enviados: 0,
        mensagem: 'Nenhum contato WhatsApp cadastrado para receber notificações'
      }, 'Nenhum contato encontrado')
    }

    // Enviar notificações para cada abastecimento
    const resultados = {
      sucessos: [],
      erros: [],
      total_enviados: 0
    }

    for (const abastecimento of abastecimentos) {
      const diasRestantes = Math.ceil(
        (new Date(abastecimento.proximo_abastecimento) - new Date()) / (1000 * 60 * 60 * 24)
      )

      const mensagem = `🔔 *LEMBRETE DE ABASTECIMENTO DE NITROGÊNIO*

⚠️ Faltam apenas *${diasRestantes} dias* para o próximo abastecimento!

📅 *Último abastecimento:*
• Data: ${new Date(abastecimento.data_abastecimento).toLocaleDateString('pt-BR')}
• Quantidade: ${abastecimento.quantidade_litros}L
• Motorista: ${abastecimento.motorista}

📅 *Próximo abastecimento:*
${new Date(abastecimento.proximo_abastecimento).toLocaleDateString('pt-BR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Por favor, programe o abastecimento para evitar falta de nitrogênio.

_Sistema Beef-Sync_`

      // Enviar para todos os contatos cadastrados
      for (const contato of contatos) {
        try {
          await sendWhatsApp(
            { name: contato.nome, whatsapp: contato.whatsapp },
            mensagem
          )

          resultados.sucessos.push({
            abastecimento_id: abastecimento.id,
            contato_id: contato.id,
            contato_nome: contato.nome,
            contato_whatsapp: contato.whatsapp
          })
          resultados.total_enviados++

          console.log(`✅ Notificação WhatsApp enviada para ${contato.nome} (${contato.whatsapp}) - Abastecimento ID ${abastecimento.id}`)
        } catch (error) {
          resultados.erros.push({
            abastecimento_id: abastecimento.id,
            contato_id: contato.id,
            contato_nome: contato.nome,
            erro: error.message
          })

          console.error(`❌ Erro ao enviar WhatsApp para ${contato.nome}:`, error)
        }
      }

      // Marcar como notificação enviada
      await query(`
        UPDATE abastecimento_nitrogenio 
        SET notificacao_enviada_2dias = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [abastecimento.id])
    }

    return sendSuccess(res, {
      abastecimentos_processados: abastecimentos.length,
      contatos_notificados: contatos.length,
      resultados
    }, `${resultados.total_enviados} notificação(ões) enviada(s) com sucesso`)
  } catch (error) {
    console.error('Erro ao enviar notificações WhatsApp:', error)
    return sendError(res, `Erro ao enviar notificações: ${error.message}`, 500)
  }
}

export default asyncHandler(handler)

