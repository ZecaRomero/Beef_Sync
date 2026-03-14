// Script para identificar a nota fiscal no localStorage
// Execute este código no console do navegador (F12)

console.log('🔍 Identificando a nota fiscal no localStorage...')

// Verificar notas fiscais
const notasFiscais = localStorage.getItem('notasFiscais')

if (notasFiscais) {
  try {
    const nfs = JSON.parse(notasFiscais)
    console.log(`📊 Encontradas ${nfs.length} nota(s) fiscal(is) no localStorage`)
    
    if (nfs.length > 0) {
      console.log('\n📋 Detalhes da(s) nota(s) fiscal(is):')
      nfs.forEach((nf, index) => {
        console.log(`\n${index + 1}. Nota Fiscal:`)
        console.log(`   ID: ${nf.id}`)
        console.log(`   Número: ${nf.numeroNF}`)
        console.log(`   Data: ${nf.data}`)
        console.log(`   Tipo: ${nf.tipo}`)
        console.log(`   Fornecedor: ${nf.fornecedor}`)
        console.log(`   Destino: ${nf.destino}`)
        console.log(`   Valor Total: R$ ${nf.valorTotal}`)
        console.log(`   Tipo Produto: ${nf.tipoProduto}`)
        console.log(`   Observações: ${nf.observacoes}`)
        
        if (nf.itens && nf.itens.length > 0) {
          console.log(`   Itens (${nf.itens.length}):`)
          nf.itens.forEach((item, itemIndex) => {
            console.log(`     ${itemIndex + 1}. ${item.tipoProduto || 'Produto'}`)
            if (item.tatuagem) console.log(`        Tatuagem: ${item.tatuagem}`)
            if (item.sexo) console.log(`        Sexo: ${item.sexo}`)
            if (item.raca) console.log(`        Raça: ${item.raca}`)
            if (item.peso) console.log(`        Peso: ${item.peso} kg`)
            if (item.valorUnitario) console.log(`        Valor Unitário: R$ ${item.valorUnitario}`)
          })
        }
      })
      
      console.log('\n💡 Esta é a nota fiscal que aparece como "1" na interface!')
      console.log('📋 Para migrar para PostgreSQL, use o script de migração.')
      
    } else {
      console.log('❌ Array de notas fiscais está vazio')
    }
  } catch (error) {
    console.error('❌ Erro ao parsear notas fiscais:', error)
  }
} else {
  console.log('❌ Nenhuma nota fiscal encontrada no localStorage')
}

// Verificar outras informações relevantes
console.log('\n🔍 Outras informações do localStorage:')
const deviceId = localStorage.getItem('beefsync_device_id')
if (deviceId) {
  console.log(`🆔 Device ID: ${deviceId}`)
}

const lastSync = localStorage.getItem('beefsync_last_sync_time')
if (lastSync) {
  console.log(`⏰ Última Sincronização: ${lastSync}`)
}

const integrationStatus = localStorage.getItem('nf_integracao_status')
if (integrationStatus) {
  console.log(`🔗 Status de Integração: ${integrationStatus}`)
}

console.log('\n✅ Identificação concluída!')
