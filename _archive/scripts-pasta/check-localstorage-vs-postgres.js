// Script para comparar dados do localStorage vs PostgreSQL
console.log('≈∏‚Äùç Comparando dados do localStorage vs PostgreSQL...')

// Verificar localStorage
const localStorageData = localStorage.getItem('notasFiscais')
console.log('≈∏‚Äú± Dados do localStorage:')
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
  console.log('≈∏êÀú Dados do PostgreSQL:')
  console.log(`   Quantidade: ${data.length}`)
  if (data.length > 0) {
    console.log('   Detalhes:', data)
  }
  
  // Comparar
  console.log('\n≈∏‚Äú≈† Compara√ß√£o:')
  console.log(`   localStorage: ${localStorageData ? JSON.parse(localStorageData).length : 0} notas`)
  console.log(`   PostgreSQL: ${data.length} notas`)
  
  if (localStorageData) {
    const localNfs = JSON.parse(localStorageData)
    if (localNfs.length > 0 && data.length === 0) {
      console.log('‚≈°†Ô∏è  Dados est√£o no localStorage mas n√£o no PostgreSQL')
      console.log('≈∏‚Äô° Execute o script de migra√ß√£o para sincronizar')
    } else if (localNfs.length === 0 && data.length > 0) {
      console.log('‚≈ì‚Ä¶ Dados est√£o no PostgreSQL mas n√£o no localStorage')
      console.log('≈∏‚Äô° A interface deve carregar dados do PostgreSQL automaticamente')
    } else if (localNfs.length > 0 && data.length > 0) {
      console.log('≈∏‚Äú‚Äπ Dados existem em ambos os locais')
    } else {
      console.log('‚ù≈í Nenhum dado encontrado em nenhum local')
    }
  }
})
.catch(error => {
  console.error('‚ù≈í Erro ao verificar PostgreSQL:', error)
})
