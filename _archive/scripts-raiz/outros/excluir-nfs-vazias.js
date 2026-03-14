// Script para excluir NFs sem itens via API
const API_URL = 'http://localhost:3020';

async function excluirNFsVazias() {
  try {
    console.log('🔍 Buscando notas fiscais sem itens...\n');
    
    const response = await fetch(`${API_URL}/api/notas-fiscais`);
    const data = await response.json();
    
    const nfs = data.data || data;
    
    if (!Array.isArray(nfs)) {
      console.error('❌ Erro: resposta da API não é um array');
      return;
    }
    
    // Filtrar NFs sem itens E que começam com "AUTO-ENTRADA"
    const nfsSemItens = nfs.filter(nf => {
      const totalItens = parseInt(nf.total_itens) || 0;
      const numeroNF = nf.numero_nf || '';
      return totalItens === 0 && numeroNF.startsWith('AUTO-ENTRADA');
    });
    
    if (nfsSemItens.length === 0) {
      console.log('✅ Não há NFs automáticas vazias para excluir!');
      return;
    }
    
    console.log(`⚠️ Encontradas ${nfsSemItens.length} NFs automáticas SEM itens\n`);
    console.log('🗑️ Iniciando exclusão...\n');
    
    let excluidas = 0;
    let erros = 0;
    
    for (const nf of nfsSemItens) {
      try {
        const deleteResponse = await fetch(`${API_URL}/api/notas-fiscais/${nf.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          excluidas++;
          console.log(`✅ NF ${nf.numero_nf} (ID: ${nf.id}) excluída`);
        } else {
          erros++;
          console.log(`❌ Erro ao excluir NF ${nf.numero_nf} (ID: ${nf.id})`);
        }
      } catch (error) {
        erros++;
        console.log(`❌ Erro ao excluir NF ${nf.numero_nf} (ID: ${nf.id}): ${error.message}`);
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Total de NFs vazias: ${nfsSemItens.length}`);
    console.log(`   Excluídas com sucesso: ${excluidas}`);
    console.log(`   Erros: ${erros}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

excluirNFsVazias();
