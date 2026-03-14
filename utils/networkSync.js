// UtilitÃ¡rio para sincronizaÃ§Ã£o de dados entre computadores na rede

export const exportAllData = () => {
  try {
    const allData = {
      animals: JSON.parse(localStorage.getItem('animals') || '[]'),
      births: JSON.parse(localStorage.getItem('birthData') || '[]'),
      costs: JSON.parse(localStorage.getItem('animalCosts') || '{}'),
      prices: JSON.parse(localStorage.getItem('customPrices') || '{}'),
      medicines: JSON.parse(localStorage.getItem('customMedicamentos') || '[]'),
      protocols: JSON.parse(localStorage.getItem('customProtocolos') || '{}'),
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        hostname: window.location.hostname,
        timestamp: new Date().toLocaleString('pt-BR')
      }
    }

    // Criar arquivo para download
    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `beef-sync-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('âÅ“â€¦ Backup exportado com sucesso!')
    return allData
  } catch (error) {
    console.error('â�Å’ Erro ao exportar dados:', error)
    alert('Erro ao exportar dados. Verifique o console.')
    return null
  }
}

export const importAllData = (jsonData) => {
  try {
    let data
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData)
    } else {
      data = jsonData
    }

    // Validar estrutura dos dados
    if (!data || typeof data !== 'object') {
      throw new Error('Dados invÃ¡lidos')
    }

    // Fazer backup dos dados atuais antes de importar
    const currentBackup = exportCurrentData()
    console.log('ðÅ¸â€œ¦ Backup atual criado antes da importaÃ§Ã£o')

    // Importar cada tipo de dado
    if (data.animals) {
      localStorage.setItem('animals', JSON.stringify(data.animals))
      console.log(`âÅ“â€¦ Importados ${data.animals.length} animais`)
    }

    if (data.births) {
      localStorage.setItem('birthData', JSON.stringify(data.births))
      console.log(`âÅ“â€¦ Importados ${data.births.length} nascimentos`)
    }

    if (data.costs) {
      localStorage.setItem('animalCosts', JSON.stringify(data.costs))
      console.log('âÅ“â€¦ Custos importados')
    }

    if (data.prices) {
      localStorage.setItem('customPrices', JSON.stringify(data.prices))
      console.log('âÅ“â€¦ PreÃ§os customizados importados')
    }

    if (data.medicines) {
      localStorage.setItem('customMedicamentos', JSON.stringify(data.medicines))
      console.log(`âÅ“â€¦ Importados ${data.medicines.length} medicamentos`)
    }

    if (data.protocols) {
      localStorage.setItem('customProtocolos', JSON.stringify(data.protocols))
      console.log('âÅ“â€¦ Protocolos importados')
    }

    alert(`âÅ“â€¦ Dados importados com sucesso!\n\nðÅ¸â€œÅ  Resumo:\nââ‚¬¢ ${data.animals?.length || 0} animais\nââ‚¬¢ ${data.births?.length || 0} nascimentos\nââ‚¬¢ ConfiguraÃ§Ãµes atualizadas\n\nA pÃ¡gina serÃ¡ recarregada.`)
    
    // Recarregar pÃ¡gina para aplicar mudanÃ§as
    window.location.reload()
    
    return true
  } catch (error) {
    console.error('â�Å’ Erro ao importar dados:', error)
    alert(`â�Å’ Erro ao importar dados:\n${error.message}\n\nVerifique se o arquivo estÃ¡ correto.`)
    return false
  }
}

const exportCurrentData = () => {
  const backup = {
    animals: JSON.parse(localStorage.getItem('animals') || '[]'),
    births: JSON.parse(localStorage.getItem('birthData') || '[]'),
    costs: JSON.parse(localStorage.getItem('animalCosts') || '{}'),
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem('lastBackup', JSON.stringify(backup))
  return backup
}

export const createSyncCode = () => {
  try {
    const data = {
      animals: JSON.parse(localStorage.getItem('animals') || '[]'),
      births: JSON.parse(localStorage.getItem('birthData') || '[]'),
      costs: JSON.parse(localStorage.getItem('animalCosts') || '{}'),
      timestamp: new Date().toISOString()
    }

    // Criar cÃ³digo compacto (base64)
    const jsonStr = JSON.stringify(data)
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)))
    
    // Dividir em chunks para facilitar cÃ³pia
    const chunkSize = 100
    const chunks = []
    for (let i = 0; i < encoded.length; i += chunkSize) {
      chunks.push(encoded.slice(i, i + chunkSize))
    }

    console.log('ðÅ¸â€œâ€¹ CÃ³digo de sincronizaÃ§Ã£o gerado:')
    console.log('='.repeat(50))
    chunks.forEach((chunk, index) => {
      console.log(`Parte ${index + 1}/${chunks.length}: ${chunk}`)
    })
    console.log('='.repeat(50))
    console.log('ðÅ¸â€™¡ Copie todas as partes e cole no outro computador usando importSyncCode()')

    return { encoded, chunks }
  } catch (error) {
    console.error('â�Å’ Erro ao criar cÃ³digo de sincronizaÃ§Ã£o:', error)
    return null
  }
}

export const importSyncCode = (encodedData) => {
  try {
    // Se for array de chunks, juntar
    let encoded = encodedData
    if (Array.isArray(encodedData)) {
      encoded = encodedData.join('')
    }

    // Decodificar
    const jsonStr = decodeURIComponent(escape(atob(encoded)))
    const data = JSON.parse(jsonStr)

    return importAllData(data)
  } catch (error) {
    console.error('â�Å’ Erro ao importar cÃ³digo de sincronizaÃ§Ã£o:', error)
    alert('â�Å’ CÃ³digo de sincronizaÃ§Ã£o invÃ¡lido')
    return false
  }
}

export const showNetworkInfo = () => {
  const info = {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    fullUrl: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toLocaleString('pt-BR')
  }

  console.log('ðÅ¸Å’� InformaÃ§Ãµes de Rede:')
  console.log('='.repeat(40))
  console.log(`ðÅ¸â€“¥ï¸�  Hostname: ${info.hostname}`)
  console.log(`ðÅ¸â€�Å’ Porta: ${info.port || '3000'}`)
  console.log(`ðÅ¸â€�â€” URL Completa: ${info.fullUrl}`)
  console.log(`â�° Timestamp: ${info.timestamp}`)
  console.log('='.repeat(40))
  console.log('ðÅ¸â€™¡ Compartilhe a URL com outros desenvolvedores na mesma rede')

  return info
}

// Disponibilizar funÃ§Ãµes globalmente para uso no console
if (typeof window !== 'undefined') {
  window.exportAllData = exportAllData
  window.importAllData = importAllData
  window.createSyncCode = createSyncCode
  window.importSyncCode = importSyncCode
  window.showNetworkInfo = showNetworkInfo

  console.log('ðÅ¸â€�â€ž UtilitÃ¡rios de sincronizaÃ§Ã£o carregados:')
  console.log('ââ‚¬¢ window.exportAllData() - Exportar todos os dados')
  console.log('ââ‚¬¢ window.importAllData(data) - Importar dados')
  console.log('ââ‚¬¢ window.createSyncCode() - Criar cÃ³digo de sincronizaÃ§Ã£o')
  console.log('ââ‚¬¢ window.importSyncCode(code) - Importar via cÃ³digo')
  console.log('ââ‚¬¢ window.showNetworkInfo() - Mostrar info de rede')
}