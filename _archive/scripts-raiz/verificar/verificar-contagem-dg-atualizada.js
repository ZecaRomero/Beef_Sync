// Script para verificar a contagem atualizada após registrar 46 gestantes
const API_URL = 'http://localhost:3020';

async function verificarContagemAtualizada() {
  try {
    console.log('📊 Verificando contagem atualizada de receptoras...\n');
    
    // 1. Buscar todas as receptoras
    const responseAnimais = await fetch(`${API_URL}/api/animals`);
    const dataAnimais = await responseAnimais.json();
    const animais = dataAnimais.data || dataAnimais || [];
    
    // Filtrar apenas receptoras
    const receptoras = animais.filter(a => 
      (a.raca || '').toLowerCase().includes('receptora') || 
      (a.serie || '').toUpperCase() === 'G'
    );
    
    console.log(`📋 Total de receptoras: ${receptoras.length}\n`);
    
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
    
    console.log('📈 Status de DG:\n');
    console.log(`   ✅ Com DG realizado: ${comDG}`);
    console.log(`      🤰 DG Positivo (Prenhas): ${comDGPositivo}`);
    console.log(`      ❌ DG Negativo (Vazias): ${comDGNegativo}`);
    console.log(`   ⏳ Aguardando DG: ${semDG}\n`);
    
    // 3. Buscar nascimentos (gestantes registradas)
    const responseNascimentos = await fetch(`${API_URL}/api/nascimentos?limit=1000`);
    const dataNascimentos = await responseNascimentos.json();
    const nascimentos = dataNascimentos.data || dataNascimentos || [];
    
    // Filtrar apenas receptoras série G
    const gestantesRegistradas = nascimentos.filter(n => n.serie === 'G').length;
    
    console.log('🤰 Gestantes Registradas em Nascimentos:\n');
    console.log(`   Total: ${gestantesRegistradas} receptoras\n`);
    
    // 4. Verificação de consistência
    console.log('🔍 Verificação de Consistência:\n');
    
    if (comDGPositivo === gestantesRegistradas) {
      console.log(`   ✅ CORRETO: ${comDGPositivo} prenhas = ${gestantesRegistradas} gestantes registradas`);
    } else {
      console.log(`   ⚠️ ATENÇÃO: ${comDGPositivo} prenhas ≠ ${gestantesRegistradas} gestantes registradas`);
      console.log(`   Diferença: ${Math.abs(comDGPositivo - gestantesRegistradas)}`);
    }
    
    console.log('\n📊 Resumo Final:\n');
    console.log(`   Total de receptoras: ${receptoras.length}`);
    console.log(`   Com DG positivo (prenhas): ${comDGPositivo}`);
    console.log(`   Aguardando DG: ${semDG}`);
    console.log(`   Gestantes em Nascimentos: ${gestantesRegistradas}`);
    
    if (semDG === 151) {
      console.log('\n✅ CONTAGEM CORRETA: 151 receptoras aguardando DG (197 - 46 = 151)');
    } else {
      console.log(`\n⚠️ Contagem esperada: 151, encontrada: ${semDG}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando em http://localhost:3020');
  }
}

verificarContagemAtualizada();
