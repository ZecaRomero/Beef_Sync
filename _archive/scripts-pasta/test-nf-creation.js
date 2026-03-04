// Script para testar criação de nota fiscal
const testNFData = {
  numeroNF: 'NF-TEST-001',
  data: new Date().toISOString().split('T')[0],
  tipo: 'entrada',
  fornecedor: 'Fazenda Teste',
  destino: null,
  naturezaOperacao: 'Compra de bovinos para teste',
  valorTotal: 15000.00,
  tipoProduto: 'bovino',
  itens: [
    {
      tatuagem: 'TEST001',
      sexo: 'M',
      raca: 'Nelore',
      peso: 450,
      valorUnitario: 15000.00
    }
  ],
  observacoes: 'Nota fiscal de teste criada automaticamente'
}

// Testar API POST
fetch('http://localhost:3020/api/notas-fiscais', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testNFData)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Nota fiscal criada com sucesso:', data)
  
  // Testar API GET para verificar se foi salva
  return fetch('http://localhost:3020/api/notas-fiscais')
})
.then(response => response.json())
.then(nfs => {
  console.log('📋 Notas fiscais no PostgreSQL:', nfs)
  console.log(`📊 Total: ${nfs.length} nota(s)`)
})
.catch(error => {
  console.error('❌ Erro ao criar nota fiscal:', error)
})
