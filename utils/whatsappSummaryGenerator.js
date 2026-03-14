// Gerador de resumo para WhatsApp com dados completos

// Formata datas em DD/MM/AAAA (pt-BR)
const formatBR = (dateStr) => {
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export async function generateWhatsAppSummary(relatorios, period) {
  let summaryText = `📧 Relatórios completos enviados por email.\n\n`
  summaryText += `📊 *RESUMO DE RELATÓRIOS BEEF-SYNC*\n`
  summaryText += `📅 Período: ${formatBR(period.startDate)} a ${formatBR(period.endDate)}\n`
  summaryText += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  try {
    // NF Entrada e Saída - COM VALORES
    if (relatorios.includes('nf_entrada_saida')) {
      const res = await fetch(`/api/notas-fiscais?startDate=${period.startDate}&endDate=${period.endDate}`)
      if (res.ok) {
        const data = await res.json()
        const nfs = data.data || data || []
        
        const entradas = nfs.filter(nf => nf.tipo === 'entrada')
        const saidas = nfs.filter(nf => nf.tipo === 'saida')
        
        const valorEntradas = entradas.reduce((sum, nf) => sum + (parseFloat(nf.valor_total) || 0), 0)
        const valorSaidas = saidas.reduce((sum, nf) => sum + (parseFloat(nf.valor_total) || 0), 0)
        const saldo = valorEntradas - valorSaidas
        
        summaryText += `📄 *NOTAS FISCAIS*\n`
        summaryText += `Total de NFs: ${nfs.length}\n\n`
        summaryText += `📥 *Entradas:* ${entradas.length} NFs\n`
        summaryText += `   Valor: R$ ${valorEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
        summaryText += `📤 *Saídas:* ${saidas.length} NFs\n`
        summaryText += `   Valor: R$ ${valorSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
        summaryText += `💰 *Saldo:* R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        
        // Gráfico visual
        const maxBar = 15
        const totalValor = valorEntradas + valorSaidas
        if (totalValor > 0) {
          const percEntradas = (valorEntradas / totalValor) * 100
          const percSaidas = (valorSaidas / totalValor) * 100
          const entradasBar = '█'.repeat(Math.round((valorEntradas / totalValor) * maxBar)) || '░'
          const saidasBar = '█'.repeat(Math.round((valorSaidas / totalValor) * maxBar)) || '░'
          summaryText += `\n📊 Proporção:\n`
          summaryText += `Entrada: ${entradasBar} ${percEntradas.toFixed(1)}%\n`
          summaryText += `Saída:   ${saidasBar} ${percSaidas.toFixed(1)}%\n`
        }
        summaryText += `\n`
      }
    }

    // Nascimentos
    if (relatorios.includes('nascimentos') || relatorios.includes('resumo_nascimentos')) {
      const res = await fetch(`/api/animals`)
      if (res.ok) {
        const data = await res.json()
        const animals = data.data || data || []
        const nascimentos = animals.filter(a => {
          const dataNasc = new Date(a.data_nascimento || a.dataNascimento)
          return dataNasc >= new Date(period.startDate) && dataNasc <= new Date(period.endDate)
        })
        
        const machos = nascimentos.filter(a => a.sexo === 'M' || a.sexo === 'Macho').length
        const femeas = nascimentos.filter(a => a.sexo === 'F' || a.sexo === 'Fêmea').length
        
        summaryText += `👶 *NASCIMENTOS*\n`
        summaryText += `Total: ${nascimentos.length}\n`
        summaryText += `♂️ Machos: ${machos} (${nascimentos.length > 0 ? ((machos/nascimentos.length)*100).toFixed(1) : 0}%)\n`
        summaryText += `♀️ Fêmeas: ${femeas} (${nascimentos.length > 0 ? ((femeas/nascimentos.length)*100).toFixed(1) : 0}%)\n`
        
        // Gráfico de barras em texto
        if (nascimentos.length > 0) {
          const maxBar = 15
          const machosBar = '█'.repeat(Math.round((machos / nascimentos.length) * maxBar)) || '░'
          const femeasBar = '█'.repeat(Math.round((femeas / nascimentos.length) * maxBar)) || '░'
          summaryText += `\n📊 Distribuição:\n`
          summaryText += `M: ${machosBar} ${machos}\n`
          summaryText += `F: ${femeasBar} ${femeas}\n`
        }
        summaryText += `\n`
      }
    }

    // Resumo por Pai
    if (relatorios.includes('resumo_por_pai')) {
      const res = await fetch(`/api/animals`)
      if (res.ok) {
        const data = await res.json()
        const animals = data.data || data || []
        const nascimentos = animals.filter(a => {
          const dataNasc = new Date(a.data_nascimento || a.dataNascimento)
          return dataNasc >= new Date(period.startDate) && dataNasc <= new Date(period.endDate)
        })
        
        // Agrupar por pai
        const porPai = {}
        nascimentos.forEach(a => {
          const pai = a.pai || a.touro || 'Não informado'
          if (!porPai[pai]) {
            porPai[pai] = { total: 0, machos: 0, femeas: 0 }
          }
          porPai[pai].total++
          if (a.sexo === 'M' || a.sexo === 'Macho') porPai[pai].machos++
          if (a.sexo === 'F' || a.sexo === 'Fêmea') porPai[pai].femeas++
        })
        
        const topPais = Object.entries(porPai)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
        
        if (topPais.length > 0) {
          summaryText += `🐂 *TOP 5 TOUROS*\n`
          topPais.forEach(([pai, stats], idx) => {
            summaryText += `${idx + 1}. ${pai}\n`
            summaryText += `   Total: ${stats.total} | M: ${stats.machos} | F: ${stats.femeas}\n`
          })
          summaryText += `\n`
        }
      }
    }

    // Mortes
    if (relatorios.includes('mortes')) {
      const res = await fetch(`/api/mortes`)
      if (res.ok) {
        const data = await res.json()
        const allMortes = data.data || data || []
        const mortes = allMortes.filter(m => {
          const dataMorte = new Date(m.data_morte)
          return dataMorte >= new Date(period.startDate) && dataMorte <= new Date(period.endDate)
        })
        
        summaryText += `💀 *MORTES*\n`
        summaryText += `Total: ${mortes.length}\n`
        
        if (mortes.length > 0) {
          // Agrupar por causa
          const porCausa = {}
          mortes.forEach(m => {
            const causa = m.causa || 'Não informada'
            porCausa[causa] = (porCausa[causa] || 0) + 1
          })
          
          summaryText += `\nPrincipais causas:\n`
          Object.entries(porCausa)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([causa, qtd]) => {
              summaryText += `• ${causa}: ${qtd}\n`
            })
        }
        summaryText += `\n`
      }
    }

    // Receptoras que chegaram
    if (relatorios.includes('receptoras_chegaram')) {
      const res = await fetch(`/api/notas-fiscais`)
      if (res.ok) {
        const data = await res.json()
        const allNfs = data.data || data || []
        const receptoras = allNfs.filter(nf => {
          const dataCompra = new Date(nf.data_compra)
          return nf.eh_receptoras && nf.tipo === 'entrada' &&
                 dataCompra >= new Date(period.startDate) && dataCompra <= new Date(period.endDate)
        })
        
        const totalReceptoras = receptoras.reduce((sum, nf) => sum + (parseInt(nf.quantidade_receptoras) || 0), 0)
        const valorTotal = receptoras.reduce((sum, nf) => sum + (parseFloat(nf.valor_total) || 0), 0)
        
        summaryText += `🐄 *RECEPTORAS QUE CHEGARAM*\n`
        summaryText += `Total de NFs: ${receptoras.length}\n`
        summaryText += `Quantidade: ${totalReceptoras} receptoras\n`
        summaryText += `Valor Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        if (totalReceptoras > 0) {
          summaryText += `Valor Médio: R$ ${(valorTotal / totalReceptoras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/receptora\n`
        }
        summaryText += `\n`
      }
    }

    // Receptoras que faltam parir
    if (relatorios.includes('receptoras_faltam_parir')) {
      summaryText += `⏰ *RECEPTORAS QUE FALTAM PARIR*\n`
      summaryText += `Consulte o relatório completo no email\n\n`
    }

    // Receptoras que faltam diagnóstico
    if (relatorios.includes('receptoras_faltam_diagnostico')) {
      summaryText += `🔬 *RECEPTORAS QUE FALTAM DIAGNÓSTICO*\n`
      summaryText += `Consulte o relatório completo no email\n\n`
    }

  } catch (error) {
    console.error('Erro ao gerar resumo:', error)
    summaryText += `\n⚠️ Erro ao buscar alguns dados\n\n`
  }
  
  summaryText += `━━━━━━━━━━━━━━━━━━━━━━\n`
  summaryText += `🖥️ Sistema: Beef-Sync\n`
  summaryText += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`
  
  return summaryText
}

// Normaliza número para wa.me (55 + DDD + número)
function normalizePhoneForWaMe(whatsapp) {
  if (!whatsapp) return ''
  const digits = String(whatsapp).replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

export function showWhatsAppModal(summaryText, chartImage, whatsappEnviado = false, destinatarios = []) {
  // Destinatários com WhatsApp para abrir no app instalado
  const destinatariosComWhatsApp = (destinatarios || []).filter(d => d.recebe_whatsapp && d.whatsapp)
  
  // Abrir modal com resumo visual
  const modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;'
  
  const content = document.createElement('div')
  content.style.cssText = 'background:white;padding:30px;border-radius:15px;max-width:800px;max-height:90vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,0.5);'
  
  const chartHtml = chartImage 
    ? `<div style="text-align:center;margin-bottom:20px;">
         <h3 style="color:#333;font-size:18px;margin-bottom:10px;">📊 Gráfico Resumo</h3>
         <img src="${chartImage}" style="max-width:100%;border-radius:8px;border:2px solid #ddd;box-shadow:0 4px 8px rgba(0,0,0,0.1);" alt="Gráfico Resumo" />
       </div>`
    : ''

  // Botões para abrir no WhatsApp (app instalado ou Web) - um por destinatário
  let whatsappBtnsHtml = ''
  if (!whatsappEnviado) {
    if (destinatariosComWhatsApp.length > 0) {
      whatsappBtnsHtml = destinatariosComWhatsApp.map((d) => {
        const phone = normalizePhoneForWaMe(d.whatsapp)
        if (!phone || phone.length < 12) return ''
        return `<button class="wa-dest-btn" data-phone="${phone}" style="padding:12px 24px;background:#25D366;color:white;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 3px 10px rgba(37,211,102,0.3);transition:all 0.3s;">
          📱 Enviar para ${(d.nome || d.name || 'Contato').substring(0, 25)}
        </button>`
      }).filter(Boolean).join('')
    }
    // Fallback: botão genérico (abre WhatsApp Web sem destinatário)
    if (!whatsappBtnsHtml) {
      whatsappBtnsHtml = `<button id="whatsappBtn" style="padding:14px 30px;background:#25D366;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 3px 10px rgba(37,211,102,0.3);transition:all 0.3s;">
         💬 Abrir no WhatsApp
       </button>`
    }
  }

  const statusHtml = whatsappEnviado
    ? `<div style="background:#d4edda;border:2px solid #c3e6cb;color:#155724;padding:15px;border-radius:8px;margin-bottom:20px;text-align:center;">
         <strong>✅ WhatsApp enviado automaticamente!</strong><br>
         <small>O resumo e gráfico foram enviados para seu WhatsApp instalado.</small>
       </div>`
    : ''

  content.innerHTML = `
    <h2 style="text-align:center;margin-bottom:20px;color:#333;font-size:24px;">📊 RESUMO PARA WHATSAPP</h2>
    ${statusHtml}
    ${chartHtml}
    <div id="summaryText" style="background:#f5f5f5;padding:20px;border-radius:8px;font-family:monospace;white-space:pre-wrap;font-size:12px;line-height:1.7;border:2px solid #ddd;max-height:400px;overflow-y:auto;">${summaryText}</div>
    <div style="margin-top:25px;text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      ${whatsappBtnsHtml}
      <button id="copyBtn" style="padding:14px 30px;background:#0088cc;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 3px 10px rgba(0,136,204,0.3);transition:all 0.3s;">
        📋 Copiar Texto
      </button>
      <button id="closeBtn" style="padding:14px 30px;background:#666;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.2);transition:all 0.3s;">
        ✖️ Fechar
      </button>
    </div>
    ${!whatsappEnviado ? `<p style="text-align:center;margin-top:15px;color:#666;font-size:13px;">💡 ${destinatariosComWhatsApp.length > 0 ? 'Clique no botão para abrir o WhatsApp (app instalado) com a mensagem pronta. Basta clicar em Enviar!' : 'Copie o texto ou abra o WhatsApp para enviar manualmente.'}</p>` : ''}
  `
  
  modal.appendChild(content)
  document.body.appendChild(modal)
  
  // Abrir no WhatsApp - wa.me abre o app instalado (Desktop) ou Web
  content.querySelectorAll('.wa-dest-btn').forEach(btn => {
    btn.onclick = () => {
      const phone = btn.getAttribute('data-phone')
      const encodedText = encodeURIComponent(summaryText)
      // wa.me abre o WhatsApp Desktop quando instalado, senão abre Web
      window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank')
    }
  })
  
  const whatsappBtn = content.querySelector('#whatsappBtn')
  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      const encodedText = encodeURIComponent(summaryText)
      // api.whatsapp.com abre o app instalado; web.whatsapp.com abre no navegador
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank')
    }
  }
  
  // Copiar texto
  content.querySelector('#copyBtn').onclick = () => {
    navigator.clipboard.writeText(summaryText).then(() => {
      const btn = content.querySelector('#copyBtn')
      const originalText = btn.innerHTML
      btn.innerHTML = '✅ Copiado!'
      btn.style.background = '#4CAF50'
      setTimeout(() => {
        btn.innerHTML = originalText
        btn.style.background = '#0088cc'
      }, 2000)
    }).catch(err => {
      alert('❌ Erro ao copiar. Selecione e copie manualmente.')
    })
  }
  
  content.querySelector('#closeBtn').onclick = () => {
    modal.remove()
  }
  
  // Fechar ao clicar fora
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  }
  
  // Efeitos hover
  const buttons = content.querySelectorAll('button')
  buttons.forEach(btn => {
    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)'
      btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'
    }
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)'
      btn.style.boxShadow = btn.id === 'whatsappBtn' ? '0 3px 10px rgba(37,211,102,0.3)' : 
                            btn.id === 'copyBtn' ? '0 3px 10px rgba(0,136,204,0.3)' : 
                            '0 3px 10px rgba(0,0,0,0.2)'
    }
  })
}
