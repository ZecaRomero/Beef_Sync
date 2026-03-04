// Script para extrair dados do localStorage
// Execute este código no console do navegador (F12)

console.log('🔍 Extraindo dados do localStorage...')

// Extrair notas fiscais
const notasFiscais = localStorage.getItem('notasFiscais')
console.log('📋 Notas Fiscais:', notasFiscais)

// Extrair outros dados relevantes
const deviceId = localStorage.getItem('beefsync_device_id')
console.log('🆔 Device ID:', deviceId)

const lastSyncTime = localStorage.getItem('beefsync_last_sync_time')
console.log('⏰ Última Sincronização:', lastSyncTime)

const integrationStatus = localStorage.getItem('nf_integracao_status')
console.log('🔗 Status de Integração:', integrationStatus)

// Mostrar todos os dados do localStorage
console.log('\n📊 Todos os dados do localStorage:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  const value = localStorage.getItem(key)
  console.log(`${key}:`, value)
}

// Gerar código para migração
if (notasFiscais) {
  try {
    const nfs = JSON.parse(notasFiscais)
    console.log('\n💾 Código para migração:')
    console.log('const nfsFromLocalStorage =', JSON.stringify(nfs, null, 2))
  } catch (error) {
    console.error('❌ Erro ao parsear notas fiscais:', error)
  }
}

console.log('\n✅ Extração concluída!')
console.log('📋 Copie os dados acima e use no script de migração.')
