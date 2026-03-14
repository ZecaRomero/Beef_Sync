// UtilitÃ¡rio para limpar todos os dados mock do sistema

export const clearAllMockData = () => {
  try {
    // Limpar dados de nascimentos
    localStorage.removeItem('birthData')
    
    // Limpar dados de animais
    localStorage.removeItem('animals')
    
    // Limpar dados de custos
    localStorage.removeItem('animalCosts')
    localStorage.removeItem('costManager')
    
    // Limpar configuraÃ§Ãµes customizadas (manter apenas as essenciais)
    // localStorage.removeItem('customPrices') // Manter preÃ§os customizados
    // localStorage.removeItem('customMedicamentos') // Manter medicamentos customizados
    // localStorage.removeItem('customProtocolos') // Manter protocolos customizados
    
    console.log('âÅ“â€¦ Dados mock removidos com sucesso!')
    return true
  } catch (error) {
    console.error('â�Å’ Erro ao limpar dados mock:', error)
    return false
  }
}

export const resetToCleanState = () => {
  if (confirm('âÅ¡ ï¸� ATENÃâ€¡ÃÆ’O: Isso irÃ¡ remover TODOS os dados do sistema.\n\nTem certeza que deseja continuar?\n\nEsta aÃ§Ã£o nÃ£o pode ser desfeita.')) {
    clearAllMockData()
    
    // Recarregar a pÃ¡gina para aplicar as mudanÃ§as
    window.location.reload()
  }
}

// FunÃ§Ã£o para verificar se hÃ¡ dados mock
export const hasMockData = () => {
  const birthData = localStorage.getItem('birthData')
  const animals = localStorage.getItem('animals')
  
  if (birthData) {
    const births = JSON.parse(birthData)
    // Verificar se hÃ¡ dados que parecem mock (muitos registros com padrÃµes similares)
    if (births.length > 10) {
      return true
    }
  }
  
  if (animals) {
    const animalList = JSON.parse(animals)
    if (animalList.length > 5) {
      return true
    }
  }
  
  return false
}

// Executar limpeza automÃ¡tica se detectar dados mock
if (typeof window !== 'undefined') {
  // Adicionar funÃ§Ã£o global para limpeza manual
  window.clearMockData = clearAllMockData
  window.resetSystem = resetToCleanState
  window.checkMockData = hasMockData
  
  console.log('ðÅ¸§¹ UtilitÃ¡rios de limpeza disponÃ­veis:')
  console.log('- window.clearMockData() - Remove dados mock')
  console.log('- window.resetSystem() - Reset completo do sistema')
  console.log('- window.checkMockData() - Verifica se hÃ¡ dados mock')
}