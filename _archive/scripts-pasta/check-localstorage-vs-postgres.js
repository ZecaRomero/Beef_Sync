// Script para comparar dados do localStorage vs PostgreSQL
console.log('🔍 Comparando dados do localStorage vs PostgreSQL...')

// Verificar localStorage
const localStorageData = localStorage.getItem('notasFiscais')
console.log('📱 Dados do localStorage:')
if (localStorageData) {
  try {
    const nfs = JSON.parse(localStorageData)
    console.log(`   Quantidade: ${nfs.length}`)
    if (nfs.length > 0) {
      console.log('   Detalhes:', nfs)
    }
  } catch (error) {
    console.error('   Erro ao parsear:', error)
  }
} else {
  console.log('   Vazio')
}

// Verificar PostgreSQL via API
fetch('http://localhost:3020/api/notas-fiscais')
.then(response => response.json())
.then(data => {
  console.log('🐘 Dados do PostgreSQL:')
  console.log(`   Quantidade: ${data.length}`)
  if (data.length > 0) {
    console.log('   Detalhes:', data)
  }
  
  // Comparar
  console.log('\n📊 Comparação:')
  console.log(`   localStorage: ${localStorageData ? JSON.parse(localStorageData).length : 0} notas`)
  console.log(`   PostgreSQL: ${data.length} notas`)
  
  if (localStorageData) {
    const localNfs = JSON.parse(localStorageData)
    if (localNfs.length > 0 && data.length === 0) {
      console.log('⚠️  Dados estão no localStorage mas não no PostgreSQL')
      console.log('💡 Execute o script de migração para sincronizar')
    } else if (localNfs.length === 0 && data.length > 0) {
      console.log('✅ Dados estão no PostgreSQL mas não no localStorage')
      console.log('💡 A interface deve carregar dados do PostgreSQL automaticamente')
    } else if (localNfs.length > 0 && data.length > 0) {
      console.log('📋 Dados existem em ambos os locais')
    } else {
      console.log('❌ Nenhum dado encontrado em nenhum local')
    }
  }
})
.catch(error => {
  console.error('❌ Erro ao verificar PostgreSQL:', error)
})
