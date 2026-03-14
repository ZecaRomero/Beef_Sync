// Script para verificar se as receptoras prenhas estão em Nascimentos
const API_URL = 'http://localhost:3020';

async function verificarReceptorasPrenhasNascimentos() {
  try {
    console.log('🔍 Verificando receptoras prenhas em Nascimentos...\n');
    
    // 1. Buscar receptoras com DG positivo
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    const receptorasPrenhas = animais.filter(a => {
      const resultado = (a.resultado_dg || '').toLowerCase();
      return resultado.includes('pren') || resultado.includes('positiv');
    });
    
    console.log(`📊 Total de receptoras com DG positivo: ${receptorasPrenhas.length}\n`);
    
    if (receptorasPrenhas.length === 0) {
      console.log('⚠️ Nenhuma receptora com DG positivo encontrada!');
      return;
    }
    
    // 2. Buscar nascimentos
    const responseNascimentos = await fetch(`${API_URL}/api/nascimentos`);
    const dataNascimentos = await responseNascimentos.json();
    const nascimentos = dataNascimentos.data || dataNascimentos || [];
    
    console.log(`📊 Total de registros em Nascimentos: ${nascimentos.length}\n`);
    
    // 3. Verificar quais receptoras prenhas estão em Nascimentos
    let encontradas = 0;
    let naoEncontradas = 0;
    const faltando = [];
    
    receptorasPrenhas.forEach(r => {
      const letra = r.serie || '';
      const numero = r.rg || '';
      const encontrado = nascimentos.find(n => {
        return n.serie === letra && n.rg === numero;
      });
      
      if (encontrado) {
        encontradas++;
        console.log(`✅ ${letra} ${numero} - Encontrada em Nascimentos (Data prevista: ${new Date(encontrado.data_nascimento).toLocaleDateString('pt-BR')})`);
      } else {
        naoEncontradas++;
        faltando.push({
          rg: `${letra} ${numero}`,
          dataDG: r.data_dg,
          veterinario: r.veterinario_dg,
          resultado: r.resultado_dg
        });
      }
    });
    
    console.log(`\n📈 Resumo:`);
    console.log(`   ✅ Encontradas em Nascimentos: ${encontradas}`);
    console.log(`   ❌ NÃO encontradas em Nascimentos: ${naoEncontradas}`);
    
    if (faltando.length > 0) {
      console.log(`\n⚠️ Receptoras prenhas que FALTAM em Nascimentos:\n`);
      faltando.forEach(r => {
        console.log(`   - ${r.rg}`);
        console.log(`     Data DG: ${r.dataDG || 'N/A'}`);
        console.log(`     Veterinário: ${r.veterinario || 'N/A'}`);
        console.log(`     Resultado: ${r.resultado || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n💡 Solução:');
      console.log('   1. Verifique se o DG foi lançado corretamente');
      console.log('   2. Verifique se a data de TE está cadastrada');
      console.log('   3. Execute novamente o lançamento de DG para essas receptoras');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

verificarReceptorasPrenhasNascimentos();
