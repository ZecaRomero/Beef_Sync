const databaseService = require('./services/databaseService.js');

async function testarAnimais() {
  try {
    console.log('🔍 Testando busca de animais...');
    
    // Buscar todos os animais
    const todosAnimais = await databaseService.buscarAnimais();
    console.log('📊 Total de animais no banco:', todosAnimais.length);
    
    // Buscar animais da série BENT
    const animaisBent = await databaseService.buscarAnimais({ serie: 'BENT' });
    console.log('🐄 Animais da série BENT:', animaisBent.length);
    
    if (animaisBent.length > 0) {
      console.log('✅ Primeiros 3 animais BENT encontrados:');
      animaisBent.slice(0, 3).forEach((animal, i) => {
        console.log(`  ${i+1}. ${animal.serie}-${animal.rg} (${animal.sexo}) - ${animal.situacao}`);
      });
    } else {
      console.log('❌ Nenhum animal da série BENT encontrado!');
      
      // Verificar se há animais com série similar
      const todasSeries = await databaseService.query('SELECT DISTINCT serie FROM animais ORDER BY serie');
      console.log('📋 Séries disponíveis no banco:');
      todasSeries.rows.forEach(row => {
        console.log(`  - ${row.serie}`);
      });
      
      // Verificar últimos animais cadastrados
      const ultimosAnimais = await databaseService.query(`
        SELECT serie, rg, sexo, situacao, created_at 
        FROM animais 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      console.log('📅 Últimos 10 animais cadastrados:');
      ultimosAnimais.rows.forEach((animal, i) => {
        console.log(`  ${i+1}. ${animal.serie}-${animal.rg} (${animal.sexo}) - ${animal.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
    console.error('Stack:', error.stack);
  }
}

testarAnimais();