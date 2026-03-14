/**
 * Utilitários para geração e envio de relatórios
 */

/**
 * Baixar boletim de gado
 */
export const downloadBoletimGado = async (period, animalsData, sendToAccounting = false, setLoading) => {
  try {
    setLoading(true)
    
    console.log('🔍 Gerando boletim:', {
      periodo: period,
      sendToAccounting,
      // Não enviar animaisData para evitar limite de tamanho
      // A API buscará diretamente do banco
    })
    
    const response = await fetch('/api/contabilidade/boletim-gado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        period,
        // Não enviar animalsData - API buscará do banco
        sendToAccounting
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na resposta:', response.status, errorText)
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
      alert('✅ Sucesso! Boletim de Gado gerado e enviado para contabilidade!')
    } else {
      alert('✅ Sucesso! Boletim de Gado baixado com sucesso!')
    }
  } catch (error) {
    console.error('❌ Erro ao gerar boletim:', error)
    alert(`❌ Erro: Não foi possível gerar o boletim de gado. ${error.message}`)
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
    const assunto = `Boletim de Gado - ${period.startDate} até ${period.endDate}`
    const corpo = `
Olá!

Segue em anexo o Boletim de Gado referente ao período de ${period.startDate} até ${period.endDate}.

📊 RESUMO DO PERÍODO:
• Total de animais: ${animalsData.length}
• Período: ${period.startDate} até ${period.endDate}
• Data de geração: ${new Date().toLocaleString('pt-BR')}

O arquivo Excel contém:
✅ Boletim por Raça
✅ Resumo Executivo  
✅ Detalhes dos Animais

Este relatório foi gerado automaticamente pelo sistema Beef-Sync.

Atenciosamente,
Sistema Beef-Sync
    `.trim()
    
    // Criar link mailto com Outlook
    const emailBody = encodeURIComponent(corpo)
    const emailSubject = encodeURIComponent(assunto)
    
    // Tentar abrir Outlook
    const outlookUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`
    window.open(outlookUrl, '_blank')
    
    alert('✅ Outlook aberto! Cole o arquivo Excel como anexo e envie.')
    
  } catch (error) {
    console.error('Erro ao preparar email:', error)
    alert('❌ Erro ao preparar email: ' + error.message)
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
    const mensagem = `🐄 *BOLETIM DE GADO - BEEF-SYNC*

📅 *Período:* ${period.startDate} até ${period.endDate}
📊 *Total de Animais:* ${animalsData.length}

📈 *Resumo por Sexo:*
${Object.entries(animalsData.reduce((acc, animal) => {
  const sexo = animal.sexo || 'Não informado'
  acc[sexo] = (acc[sexo] || 0) + 1
  return acc
}, {})).map(([sexo, qtd]) => `• ${sexo}: ${qtd}`).join('\n')}

📋 *Resumo por Raça:*
${Object.entries(animalsData.reduce((acc, animal) => {
  const raca = animal.raca || 'Não informado'
  acc[raca] = (acc[raca] || 0) + 1
  return acc
}, {})).map(([raca, qtd]) => `• ${raca}: ${qtd}`).join('\n')}

📊 *Relatório Completo:*
O arquivo Excel com detalhes completos está sendo gerado...

⏰ *Gerado em:* ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync - Gestão de Rebanho_`
    
    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem)
    
    // Abrir WhatsApp Web
    const whatsappUrl = `https://web.whatsapp.com/send?text=${mensagemCodificada}`
    window.open(whatsappUrl, '_blank')
    
    alert('✅ WhatsApp Web aberto! A mensagem foi preparada. Envie para o contato desejado.')
    
  } catch (error) {
    console.error('Erro ao preparar WhatsApp:', error)
    alert('❌ Erro ao preparar WhatsApp: ' + error.message)
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

    if (!response.ok) throw new Error('Erro ao gerar relatório de NFs')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notas-fiscais-${period.startDate}-${period.endDate}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    alert('✅ Sucesso! Relatório de Notas Fiscais baixado com sucesso!')
  } catch (error) {
    console.error('Erro:', error)
    alert('❌ Erro: Não foi possível gerar o relatório de notas fiscais')
  } finally {
    setLoading(false)
  }
}

/**
 * Enviar todos os relatórios
 */
export const sendAllReports = async (period, selectedRecipients, recipients, setLoading) => {
  if (selectedRecipients.length === 0) {
    alert('⚠️ Atenção: Selecione pelo menos um destinatário')
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

    if (!response.ok) throw new Error('Erro ao enviar relatórios')
    
    alert(`✅ Sucesso! Relatórios enviados para ${selectedRecipientsData.length} destinatário(s)!`)
  } catch (error) {
    console.error('Erro:', error)
    alert('❌ Erro: Não foi possível enviar os relatórios')
  } finally {
    setLoading(false)
  }
}