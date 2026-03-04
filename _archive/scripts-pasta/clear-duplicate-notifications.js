// Script para limpar notificações duplicadas do localStorage
console.log('🧹 Limpando notificações duplicadas...')

try {
  // Limpar todas as notificações
  localStorage.removeItem('beefsync_notifications')
  localStorage.removeItem('beefsync_notifications_last_generation')
  
  console.log('✅ Notificações duplicadas removidas!')
  console.log('🔄 Recarregue a página para ver as mudanças')
  
  // Recarregar a página automaticamente
  setTimeout(() => {
    window.location.reload()
  }, 2000)
  
} catch (error) {
  console.error('❌ Erro ao limpar notificações:', error)
}
