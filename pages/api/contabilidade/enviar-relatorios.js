import { generateAllReportsBuffer } from '../../../utils/reportBufferGenerator'
import { sendEmail, generateEmailContent } from '../../../utils/emailService'
import { sendWhatsApp, sendWhatsAppMedia, generateWhatsAppMessage } from '../../../utils/whatsappService'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, recipients, tipo, reports } = req.body

    console.log('📨 Recebendo requisição de envio:', { tipo, periodo: period, temRecipients: !!recipients, reports })

    if (!period || !period.startDate || !period.endDate) {
      return res.status(400).json({ message: 'Período é obrigatório' })
    }

    // Para envio individual (email/whatsapp), não precisa de recipients
    // Para envio em lote, precisa de recipients
    if (tipo === 'todos' && (!recipients || !Array.isArray(recipients) || recipients.length === 0)) {
      return res.status(400).json({ message: 'Destinatários são obrigatórios' })
    }

    // Para envio individual (email/whatsapp), apenas retornar sucesso
    // O frontend já abre o cliente de email/WhatsApp
    if (tipo === 'whatsapp' || tipo === 'email') {
      return res.status(200).json({
        success: true,
        message: tipo === 'whatsapp' ? 'WhatsApp preparado com sucesso' : 'Email preparado com sucesso',
        tipo,
        period
      })
    }

    // Para envio em lote, processar recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Destinatários são obrigatórios para envio em lote' })
    }

    // Determinar quais relatórios gerar
    const requestedReports = reports && Array.isArray(reports) && reports.length > 0 
      ? reports 
      : ['boletim', 'notasFiscais', 'movimentacoes'] // Padrão: principais
    
    console.log('📊 Gerando relatórios selecionados:', requestedReports)
    
    // Construir URL base a partir da requisição atual
    const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http')
    const host = req.headers.host || `localhost:${process.env.PORT || 3020}`
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
    
    // Gerar apenas os relatórios solicitados
    const { 
      generateBoletimBuffer, 
      generateNotasFiscaisBuffer, 
      generateMovimentacoesBuffer,
      generateNascimentosBuffer,
      generateMortesBuffer
    } = await import('../../../utils/reportBufferGenerator')
    
    const reportsData = {}
    
    if (requestedReports.includes('boletim')) {
      console.log('📊 Gerando boletim...')
      reportsData.boletim = {
        buffer: await generateBoletimBuffer(period, baseUrl),
        filename: `boletim-gado-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
    if (requestedReports.includes('notasFiscais')) {
      console.log('📋 Gerando notas fiscais...')
      reportsData.notasFiscais = {
        buffer: await generateNotasFiscaisBuffer(period, baseUrl),
        filename: `notas-fiscais-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
    if (requestedReports.includes('movimentacoes')) {
      console.log('📈 Gerando movimentações...')
      reportsData.movimentacoes = {
        buffer: await generateMovimentacoesBuffer(period, baseUrl),
        filename: `movimentacoes-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
    if (requestedReports.includes('nascimentos')) {
      console.log('👶 Gerando nascimentos...')
      reportsData.nascimentos = {
        buffer: await generateNascimentosBuffer(period, baseUrl),
        filename: `nascimentos-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
    if (requestedReports.includes('mortes')) {
      console.log('💀 Gerando mortes...')
      reportsData.mortes = {
        buffer: await generateMortesBuffer(period, baseUrl),
        filename: `mortes-${period.startDate}-${period.endDate}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
    
    const reportTypes = requestedReports
    const reportNames = {
      boletim: 'Boletim de Gado',
      notasFiscais: 'Notas Fiscais',
      movimentacoes: 'Movimentações',
      nascimentos: 'Nascimentos',
      mortes: 'Mortes'
    }

    // Preparar anexos para email (apenas os relatórios gerados)
    const emailAttachments = []
    if (reportsData.boletim) {
      emailAttachments.push({
        filename: reportsData.boletim.filename,
        content: reportsData.boletim.buffer,
        contentType: reportsData.boletim.contentType
      })
    }
    if (reportsData.notasFiscais) {
      emailAttachments.push({
        filename: reportsData.notasFiscais.filename,
        content: reportsData.notasFiscais.buffer,
        contentType: reportsData.notasFiscais.contentType
      })
    }
    if (reportsData.movimentacoes) {
      emailAttachments.push({
        filename: reportsData.movimentacoes.filename,
        content: reportsData.movimentacoes.buffer,
        contentType: reportsData.movimentacoes.contentType
      })
    }
    if (reportsData.nascimentos) {
      emailAttachments.push({
        filename: reportsData.nascimentos.filename,
        content: reportsData.nascimentos.buffer,
        contentType: reportsData.nascimentos.contentType
      })
    }
    if (reportsData.mortes) {
      emailAttachments.push({
        filename: reportsData.mortes.filename,
        content: reportsData.mortes.buffer,
        contentType: reportsData.mortes.contentType
      })
    }

    // Enviar para cada destinatário
    const sendPromises = recipients.map(async (recipient) => {
      const results = {
        recipient: recipient.name,
        email: null,
        whatsapp: null,
        errors: []
      }

      // Enviar por email se tiver email
      if (recipient.email) {
        try {
          const emailSubject = `Relatórios Contábeis - ${period.startDate} até ${period.endDate}`
          const emailContent = generateEmailContent(recipient, period, reportTypes.map(r => reportNames[r]))
          
          const emailResult = await sendEmail(recipient, emailSubject, emailContent, emailAttachments)
          results.email = { success: true, messageId: emailResult.messageId }
          console.log(`✅ Email enviado para ${recipient.email}`)
        } catch (error) {
          console.error(`❌ Erro ao enviar email para ${recipient.email}:`, error.message)
          const errorMsg = error.message.includes('não configurado') 
            ? 'Serviço de email não configurado. Configure SMTP no .env'
            : error.message
          results.email = { success: false, error: errorMsg }
          results.errors.push(`Email: ${errorMsg}`)
        }
      }

      // Enviar por WhatsApp se tiver WhatsApp
      if (recipient.whatsapp) {
        try {
          const whatsappMessage = generateWhatsAppMessage(recipient, period, reportTypes.map(r => reportNames[r]))
          
          // Enviar mensagem de texto primeiro
          await sendWhatsApp(recipient, whatsappMessage)
          
          // Tentar enviar os arquivos (depende da API configurada)
          // Evolution API suporta envio de arquivos, Twilio requer URL pública
          try {
            // Enviar cada relatório gerado como documento
            if (reportsData.boletim) {
              await sendWhatsAppMedia(recipient, reportsData.boletim.buffer, reportsData.boletim.filename, `📊 ${reportNames.boletim}`)
            }
            if (reportsData.notasFiscais) {
              await sendWhatsAppMedia(recipient, reportsData.notasFiscais.buffer, reportsData.notasFiscais.filename, `📋 ${reportNames.notasFiscais}`)
            }
            if (reportsData.movimentacoes) {
              await sendWhatsAppMedia(recipient, reportsData.movimentacoes.buffer, reportsData.movimentacoes.filename, `📈 ${reportNames.movimentacoes}`)
            }
            if (reportsData.nascimentos) {
              await sendWhatsAppMedia(recipient, reportsData.nascimentos.buffer, reportsData.nascimentos.filename, `👶 ${reportNames.nascimentos}`)
            }
            if (reportsData.mortes) {
              await sendWhatsAppMedia(recipient, reportsData.mortes.buffer, reportsData.mortes.filename, `💀 ${reportNames.mortes}`)
            }
          } catch (mediaError) {
            console.warn(`⚠️ Não foi possível enviar arquivos via WhatsApp para ${recipient.whatsapp}:`, mediaError.message)
            // Continuar mesmo se não conseguir enviar arquivos - a mensagem de texto já foi enviada
          }
          
          results.whatsapp = { success: true }
          console.log(`✅ WhatsApp enviado para ${recipient.whatsapp}`)
        } catch (error) {
          console.error(`❌ Erro ao enviar WhatsApp para ${recipient.whatsapp}:`, error.message)
          const errorMsg = error.message.includes('não configurado') || error.message.includes('não instalado')
            ? 'Serviço de WhatsApp não configurado. Configure Twilio ou Evolution API no .env'
            : error.message
          results.whatsapp = { success: false, error: errorMsg }
          results.errors.push(`WhatsApp: ${errorMsg}`)
        }
      }

      // Se não tiver nem email nem WhatsApp
      if (!recipient.email && !recipient.whatsapp) {
        results.errors.push('Destinatário não possui email nem WhatsApp configurado')
      }

      // Determinar status final
      if (results.errors.length === 0) {
        results.status = 'success'
      } else if ((results.email && results.email.success) || (results.whatsapp && results.whatsapp.success)) {
        results.status = 'partial' // Pelo menos um método funcionou
      } else {
        results.status = 'fail' // Nenhum método funcionou
      }
      
      results.sentAt = new Date().toISOString()

      return results
    })

    const results = await Promise.all(sendPromises)

    // Contar sucessos e falhas
    const successCount = results.filter(r => r.status === 'success').length
    const partialCount = results.filter(r => r.status === 'partial').length
    const failCount = results.filter(r => r.status === 'fail').length

    // Registrar histórico de envio
    const envioLog = {
      id: Date.now(),
      period,
      recipients: recipients.map(r => ({
        name: r.name,
        email: r.email,
        whatsapp: r.whatsapp
      })),
      reports: reportTypes.map(r => reportNames[r]),
      sentAt: new Date().toISOString(),
      status: failCount === 0 ? (partialCount > 0 ? 'partial' : 'success') : 'partial',
      results
    }

    // Determinar mensagem de resposta
    let message = 'Relatórios enviados com sucesso'
    if (partialCount > 0) {
      message = `Relatórios enviados parcialmente. ${successCount} sucesso(s), ${partialCount} parcial(is)`
    }
    if (failCount > 0) {
      message = `Erro ao enviar alguns relatórios. ${successCount} sucesso(s), ${failCount} falha(s)`
    }

    res.status(200).json({
      success: failCount === 0,
      message,
      sentTo: recipients.length,
      successCount,
      partialCount,
      failCount,
      details: results,
      log: envioLog
    })

  } catch (error) {
    console.error('❌ Erro ao enviar relatórios:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ 
      message: 'Erro ao enviar relatórios',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
