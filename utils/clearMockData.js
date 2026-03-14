// Utilitário para limpar todos os dados mock do sistema

export const clearAllMockData = () => {
  try {
    // Limpar dados de nascimentos
    localStorage.removeItem('birthData')
    
    // Limpar dados de animais
    localStorage.removeItem('animals')
    
    // Limpar dados de custos
    localStorage.removeItem('animalCosts')
    localStorage.removeItem('costManager')
    
    // Limpar configurações customizadas (manter apenas as essenciais)
    // localStorage.removeItem('customPrices') // Manter preços customizados
    // localStorage.removeItem('customMedicamentos') // Manter medicamentos customizados
    // localStorage.removeItem('customProtocolos') // Manter protocolos customizados
    
    console.log('✅ Dados mock removidos com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao limpar dados mock:', error)
    return false
  }
}

export const resetToCleanState = () => {
  if (confirm('⚠️ ATENÇÃO: Isso irá remover TODOS os dados do sistema.\n\nTem certeza que deseja continuar?\n\nEsta ação não pode ser desfeita.')) {
    clearAllMockData()
    
    // Recarregar a página para aplicar as mudanças
    window.location.reload()
  }
}

// Função para verificar se há dados mock
export const hasMockData = () => {
  const birthData = localStorage.getItem('birthData')
  const animals = localStorage.getItem('animals')
  
  if (birthData) {
    const births = JSON.parse(birthData)
    // Verificar se há dados que parecem mock (muitos registros com padrões similares)
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

// Executar limpeza automática se detectar dados mock
if (typeof window !== 'undefined') {
  // Adicionar função global para limpeza manual
  window.clearMockData = clearAllMockData
  window.resetSystem = resetToCleanState
  window.checkMockData = hasMockData
  
  console.log('🧹 Utilitários de limpeza disponíveis:')
  console.log('- window.clearMockData() - Remove dados mock')
  console.log('- window.resetSystem() - Reset completo do sistema')
  console.log('- window.checkMockData() - Verifica se há dados mock')
}