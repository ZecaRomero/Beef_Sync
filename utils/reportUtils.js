/**
 * UtilitÃ¡rios para geraÃ§Ã£o e envio de relatÃ³rios
 */

/**
 * Baixar boletim de gado
 */
export const downloadBoletimGado = async (period, animalsData, sendToAccounting = false, setLoading) => {
  try {
    setLoading(true)
    
    console.log('ðÅ¸â€�� Gerando boletim:', {
      periodo: period,
      sendToAccounting,
      // NÃ£o enviar animaisData para evitar limite de tamanho
      // A API buscarÃ¡ diretamente do banco
    })
    
    const response = await fetch('/api/contabilidade/boletim-gado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        period,
        // NÃ£o enviar animalsData - API buscarÃ¡ do banco
        sendToAccounting
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('â�Å’ Erro na resposta:', response.status, errorText)
      throw new Error(`Erro ao gerar boletim: ${response.status} - ${errorText}`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boletim-gado-contabilidade-${period.startDate}-${period.endDate}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    if (sendToAccounting) {
      alert('âÅ“â€¦ Sucesso! Boletim de Gado gerado e enviado para contabilidade!')
    } else {
      alert('âÅ“â€¦ Sucesso! Boletim de Gado baixado com sucesso!')
    }
  } catch (error) {
    console.error('â�Å’ Erro ao gerar boletim:', error)
    alert(`â�Å’ Erro: NÃ£o foi possÃ­vel gerar o boletim de gado. ${error.message}`)
  } finally {
    setLoading(false)
  }
}

/**
 * Enviar por email
 */
export const enviarPorEmail = async (period, animalsData, setLoading) => {
  try {
    setLoading(true)
    
    // Criar assunto e corpo do email
    const assunto = `Boletim de Gado - ${period.startDate} atÃ© ${period.endDate}`
    const corpo = `
OlÃ¡!

Segue em anexo o Boletim de Gado referente ao perÃ­odo de ${period.startDate} atÃ© ${period.endDate}.

ðÅ¸â€œÅ  RESUMO DO PERÃ�ODO:
ââ‚¬¢ Total de animais: ${animalsData.length}
ââ‚¬¢ PerÃ­odo: ${period.startDate} atÃ© ${period.endDate}
ââ‚¬¢ Data de geraÃ§Ã£o: ${new Date().toLocaleString('pt-BR')}

O arquivo Excel contÃ©m:
âÅ“â€¦ Boletim por RaÃ§a
âÅ“â€¦ Resumo Executivo  
âÅ“â€¦ Detalhes dos Animais

Este relatÃ³rio foi gerado automaticamente pelo sistema Beef-Sync.

Atenciosamente,
Sistema Beef-Sync
    `.trim()
    
    // Criar link mailto com Outlook
    const emailBody = encodeURIComponent(corpo)
    const emailSubject = encodeURIComponent(assunto)
    
    // Tentar abrir Outlook
    const outlookUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`
    window.open(outlookUrl, '_blank')
    
    alert('âÅ“â€¦ Outlook aberto! Cole o arquivo Excel como anexo e envie.')
    
  } catch (error) {
    console.error('Erro ao preparar email:', error)
    alert('â�Å’ Erro ao preparar email: ' + error.message)
  } finally {
    setLoading(false)
  }
}

/**
 * Enviar por WhatsApp
 */
export const enviarPorWhatsApp = async (period, animalsData, setLoading) => {
  try {
    setLoading(true)
    
    // Criar mensagem para WhatsApp
    const mensagem = `ðÅ¸�â€ž *BOLETIM DE GADO - BEEF-SYNC*

ðÅ¸â€œâ€¦ *PerÃ­odo:* ${period.startDate} atÃ© ${period.endDate}
ðÅ¸â€œÅ  *Total de Animais:* ${animalsData.length}

ðÅ¸â€œË† *Resumo por Sexo:*
${Object.entries(animalsData.reduce((acc, animal) => {
  const sexo = animal.sexo || 'NÃ£o informado'
  acc[sexo] = (acc[sexo] || 0) + 1
  return acc
}, {})).map(([sexo, qtd]) => `ââ‚¬¢ ${sexo}: ${qtd}`).join('\n')}

ðÅ¸â€œâ€¹ *Resumo por RaÃ§a:*
${Object.entries(animalsData.reduce((acc, animal) => {
  const raca = animal.raca || 'NÃ£o informado'
  acc[raca] = (acc[raca] || 0) + 1
  return acc
}, {})).map(([raca, qtd]) => `ââ‚¬¢ ${raca}: ${qtd}`).join('\n')}

ðÅ¸â€œÅ  *RelatÃ³rio Completo:*
O arquivo Excel com detalhes completos estÃ¡ sendo gerado...

â�° *Gerado em:* ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync - GestÃ£o de Rebanho_`
    
    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem)
    
    // Abrir WhatsApp Web
    const whatsappUrl = `https://web.whatsapp.com/send?text=${mensagemCodificada}`
    window.open(whatsappUrl, '_blank')
    
    alert('âÅ“â€¦ WhatsApp Web aberto! A mensagem foi preparada. Envie para o contato desejado.')
    
  } catch (error) {
    console.error('Erro ao preparar WhatsApp:', error)
    alert('â�Å’ Erro ao preparar WhatsApp: ' + error.message)
  } finally {
    setLoading(false)
  }
}

/**
 * Baixar notas fiscais
 */
export const downloadNotasFiscais = async (period, setLoading) => {
  try {
    setLoading(true)
    
    const response = await fetch('/api/contabilidade/notas-fiscais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })

    if (!response.ok) throw new Error('Erro ao gerar relatÃ³rio de NFs')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notas-fiscais-${period.startDate}-${period.endDate}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    alert('âÅ“â€¦ Sucesso! RelatÃ³rio de Notas Fiscais baixado com sucesso!')
  } catch (error) {
    console.error('Erro:', error)
    alert('â�Å’ Erro: NÃ£o foi possÃ­vel gerar o relatÃ³rio de notas fiscais')
  } finally {
    setLoading(false)
  }
}

/**
 * Enviar todos os relatÃ³rios
 */
export const sendAllReports = async (period, selectedRecipients, recipients, setLoading) => {
  if (selectedRecipients.length === 0) {
    alert('âÅ¡ ï¸� AtenÃ§Ã£o: Selecione pelo menos um destinatÃ¡rio')
    return
  }

  try {
    setLoading(true)
    
    const selectedRecipientsData = recipients.filter(r => 
      selectedRecipients.includes(r.id)
    )
    
    const response = await fetch('/api/contabilidade/enviar-relatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period,
        recipients: selectedRecipientsData
      })
    })

    if (!response.ok) throw new Error('Erro ao enviar relatÃ³rios')
    
    alert(`âÅ“â€¦ Sucesso! RelatÃ³rios enviados para ${selectedRecipientsData.length} destinatÃ¡rio(s)!`)
  } catch (error) {
    console.error('Erro:', error)
    alert('â�Å’ Erro: NÃ£o foi possÃ­vel enviar os relatÃ³rios')
  } finally {
    setLoading(false)
  }
}