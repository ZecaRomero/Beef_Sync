// Script para verificar a contagem atualizada ap√≥s registrar 46 gestantes
const API_URL = 'http://localhost:3020';

async function verificarContagemAtualizada() {
  try {
    console.log('≈∏‚Äú≈† Verificando contagem atualizada de receptoras...\n');
    
    // 1. Buscar todas as receptoras
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    // Filtrar apenas receptoras
    const receptoras = animais.filter(a => 
      (a.raca || '').toLowerCase().includes('receptora') || 
      (a.serie || '').toUpperCase() === 'G'
    );
    
    console.log(`≈∏‚Äú‚Äπ Total de receptoras: ${receptoras.length}\n`);
    
    // 2. Contar por status de DG
    const comDG = receptoras.filter(r => r.data_dg).length;
    const comDGPositivo = receptoras.filter(r => {
      const resultado = (r.resultado_dg || '').toLowerCase();
      return r.data_dg && (resultado.includes('pren') || resultado.includes('positiv'));
    }).length;
    const comDGNegativo = receptoras.filter(r => {
      const resultado = (r.resultado_dg || '').toLowerCase();
      return r.data_dg && (resultado.includes('vaz') || resultado.includes('negativ'));
    }).length;
    const semDG = receptoras.filter(r => !r.data_dg).length;
    
    console.log('≈∏‚ÄúÀÜ Status de DG:\n');
    console.log(`   ‚≈ì‚Ä¶ Com DG realizado: ${comDG}`);
    console.log(`      ≈∏§∞ DG Positivo (Prenhas): ${comDGPositivo}`);
    console.log(`      ‚ù≈í DG Negativo (Vazias): ${comDGNegativo}`);
    console.log(`   ‚è≥ Aguardando DG: ${semDG}\n`);
    
    // 3. Buscar nascimentos (gestantes registradas)
    const responseNascimentos = await fetch(`${API_URL}/api/nascimentos?limit=1000`);
    const dataNascimentos = await responseNascimentos.json();
    const nascimentos = dataNascimentos.data || dataNascimentos || [];
    
    // Filtrar apenas receptoras s√©rie G
    const gestantesRegistradas = nascimentos.filter(n => n.serie === 'G').length;
    
    console.log('≈∏§∞ Gestantes Registradas em Nascimentos:\n');
    console.log(`   Total: ${gestantesRegistradas} receptoras\n`);
    
    // 4. Verifica√ß√£o de consist√™ncia
    console.log('≈∏‚Äùç Verifica√ß√£o de Consist√™ncia:\n');
    
    if (comDGPositivo === gestantesRegistradas) {
      console.log(`   ‚≈ì‚Ä¶ CORRETO: ${comDGPositivo} prenhas = ${gestantesRegistradas} gestantes registradas`);
    } else {
      console.log(`   ‚≈°†Ô∏è ATEN√‚Ä°√∆íO: ${comDGPositivo} prenhas ‚‚Ä∞† ${gestantesRegistradas} gestantes registradas`);
      console.log(`   Diferen√ßa: ${Math.abs(comDGPositivo - gestantesRegistradas)}`);
    }
    
    console.log('\n≈∏‚Äú≈† Resumo Final:\n');
    console.log(`   Total de receptoras: ${receptoras.length}`);
    console.log(`   Com DG positivo (prenhas): ${comDGPositivo}`);
    console.log(`   Aguardando DG: ${semDG}`);
    console.log(`   Gestantes em Nascimentos: ${gestantesRegistradas}`);
    
    if (semDG === 151) {
      console.log('\n‚≈ì‚Ä¶ CONTAGEM CORRETA: 151 receptoras aguardando DG (197 - 46 = 151)');
    } else {
      console.log(`\n‚≈°†Ô∏è Contagem esperada: 151, encontrada: ${semDG}`);
    }
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error.message);
    console.log('\n≈∏‚Äô° Certifique-se de que o servidor est√° rodando em http://localhost:3020');
  }
}

verificarContagemAtualizada();
