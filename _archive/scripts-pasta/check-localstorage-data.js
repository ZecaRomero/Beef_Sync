// Script para verificar dados do localStorage
// Execute este código no console do navegador (F12)

console.log('�Ÿ”� Verificando dados do localStorage...')

// Verificar notas fiscais
const notasFiscais = localStorage.getItem('notasFiscais')
console.log('�Ÿ“‹ Chave "notasFiscais":', notasFiscais)

if (notasFiscais) {
  try {
    const nfs = JSON.parse(notasFiscais)
    console.log('�Ÿ“Š Notas fiscais parseadas:', nfs)
    console.log('�Ÿ”� Quantidade:', nfs.length)
    
    if (nfs.length > 0) {
      console.log('\n�Ÿ“‹ Detalhes da(s) nota(s) fiscal(is):')
      nfs.forEach((nf, index) => {
        console.log(`\n${index + 1}. ID: ${nf.id}`)
        console.log(`   Número NF: ${nf.numeroNF}`)
        console.log(`   Data: ${nf.data}`)
        console.log(`   Tipo: ${nf.tipo}`)
        console.log(`   Fornecedor: ${nf.fornecedor}`)
        console.log(`   Destino: ${nf.destino}`)
        console.log(`   Valor Total: R$ ${nf.valorTotal}`)
        console.log(`   Tipo Produto: ${nf.tipoProduto}`)
        console.log(`   Observações: ${nf.observacoes}`)
        if (nf.itens) {
          console.log(`   Itens:`, nf.itens)
        }
      })
    }
  } catch (error) {
    console.error('�Œ Erro ao parsear notas fiscais:', error)
  }
} else {
  console.log('�Œ Nenhuma nota fiscal encontrada no localStorage')
}

// Verificar outras chaves relacionadas
const deviceId = localStorage.getItem('beefsync_device_id')
console.log('\n�Ÿ†” Device ID:', deviceId)

const lastSyncTime = localStorage.getItem('beefsync_last_sync_time')
console.log('⏰ �šltima Sincronização:', lastSyncTime)

const integrationStatus = localStorage.getItem('nf_integracao_status')
console.log('�Ÿ”— Status de Integração:', integrationStatus)

// Listar todas as chaves do localStorage
console.log('\n�Ÿ“Š Todas as chaves do localStorage:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  const value = localStorage.getItem(key)
  console.log(`${key}:`, value)
}

console.log('\n�œ… Verificação concluída!')
