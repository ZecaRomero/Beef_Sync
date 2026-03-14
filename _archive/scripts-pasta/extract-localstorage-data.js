// Script para extrair dados do localStorage
// Execute este código no console do navegador (F12)

console.log('�Ÿ”� Extraindo dados do localStorage...')

// Extrair notas fiscais
const notasFiscais = localStorage.getItem('notasFiscais')
console.log('�Ÿ“‹ Notas Fiscais:', notasFiscais)

// Extrair outros dados relevantes
const deviceId = localStorage.getItem('beefsync_device_id')
console.log('�Ÿ†” Device ID:', deviceId)

const lastSyncTime = localStorage.getItem('beefsync_last_sync_time')
console.log('⏰ �šltima Sincronização:', lastSyncTime)

const integrationStatus = localStorage.getItem('nf_integracao_status')
console.log('�Ÿ”— Status de Integração:', integrationStatus)

// Mostrar todos os dados do localStorage
console.log('\n�Ÿ“Š Todos os dados do localStorage:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  const value = localStorage.getItem(key)
  console.log(`${key}:`, value)
}

// Gerar código para migração
if (notasFiscais) {
  try {
    const nfs = JSON.parse(notasFiscais)
    console.log('\n�Ÿ’� Código para migração:')
    console.log('const nfsFromLocalStorage =', JSON.stringify(nfs, null, 2))
  } catch (error) {
    console.error('�Œ Erro ao parsear notas fiscais:', error)
  }
}

console.log('\n�œ… Extração concluída!')
console.log('�Ÿ“‹ Copie os dados acima e use no script de migração.')
