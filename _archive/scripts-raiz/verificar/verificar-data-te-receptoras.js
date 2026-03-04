// Script para verificar se as receptoras prenhas têm data_te nas NFs
const API_URL = 'http://localhost:3020';

async function verificarDataTE() {
  try {
    console.log('🔍 Verificando data_te das receptoras prenhas...\n');
    
    // 1. Buscar receptoras com DG positivo
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    const receptorasPrenhas = animais.filter(a => {
      const resultado = (a.resultado_dg || '').toLowerCase();
      return resultado.includes('pren') || resultado.includes('positiv');
    });
    
    console.log(`📊 Total de receptoras com DG positivo: ${receptorasPrenhas.length}\n`);
    
    // 2. Buscar notas fiscais
    const responseNFs = await fetch(`${API_URL}/api/notas-fiscais`);
    const dataNFs = await responseNFs.json();
    const nfs = dataNFs.data || dataNFs || [];
    
    console.log(`📄 Total de NFs: ${nfs.length}\n`);
    
    // 3. Verificar data_te para cada receptora
    let comDataTE = 0;
    let semDataTE = 0;
    
    console.log('📋 Análise detalhada:\n');
    
    for (const receptora of receptorasPrenhas) {
      const letra = receptora.serie || '';
      const numero = receptora.rg || '';
      const rgCompleto = `${letra} ${numero}`.trim();
      
      // Buscar NF desta receptora
      const nfReceptora = nfs.find(nf => {
        // Verificar se é NF de receptoras
        if (!nf.eh_receptoras) return false;
        
        // Verificar itens da NF
        const itens = nf.itens || [];
        return itens.some(item => {
          const itemLetra = (item.letra || item.serie || '').trim();
          const itemNumero = String(item.numero || item.rg || '').trim();
          return itemLetra === letra && itemNumero === numero;
        });
      });
      
      if (nfReceptora) {
        if (nfReceptora.data_te) {
          console.log(`✅ ${rgCompleto} - NF ${nfReceptora.numero_nf} - Data TE: ${new Date(nfReceptora.data_te).toLocaleDateString('pt-BR')}`);
          comDataTE++;
        } else {
          console.log(`⚠️ ${rgCompleto} - NF ${nfReceptora.numero_nf} - SEM data_te`);
          semDataTE++;
        }
      } else {
        console.log(`❌ ${rgCompleto} - NF não encontrada`);
        semDataTE++;
      }
    }
    
    console.log(`\n📈 Resumo:`);
    console.log(`   ✅ Com data_te: ${comDataTE}`);
    console.log(`   ❌ Sem data_te: ${semDataTE}`);
    
    if (semDataTE > 0) {
      console.log(`\n💡 Solução:`);
      console.log(`   1. Adicione a data_te nas NFs de receptoras`);
      console.log(`   2. Ou use a data_chegada como fallback para calcular o parto previsto`);
      console.log(`   3. Ou permita registro em Nascimentos sem data prevista de parto`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

verificarDataTE();
