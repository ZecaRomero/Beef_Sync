// Script para verificar se as receptoras prenhas est√£o em Nascimentos
const API_URL = 'http://localhost:3020';

async function verificarReceptorasPrenhasNascimentos() {
  try {
    console.log('≈∏‚Äùç Verificando receptoras prenhas em Nascimentos...\n');
    
    // 1. Buscar receptoras com DG positivo
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    const receptorasPrenhas = animais.filter(a => {
      const resultado = (a.resultado_dg || '').toLowerCase();
      return resultado.includes('pren') || resultado.includes('positiv');
    });
    
    console.log(`≈∏‚Äú≈† Total de receptoras com DG positivo: ${receptorasPrenhas.length}\n`);
    
    if (receptorasPrenhas.length === 0) {
      console.log('‚≈°†Ô∏è Nenhuma receptora com DG positivo encontrada!');
      return;
    }
    
    // 2. Buscar nascimentos
    const responseNascimentos = await fetch(`${API_URL}/api/nascimentos`);
    const dataNascimentos = await responseNascimentos.json();
    const nascimentos = dataNascimentos.data || dataNascimentos || [];
    
    console.log(`≈∏‚Äú≈† Total de registros em Nascimentos: ${nascimentos.length}\n`);
    
    // 3. Verificar quais receptoras prenhas est√£o em Nascimentos
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
        console.log(`‚≈ì‚Ä¶ ${letra} ${numero} - Encontrada em Nascimentos (Data prevista: ${new Date(encontrado.data_nascimento).toLocaleDateString('pt-BR')})`);
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
    
    console.log(`\n≈∏‚ÄúÀÜ Resumo:`);
    console.log(`   ‚≈ì‚Ä¶ Encontradas em Nascimentos: ${encontradas}`);
    console.log(`   ‚ù≈í N√∆íO encontradas em Nascimentos: ${naoEncontradas}`);
    
    if (faltando.length > 0) {
      console.log(`\n‚≈°†Ô∏è Receptoras prenhas que FALTAM em Nascimentos:\n`);
      faltando.forEach(r => {
        console.log(`   - ${r.rg}`);
        console.log(`     Data DG: ${r.dataDG || 'N/A'}`);
        console.log(`     Veterin√°rio: ${r.veterinario || 'N/A'}`);
        console.log(`     Resultado: ${r.resultado || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n≈∏‚Äô° Solu√ß√£o:');
      console.log('   1. Verifique se o DG foi lan√ßado corretamente');
      console.log('   2. Verifique se a data de TE est√° cadastrada');
      console.log('   3. Execute novamente o lan√ßamento de DG para essas receptoras');
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
    console.log('\n≈∏‚Äô° Certifique-se de que o servidor est√° rodando em http://localhost:3020');
  }
}

verificarReceptorasPrenhasNascimentos();
