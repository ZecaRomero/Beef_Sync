// Script para testar o formato da resposta da API de NFs
const fetch = require('node-fetch')

async function testNFAPI() {
  try {
    console.log('🔍 Testando API de NFs de saída...\n')
    
    // Simular chamada da API
    const response = await fetch('http://localhost:3000/api/notas-fiscais?tipo=saida')
    
    if (!response.ok) {
      console.log('❌ Erro na API:', response.status, response.statusText)
      return
    }
    
    const result = await response.json()
    console.log('📡 Resposta da API:')
    console.log(JSON.stringify(result, null, 2))
    console.log('')
    
    const nfs = result.data || result || []
    console.log(`📋 Total de NFs: ${nfs.length}\n`)
    
    if (nfs.length > 0) {
      const nf = nfs[0]
      console.log(`🔍 Buscando detalhes da NF ${nf.id}...\n`)
      
      const nfResponse = await fetch(`http://localhost:3000/api/notas-fiscais/${nf.id}`)
      
      if (nfResponse.ok) {
        const nfCompleta = await nfResponse.json()
        console.log('📄 NF Completa:')
        console.log(JSON.stringify(nfCompleta, null, 2))
      }
    }
    
    console.log('\n✅ Teste concluído')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

testNFAPI()
