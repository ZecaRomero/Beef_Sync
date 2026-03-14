// UtilitÃ¡rio para integraÃ§Ã£o do estoque de sÃªmen com inseminaÃ§Ãµes

export const getSemenStock = () => {
  try {
    const stock = localStorage.getItem('semenStock')
    return stock ? JSON.parse(stock) : []
  } catch (error) {
    console.error('Erro ao carregar estoque de sÃªmen:', error)
    return []
  }
}

export const getAvailableSemen = () => {
  const stock = getSemenStock()
  return stock.filter(semen => 
    semen.status === 'disponivel' && 
    parseInt(semen.dosesDisponiveis) > 0
  )
}

export const getSemenById = (semenId) => {
  const stock = getSemenStock()
  return stock.find(semen => semen.id === parseInt(semenId))
}

export const getSemenByTouro = (nomeTouro) => {
  const stock = getSemenStock()
  return stock.filter(semen => 
    semen.nomeTouro.toLowerCase().includes(nomeTouro.toLowerCase()) &&
    semen.status === 'disponivel' && 
    parseInt(semen.dosesDisponiveis) > 0
  )
}

export const useSemenDose = (semenId, animalId, observacoes = '') => {
  try {
    const stock = getSemenStock()
    const semenIndex = stock.findIndex(s => s.id === parseInt(semenId))
    
    if (semenIndex === -1) {
      throw new Error('SÃªmen nÃ£o encontrado no estoque')
    }

    const semen = stock[semenIndex]
    
    if (semen.status !== 'disponivel' || parseInt(semen.dosesDisponiveis) <= 0) {
      throw new Error('SÃªmen nÃ£o disponÃ­vel para uso')
    }

    // Atualizar estoque
    const newDosesDisponiveis = parseInt(semen.dosesDisponiveis) - 1
    const newDosesUsadas = parseInt(semen.dosesUsadas || 0) + 1
    const newStatus = newDosesDisponiveis === 0 ? 'esgotado' : 'disponivel'

    stock[semenIndex] = {
      ...semen,
      dosesDisponiveis: newDosesDisponiveis,
      dosesUsadas: newDosesUsadas,
      status: newStatus,
      lastUsed: new Date().toISOString()
    }

    // Salvar estoque atualizado
    localStorage.setItem('semenStock', JSON.stringify(stock))

    // Registrar uso no histÃ³rico
    const usoSemen = {
      id: Date.now(),
      semenId: parseInt(semenId),
      animalId: parseInt(animalId),
      nomeTouro: semen.nomeTouro,
      rgTouro: semen.rgTouro,
      dataUso: new Date().toISOString(),
      observacoes,
      valorDose: parseFloat(semen.valorCompra) / parseInt(semen.quantidadeDoses),
      botijao: semen.botijao,
      caneca: semen.caneca,
      fornecedor: semen.fornecedor
    }

    // Salvar histÃ³rico de uso
    const historicoUso = JSON.parse(localStorage.getItem('semenUsageHistory') || '[]')
    historicoUso.push(usoSemen)
    localStorage.setItem('semenUsageHistory', JSON.stringify(historicoUso))

    return {
      success: true,
      message: `Dose do touro ${semen.nomeTouro} utilizada com sucesso`,
      semenUsado: semen,
      dosesRestantes: newDosesDisponiveis,
      usoRegistrado: usoSemen
    }

  } catch (error) {
    console.error('Erro ao usar dose de sÃªmen:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}

export const getSemenUsageHistory = (animalId = null) => {
  try {
    const history = JSON.parse(localStorage.getItem('semenUsageHistory') || '[]')
    
    if (animalId) {
      return history.filter(uso => uso.animalId === parseInt(animalId))
    }
    
    return history
  } catch (error) {
    console.error('Erro ao carregar histÃ³rico de uso:', error)
    return []
  }
}

export const getSemenStats = () => {
  const stock = getSemenStock()
  const history = getSemenUsageHistory()
  
  return {
    totalTouros: stock.length,
    tourosDisponiveis: stock.filter(s => s.status === 'disponivel').length,
    tourosEsgotados: stock.filter(s => s.status === 'esgotado').length,
    totalDoses: stock.reduce((acc, s) => acc + parseInt(s.quantidadeDoses || 0), 0),
    dosesDisponiveis: stock.reduce((acc, s) => acc + parseInt(s.dosesDisponiveis || 0), 0),
    dosesUsadas: stock.reduce((acc, s) => acc + parseInt(s.dosesUsadas || 0), 0),
    valorTotalInvestido: stock.reduce((acc, s) => acc + parseFloat(s.valorCompra || 0), 0),
    valorTotalUsado: history.reduce((acc, h) => acc + (h.valorDose || 0), 0),
    inseminacoesRealizadas: history.length,
    tourosUtilizados: [...new Set(history.map(h => h.nomeTouro))].length
  }
}

export const getTopUsedSemen = (limit = 5) => {
  const history = getSemenUsageHistory()
  const usage = {}
  
  history.forEach(uso => {
    const key = `${uso.nomeTouro} (${uso.rgTouro})`
    usage[key] = (usage[key] || 0) + 1
  })
  
  return Object.entries(usage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([touro, count]) => ({ touro, count }))
}

export const checkLowStock = (threshold = 5) => {
  const stock = getSemenStock()
  return stock.filter(semen => 
    semen.status === 'disponivel' && 
    parseInt(semen.dosesDisponiveis) <= threshold &&
    parseInt(semen.dosesDisponiveis) > 0
  )
}

export const checkExpiredSemen = () => {
  const stock = getSemenStock()
  const today = new Date()
  
  return stock.filter(semen => {
    if (!semen.dataValidade) return false
    const validade = new Date(semen.dataValidade)
    return validade <= today && semen.status === 'disponivel'
  })
}

// FunÃ§Ã£o para ser usada no histÃ³rico de ocorrÃªncias
export const registerInseminationEvent = (animalId, semenId, observacoes = '') => {
  const semen = getSemenById(semenId)
  if (!semen) return null

  // Registrar no histÃ³rico de ocorrÃªncias
  const events = JSON.parse(localStorage.getItem('animalHistory') || '[]')
  const newEvent = {
    id: Date.now(),
    animalId: parseInt(animalId),
    tipo: 'inseminacao',
    data: new Date().toISOString().split('T')[0],
    descricao: `InseminaÃ§Ã£o com sÃªmen do touro ${semen.nomeTouro}`,
    observacoes: `${observacoes}\n\nDetalhes do sÃªmen:\n- Touro: ${semen.nomeTouro} (${semen.rgTouro})\n- Fornecedor: ${semen.fornecedor}\n- BotijÃ£o: ${semen.botijao}\n- Caneca: ${semen.caneca}`,
    veterinario: '',
    medicamento: semen.nomeTouro,
    dosagem: '1 dose',
    local: semen.localizacao,
    responsavel: 'Sistema',
    createdAt: new Date().toISOString(),
    semenId: parseInt(semenId),
    valorDose: parseFloat(semen.valorCompra) / parseInt(semen.quantidadeDoses)
  }

  events.push(newEvent)
  localStorage.setItem('animalHistory', JSON.stringify(events))

  return newEvent
}

// Disponibilizar funÃ§Ãµes globalmente para uso no console
if (typeof window !== 'undefined') {
  window.semenUtils = {
    getSemenStock,
    getAvailableSemen,
    useSemenDose,
    getSemenStats,
    checkLowStock,
    checkExpiredSemen,
    getSemenUsageHistory
  }

  console.log('ðÅ¸§¬ UtilitÃ¡rios de sÃªmen carregados:')
  console.log('ââ‚¬¢ window.semenUtils.getSemenStock() - Ver estoque completo')
  console.log('ââ‚¬¢ window.semenUtils.getAvailableSemen() - Ver sÃªmen disponÃ­vel')
  console.log('ââ‚¬¢ window.semenUtils.getSemenStats() - EstatÃ­sticas do estoque')
  console.log('ââ‚¬¢ window.semenUtils.checkLowStock() - Verificar estoque baixo')
}