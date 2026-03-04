// Script para limpar dados corrompidos do localStorage

console.log('🧹 Iniciando limpeza do localStorage...')

if (typeof window !== 'undefined') {
  try {
    const keys = Object.keys(localStorage)
    console.log(`📊 Total de chaves no localStorage: ${keys.length}`)
    
    let removedCount = 0
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        
        // Verificar se contém dados suspeitos
        if (value && (
          value.includes('total_tokens') ||
          value.includes('usage') ||
          value.includes('completion') ||
          value.includes('anthropic') ||
          value.includes('openai')
        )) {
          console.log(`🗑️ Removendo chave suspeita: ${key}`)
          localStorage.removeItem(key)
          removedCount++
        }
        
        // Verificar se é JSON válido
        if (value) {
          try {
            JSON.parse(value)
          } catch (e) {
            console.log(`🗑️ Removendo JSON inválido: ${key}`)
            localStorage.removeItem(key)
            removedCount++
          }
        }
        
      } catch (e) {
        console.log(`❌ Erro ao processar chave ${key}:`, e)
        try {
          localStorage.removeItem(key)
          removedCount++
        } catch (removeError) {
          console.log(`❌ Erro ao remover chave ${key}:`, removeError)
        }
      }
    })
    
    console.log(`✅ Limpeza concluída. ${removedCount} chaves removidas.`)
    
    if (removedCount > 0) {
      console.log('🔄 Recomenda-se recarregar a página.')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
  }
} else {
  console.log('⚠️ Script deve ser executado no navegador')
}

// Função para ser chamada manualmente
window.cleanLocalStorage = function() {
  if (confirm('Tem certeza que deseja limpar dados corrompidos do localStorage?')) {
    // Executar limpeza
    console.log('🧹 Executando limpeza manual...')
    // Código de limpeza aqui
  }
}