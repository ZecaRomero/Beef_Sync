// Script para verificar NFs sem itens via API
const API_URL = 'http://localhost:3020';

async function verificarNFsSemItens() {
  try {
    console.log('🔍 Buscando notas fiscais...\n');
    
    const response = await fetch(`${API_URL}/api/notas-fiscais`);
    const data = await response.json();
    
    const nfs = data.data || data;
    
    if (!Array.isArray(nfs)) {
      console.error('❌ Erro: resposta da API não é um array');
      return;
    }
    
    console.log(`📊 Total de NFs: ${nfs.length}\n`);
    
    // Filtrar NFs sem itens
    const nfsSemItens = nfs.filter(nf => {
      const totalItens = parseInt(nf.total_itens) || 0;
      return totalItens === 0;
    });
    
    if (nfsSemItens.length === 0) {
      console.log('✅ Todas as notas fiscais têm itens cadastrados!');
    } else {
      console.log(`⚠️ Encontradas ${nfsSemItens.length} notas fiscais SEM itens:\n`);
      
      nfsSemItens.forEach(nf => {
        console.log(`📋 NF ${nf.numero_nf} (${nf.tipo})`);
        console.log(`   ID: ${nf.id}`);
        console.log(`   Data: ${nf.data}`);
        console.log(`   Tipo Produto: ${nf.tipo_produto}`);
        console.log(`   ${nf.tipo === 'entrada' ? 'Fornecedor' : 'Destino'}: ${nf.fornecedor || nf.destino || 'N/A'}`);
        console.log(`   Valor Total: R$ ${parseFloat(nf.valor_total || 0).toFixed(2)}`);
        console.log(`   Total de Itens: ${nf.total_itens || 0}`);
        console.log('');
      });
      
      console.log('\n💡 Essas notas fiscais foram criadas mas não têm itens associados.');
      console.log('   Você pode:');
      console.log('   1. Editar cada NF e adicionar os itens manualmente');
      console.log('   2. Excluir as NFs vazias se não forem mais necessárias\n');
      
      // Mostrar IDs para facilitar exclusão
      const ids = nfsSemItens.map(nf => nf.id).join(', ');
      console.log(`📝 IDs das NFs sem itens: ${ids}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

verificarNFsSemItens();
