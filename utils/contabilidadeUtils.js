// UtilitÃ¡rios para funcionalidades de contabilidade

export const downloadBoletimGado = async (period, animaisData, sendToAccounting = false, setLoading) => {
  try {
    setLoading(true)
    
    console.log('ðÅ¸â€�� Gerando boletim (API buscarÃ¡ animais do banco)...')
    
    const response = await fetch('/api/contabilidade/boletim-gado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period,
        // NÃ£o enviar animais - API buscarÃ¡ diretamente do banco para evitar limite de 1MB
        sendToAccounting
      })
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boletim-gado-${period.startDate}-${period.endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      if (sendToAccounting) {
        alert('âÅ“â€¦ Boletim enviado para contabilidade!')
      } else {
        alert('âÅ“â€¦ Boletim baixado com sucesso!')
      }
    } else {
      const errorText = await response.text()
      console.error('â�Å’ Erro na resposta:', response.status, errorText)
      alert(`â�Å’ Erro ao gerar boletim: ${response.status}`)
    }
  } catch (error) {
    console.error('â�Å’ Erro ao baixar boletim:', error)
    alert(`â�Å’ Erro ao gerar boletim: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const enviarPorEmail = async (period, animaisData, setLoading) => {
  try {
    setLoading(true)
    
    // Validar perÃ­odo
    if (!period?.startDate || !period?.endDate) {
      alert('âÅ¡ ï¸� Por favor, selecione um perÃ­odo vÃ¡lido')
      return
    }
    
    // Buscar resumo do boletim
    const periodParam = `${period.startDate},${period.endDate}`
    const resumoResponse = await fetch(`/api/contabilidade/resumo-boletins?period=${periodParam}`)
    
    let resumoText = ''
    if (resumoResponse.ok) {
      const resumos = await resumoResponse.json()
      const santAnna = resumos.santAnna || {}
      
      if (santAnna.total > 0) {
        resumoText = `
ðÅ¸â€œÅ  RESUMO:
ââ‚¬¢ Total: ${santAnna.total || 0} animais
ââ‚¬¢ FÃªmeas: ${santAnna.porSexo?.femeas || 0}
ââ‚¬¢ Machos: ${santAnna.porSexo?.machos || 0}

`
        
        // Adicionar detalhes por idade se houver
        const porEra = santAnna.porEra || {}
        const detalhesIdade = []
        
        if (porEra['femea_0-7'] > 0) detalhesIdade.push(`FÃªmeas 0-7m: ${porEra['femea_0-7']}`)
        if (porEra['femea_7-12'] > 0) detalhesIdade.push(`FÃªmeas 7-12m: ${porEra['femea_7-12']}`)
        if (porEra['femea_12-18'] > 0) detalhesIdade.push(`FÃªmeas 12-18m: ${porEra['femea_12-18']}`)
        if (porEra['femea_18-24'] > 0) detalhesIdade.push(`FÃªmeas 18-24m: ${porEra['femea_18-24']}`)
        if (porEra['femea_24+'] > 0) detalhesIdade.push(`FÃªmeas 24+m: ${porEra['femea_24+']}`)
        
        if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
        if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
        if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
        if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
        if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
        
        if (detalhesIdade.length > 0) {
          resumoText += `ðÅ¸â€œâ€¹ Por Idade:
${detalhesIdade.map(d => `ââ‚¬¢ ${d}`).join('\n')}

`
        }
      } else {
        resumoText = `
âÅ¡ ï¸� Nenhum animal encontrado para este perÃ­odo.

`
      }
    }
    
    // Criar assunto e corpo do email
    const assunto = encodeURIComponent(`Boletim de Gado - ${period.startDate} atÃ© ${period.endDate}`)
    const corpo = encodeURIComponent(`ðÅ¸�â€ž BOLETIM DE GADO - BEEF SYNC

ðÅ¸â€œâ€¦ PerÃ­odo: ${period.startDate} atÃ© ${period.endDate}

${resumoText}

ðÅ¸â€œÅ½ O relatÃ³rio completo estÃ¡ disponÃ­vel no sistema.
Acesse o sistema para visualizar o relatÃ³rio completo em Excel.

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`)
    
    // Abrir cliente de email padrÃ£o (Outlook, Gmail, etc.)
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`
    
    alert('âÅ“â€¦ Email aberto! Preencha o destinatÃ¡rio e envie.')
  } catch (error) {
    console.error('Erro ao enviar por email:', error)
    alert(`â�Å’ Erro ao preparar email: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const enviarPorWhatsApp = async (period, animaisData, setLoading) => {
  try {
    setLoading(true)
    
    // Validar perÃ­odo
    if (!period?.startDate || !period?.endDate) {
      alert('âÅ¡ ï¸� Por favor, selecione um perÃ­odo vÃ¡lido')
      return
    }
    
    // Buscar resumo do boletim
    const periodParam = `${period.startDate},${period.endDate}`
    const resumoResponse = await fetch(`/api/contabilidade/resumo-boletins?period=${periodParam}`)
    
    let resumoText = ''
    if (resumoResponse.ok) {
      const resumos = await resumoResponse.json()
      const santAnna = resumos.santAnna || {}
      
      if (santAnna.total > 0) {
        resumoText = `ðÅ¸â€œÅ  *Resumo:*
ââ‚¬¢ Total: ${santAnna.total || 0} animais
ââ‚¬¢ FÃªmeas: ${santAnna.porSexo?.femeas || 0}
ââ‚¬¢ Machos: ${santAnna.porSexo?.machos || 0}

`
        
        // Adicionar detalhes por idade se houver
        const porEra = santAnna.porEra || {}
        const detalhesIdade = []
        
        if (porEra['femea_0-7'] > 0) detalhesIdade.push(`FÃªmeas 0-7m: ${porEra['femea_0-7']}`)
        if (porEra['femea_7-12'] > 0) detalhesIdade.push(`FÃªmeas 7-12m: ${porEra['femea_7-12']}`)
        if (porEra['femea_12-18'] > 0) detalhesIdade.push(`FÃªmeas 12-18m: ${porEra['femea_12-18']}`)
        if (porEra['femea_18-24'] > 0) detalhesIdade.push(`FÃªmeas 18-24m: ${porEra['femea_18-24']}`)
        if (porEra['femea_24+'] > 0) detalhesIdade.push(`FÃªmeas 24+m: ${porEra['femea_24+']}`)
        
        if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
        if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
        if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
        if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
        if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
        
        if (detalhesIdade.length > 0) {
          resumoText += `ðÅ¸â€œâ€¹ *Por Idade:*
${detalhesIdade.map(d => `ââ‚¬¢ ${d}`).join('\n')}

`
        }
      } else {
        resumoText = `âÅ¡ ï¸� Nenhum animal encontrado para este perÃ­odo.

`
      }
    }
    
    // Criar mensagem para WhatsApp
    const mensagem = `ðÅ¸�â€ž *BOLETIM SANT ANNA - RANCHARIA - BEEF SYNC*

ðÅ¸â€œâ€¦ *PerÃ­odo:* ${period.startDate} atÃ© ${period.endDate}

${resumoText}ðÅ¸â€œÅ½ *Acesse o sistema para visualizar o relatÃ³rio completo em Excel.*

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`
    
    // Abrir WhatsApp Web
    const mensagemEncoded = encodeURIComponent(mensagem)
    window.open(`https://wa.me/?text=${mensagemEncoded}`, '_blank')
    
    alert('âÅ“â€¦ WhatsApp aberto! Selecione o contato e envie a mensagem.')
  } catch (error) {
    console.error('Erro ao enviar por WhatsApp:', error)
    alert(`â�Å’ Erro ao preparar WhatsApp: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const downloadNotasFiscais = async (period, setLoading) => {
  try {
    setLoading(true)
    
    // Garantir que o perÃ­odo estÃ¡ no formato correto
    const periodData = {
      startDate: period?.startDate || '',
      endDate: period?.endDate || ''
    }
    
    // Validar perÃ­odo
    if (!periodData.startDate || !periodData.endDate) {
      alert('âÅ¡ ï¸� Por favor, selecione um perÃ­odo vÃ¡lido')
      return
    }
    
    const response = await fetch('/api/contabilidade/notas-fiscais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: periodData })
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notas-fiscais-${periodData.startDate}-${periodData.endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      alert('âÅ“â€¦ Notas fiscais baixadas com sucesso!')
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || 'Erro ao gerar relatÃ³rio de notas fiscais'
      console.error('â�Å’ Erro na resposta:', response.status, errorMessage)
      alert(`â�Å’ ${errorMessage}`)
    }
  } catch (error) {
    console.error('Erro ao baixar notas fiscais:', error)
    alert(`â�Å’ Erro ao gerar relatÃ³rio de notas fiscais: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const sendAllReports = async (period, selectedRecipients, recipients, setLoading, selectedReports = ['boletim', 'notasFiscais', 'movimentacoes']) => {
  if (selectedRecipients.length === 0) {
    alert('âÅ¡ ï¸� Selecione pelo menos um destinatÃ¡rio')
    return
  }
  
  if (!selectedReports || selectedReports.length === 0) {
    alert('âÅ¡ ï¸� Selecione pelo menos um relatÃ³rio para enviar')
    return
  }
  
  try {
    setLoading(true)
    
    const selectedRecipientsData = recipients.filter(r => selectedRecipients.includes(r.id))
    
    console.log('ðÅ¸â€�� Enviando relatÃ³rios selecionados:', selectedReports)
    console.log('ðÅ¸â€˜¥ Para destinatÃ¡rios:', selectedRecipientsData.length)
    
    const response = await fetch('/api/contabilidade/enviar-relatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period,
        recipients: selectedRecipientsData,
        tipo: 'todos',
        reports: selectedReports // Lista de relatÃ³rios a serem enviados
        // NÃ£o enviar animais - API buscarÃ¡ diretamente do banco para evitar limite de 1MB
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      const reportNames = {
        boletim: 'Boletim de Gado',
        notasFiscais: 'Notas Fiscais',
        movimentacoes: 'MovimentaÃ§Ãµes',
        nascimentos: 'Nascimentos',
        mortes: 'Mortes'
      }
      const reportsList = selectedReports.map(r => reportNames[r] || r).join(', ')
      alert(`âÅ“â€¦ ${selectedReports.length} relatÃ³rio(s) enviado(s) para ${selectedRecipientsData.length} destinatÃ¡rio(s)!\n\nRelatÃ³rios: ${reportsList}`)
    } else {
      const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}` }))
      console.error('â�Å’ Erro na resposta:', response.status, errorData)
      alert(`â�Å’ Erro ao enviar relatÃ³rios: ${errorData.message || errorData.error || response.status}`)
    }
  } catch (error) {
    console.error('Erro ao enviar relatÃ³rios:', error)
    alert(`â�Å’ Erro ao enviar relatÃ³rios: ${error.message}`)
  } finally {
    setLoading(false)
  }
}