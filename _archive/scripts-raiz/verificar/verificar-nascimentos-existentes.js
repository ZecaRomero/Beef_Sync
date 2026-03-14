// Script para verificar nascimentos existentes
const API_URL = 'http://localhost:3020';

async function verificarNascimentosExistentes() {
  try {
    console.log('≈∏‚Äùç Verificando nascimentos existentes...\n');
    
    const response = await fetch(`${API_URL}/api/nascimentos?limit=1000`);
    const data = await response.json();
    const nascimentos = data.data || data || [];
    
    console.log(`≈∏‚Äú≈† Total de nascimentos: ${nascimentos.length}\n`);
    
    if (nascimentos.length > 0) {
      console.log('≈∏‚Äú‚Äπ Primeiros 10 registros:\n');
      nascimentos.slice(0, 10).forEach((n, idx) => {
        console.log(`${idx + 1}. Serie: ${n.serie || 'N/A'}, RG: ${n.rg || 'N/A'}, Sexo: ${n.sexo || 'N/A'}, Data: ${n.data_nascimento || 'N/A'}`);
      });
      
      // Agrupar por serie
      const porSerie = nascimentos.reduce((acc, n) => {
        const serie = n.serie || 'Sem Serie';
        acc[serie] = (acc[serie] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n≈∏‚ÄúÀÜ Nascimentos por Serie:`);
      Object.entries(porSerie).forEach(([serie, count]) => {
        console.log(`   ${serie}: ${count}`);
      });
    } else {
      console.log('‚≈°†Ô∏è Nenhum nascimento encontrado!');
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
    console.log('\n≈∏‚Äô° Certifique-se de que o servidor est√° rodando em http://localhost:3020');
  }
}

verificarNascimentosExistentes();
