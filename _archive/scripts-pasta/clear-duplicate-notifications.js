// Script para limpar notificações duplicadas do localStorage
console.log('�Ÿ�� Limpando notificações duplicadas...')

try {
  // Limpar todas as notificações
  localStorage.removeItem('beefsync_notifications')
  localStorage.removeItem('beefsync_notifications_last_generation')
  
  console.log('�œ… Notificações duplicadas removidas!')
  console.log('�Ÿ”„ Recarregue a página para ver as mudanças')
  
  // Recarregar a página automaticamente
  setTimeout(() => {
    window.location.reload()
  }, 2000)
  
} catch (error) {
  console.error('�Œ Erro ao limpar notificações:', error)
}
