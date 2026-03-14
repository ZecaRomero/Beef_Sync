// Utilitários para funcionalidades de contabilidade

export const downloadBoletimGado = async (period, animaisData, sendToAccounting = false, setLoading) => {
  try {
    setLoading(true)
    
    console.log('🔍 Gerando boletim (API buscará animais do banco)...')
    
    const response = await fetch('/api/contabilidade/boletim-gado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period,
        // Não enviar animais - API buscará diretamente do banco para evitar limite de 1MB
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
        alert('✅ Boletim enviado para contabilidade!')
      } else {
        alert('✅ Boletim baixado com sucesso!')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ Erro na resposta:', response.status, errorText)
      alert(`❌ Erro ao gerar boletim: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Erro ao baixar boletim:', error)
    alert(`❌ Erro ao gerar boletim: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const enviarPorEmail = async (period, animaisData, setLoading) => {
  try {
    setLoading(true)
    
    // Validar período
    if (!period?.startDate || !period?.endDate) {
      alert('⚠️ Por favor, selecione um período válido')
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
📊 RESUMO:
• Total: ${santAnna.total || 0} animais
• Fêmeas: ${santAnna.porSexo?.femeas || 0}
• Machos: ${santAnna.porSexo?.machos || 0}

`
        
        // Adicionar detalhes por idade se houver
        const porEra = santAnna.porEra || {}
        const detalhesIdade = []
        
        if (porEra['femea_0-7'] > 0) detalhesIdade.push(`Fêmeas 0-7m: ${porEra['femea_0-7']}`)
        if (porEra['femea_7-12'] > 0) detalhesIdade.push(`Fêmeas 7-12m: ${porEra['femea_7-12']}`)
        if (porEra['femea_12-18'] > 0) detalhesIdade.push(`Fêmeas 12-18m: ${porEra['femea_12-18']}`)
        if (porEra['femea_18-24'] > 0) detalhesIdade.push(`Fêmeas 18-24m: ${porEra['femea_18-24']}`)
        if (porEra['femea_24+'] > 0) detalhesIdade.push(`Fêmeas 24+m: ${porEra['femea_24+']}`)
        
        if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
        if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
        if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
        if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
        if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
        
        if (detalhesIdade.length > 0) {
          resumoText += `📋 Por Idade:
${detalhesIdade.map(d => `• ${d}`).join('\n')}

`
        }
      } else {
        resumoText = `
⚠️ Nenhum animal encontrado para este período.

`
      }
    }
    
    // Criar assunto e corpo do email
    const assunto = encodeURIComponent(`Boletim de Gado - ${period.startDate} até ${period.endDate}`)
    const corpo = encodeURIComponent(`🐄 BOLETIM DE GADO - BEEF SYNC

📅 Período: ${period.startDate} até ${period.endDate}

${resumoText}

📎 O relatório completo está disponível no sistema.
Acesse o sistema para visualizar o relatório completo em Excel.

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`)
    
    // Abrir cliente de email padrão (Outlook, Gmail, etc.)
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`
    
    alert('✅ Email aberto! Preencha o destinatário e envie.')
  } catch (error) {
    console.error('Erro ao enviar por email:', error)
    alert(`❌ Erro ao preparar email: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const enviarPorWhatsApp = async (period, animaisData, setLoading) => {
  try {
    setLoading(true)
    
    // Validar período
    if (!period?.startDate || !period?.endDate) {
      alert('⚠️ Por favor, selecione um período válido')
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
        resumoText = `📊 *Resumo:*
• Total: ${santAnna.total || 0} animais
• Fêmeas: ${santAnna.porSexo?.femeas || 0}
• Machos: ${santAnna.porSexo?.machos || 0}

`
        
        // Adicionar detalhes por idade se houver
        const porEra = santAnna.porEra || {}
        const detalhesIdade = []
        
        if (porEra['femea_0-7'] > 0) detalhesIdade.push(`Fêmeas 0-7m: ${porEra['femea_0-7']}`)
        if (porEra['femea_7-12'] > 0) detalhesIdade.push(`Fêmeas 7-12m: ${porEra['femea_7-12']}`)
        if (porEra['femea_12-18'] > 0) detalhesIdade.push(`Fêmeas 12-18m: ${porEra['femea_12-18']}`)
        if (porEra['femea_18-24'] > 0) detalhesIdade.push(`Fêmeas 18-24m: ${porEra['femea_18-24']}`)
        if (porEra['femea_24+'] > 0) detalhesIdade.push(`Fêmeas 24+m: ${porEra['femea_24+']}`)
        
        if (porEra['macho_0-7'] > 0) detalhesIdade.push(`Machos 0-7m: ${porEra['macho_0-7']}`)
        if (porEra['macho_7-15'] > 0) detalhesIdade.push(`Machos 7-15m: ${porEra['macho_7-15']}`)
        if (porEra['macho_15-18'] > 0) detalhesIdade.push(`Machos 15-18m: ${porEra['macho_15-18']}`)
        if (porEra['macho_18-22'] > 0) detalhesIdade.push(`Machos 18-22m: ${porEra['macho_18-22']}`)
        if (porEra['macho_36+'] > 0) detalhesIdade.push(`Machos 36+m: ${porEra['macho_36+']}`)
        
        if (detalhesIdade.length > 0) {
          resumoText += `📋 *Por Idade:*
${detalhesIdade.map(d => `• ${d}`).join('\n')}

`
        }
      } else {
        resumoText = `⚠️ Nenhum animal encontrado para este período.

`
      }
    }
    
    // Criar mensagem para WhatsApp
    const mensagem = `🐄 *BOLETIM SANT ANNA - RANCHARIA - BEEF SYNC*

📅 *Período:* ${period.startDate} até ${period.endDate}

${resumoText}📎 *Acesse o sistema para visualizar o relatório completo em Excel.*

Gerado em: ${new Date().toLocaleString('pt-BR')}

_Sistema Beef-Sync_`
    
    // Abrir WhatsApp Web
    const mensagemEncoded = encodeURIComponent(mensagem)
    window.open(`https://wa.me/?text=${mensagemEncoded}`, '_blank')
    
    alert('✅ WhatsApp aberto! Selecione o contato e envie a mensagem.')
  } catch (error) {
    console.error('Erro ao enviar por WhatsApp:', error)
    alert(`❌ Erro ao preparar WhatsApp: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const downloadNotasFiscais = async (period, setLoading) => {
  try {
    setLoading(true)
    
    // Garantir que o período está no formato correto
    const periodData = {
      startDate: period?.startDate || '',
      endDate: period?.endDate || ''
    }
    
    // Validar período
    if (!periodData.startDate || !periodData.endDate) {
      alert('⚠️ Por favor, selecione um período válido')
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
      
      alert('✅ Notas fiscais baixadas com sucesso!')
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || 'Erro ao gerar relatório de notas fiscais'
      console.error('❌ Erro na resposta:', response.status, errorMessage)
      alert(`❌ ${errorMessage}`)
    }
  } catch (error) {
    console.error('Erro ao baixar notas fiscais:', error)
    alert(`❌ Erro ao gerar relatório de notas fiscais: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

export const sendAllReports = async (period, selectedRecipients, recipients, setLoading, selectedReports = ['boletim', 'notasFiscais', 'movimentacoes']) => {
  if (selectedRecipients.length === 0) {
    alert('⚠️ Selecione pelo menos um destinatário')
    return
  }
  
  if (!selectedReports || selectedReports.length === 0) {
    alert('⚠️ Selecione pelo menos um relatório para enviar')
    return
  }
  
  try {
    setLoading(true)
    
    const selectedRecipientsData = recipients.filter(r => selectedRecipients.includes(r.id))
    
    console.log('🔍 Enviando relatórios selecionados:', selectedReports)
    console.log('👥 Para destinatários:', selectedRecipientsData.length)
    
    const response = await fetch('/api/contabilidade/enviar-relatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period,
        recipients: selectedRecipientsData,
        tipo: 'todos',
        reports: selectedReports // Lista de relatórios a serem enviados
        // Não enviar animais - API buscará diretamente do banco para evitar limite de 1MB
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      const reportNames = {
        boletim: 'Boletim de Gado',
        notasFiscais: 'Notas Fiscais',
        movimentacoes: 'Movimentações',
        nascimentos: 'Nascimentos',
        mortes: 'Mortes'
      }
      const reportsList = selectedReports.map(r => reportNames[r] || r).join(', ')
      alert(`✅ ${selectedReports.length} relatório(s) enviado(s) para ${selectedRecipientsData.length} destinatário(s)!\n\nRelatórios: ${reportsList}`)
    } else {
      const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}` }))
      console.error('❌ Erro na resposta:', response.status, errorData)
      alert(`❌ Erro ao enviar relatórios: ${errorData.message || errorData.error || response.status}`)
    }
  } catch (error) {
    console.error('Erro ao enviar relatórios:', error)
    alert(`❌ Erro ao enviar relatórios: ${error.message}`)
  } finally {
    setLoading(false)
  }
}