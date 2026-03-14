const { query } = require('../lib/database');
require('dotenv').config();

async function corrigirGestacao16588() {
  try {
    console.log('ðÅ¸â€�� Verificando gestaÃ§Ãµes do animal 16588 (MARCOLINA SANT ANNA)...\n');
    
    // Buscar todas as gestaÃ§Ãµes relacionadas ao animal 16588
    const gestacoes = await query(`
      SELECT 
        g.*,
        CASE 
          WHEN n.id IS NOT NULL THEN 'Com Nascimento'
          ELSE 'Sem Nascimento'
        END as status_nascimento
      FROM gestacoes g
      LEFT JOIN nascimentos n ON n.gestacao_id = g.id
      WHERE 
        g.receptora_rg = '16588' 
        OR g.mae_rg = '16588'
        OR g.pai_rg = '16588'
      ORDER BY g.data_cobertura DESC
    `);
    
    console.log(`ðÅ¸â€œÅ  Total de gestaÃ§Ãµes encontradas: ${gestacoes.rows.length}\n`);
    
    if (gestacoes.rows.length === 0) {
      console.log('âÅ“â€¦ Nenhuma gestaÃ§Ã£o encontrada para o animal 16588');
      return;
    }
    
    // Mostrar detalhes de cada gestaÃ§Ã£o
    for (const gestacao of gestacoes.rows) {
      console.log(`\nðÅ¸â€œâ€¹ GestaÃ§Ã£o ID: ${gestacao.id}`);
      console.log(`   Data Cobertura: ${gestacao.data_cobertura}`);
      console.log(`   SituaÃ§Ã£o: ${gestacao.situacao}`);
      console.log(`   Receptora: ${gestacao.receptora_serie} ${gestacao.receptora_rg} - ${gestacao.receptora_nome}`);
      console.log(`   MÃ£e: ${gestacao.mae_serie} ${gestacao.mae_rg}`);
      console.log(`   Pai: ${gestacao.pai_serie} ${gestacao.pai_rg}`);
      console.log(`   Status: ${gestacao.status_nascimento}`);
      console.log(`   ObservaÃ§Ãµes: ${gestacao.observacoes || 'N/A'}`);
    }
    
    // Perguntar se deseja excluir gestaÃ§Ãµes sem nascimento
    console.log('\n\nâÅ¡ ï¸�  ATENÃâ€¡ÃÆ’O: Deseja excluir as gestaÃ§Ãµes SEM nascimento vinculado?');
    console.log('   (GestaÃ§Ãµes COM nascimento serÃ£o mantidas)\n');
    
    const gestacoesParaExcluir = gestacoes.rows.filter(g => g.status_nascimento === 'Sem Nascimento');
    
    if (gestacoesParaExcluir.length === 0) {
      console.log('âÅ“â€¦ Todas as gestaÃ§Ãµes tÃªm nascimentos vinculados. Nada a excluir.');
      return;
    }
    
    console.log(`ðÅ¸â€œ� GestaÃ§Ãµes que serÃ£o excluÃ­das: ${gestacoesParaExcluir.length}`);
    gestacoesParaExcluir.forEach(g => {
      console.log(`   - ID ${g.id}: ${g.data_cobertura} (${g.situacao})`);
    });
    
    // Executar exclusÃ£o
    console.log('\nðÅ¸â€”â€˜ï¸�  Excluindo gestaÃ§Ãµes...');
    
    for (const gestacao of gestacoesParaExcluir) {
      await query('DELETE FROM gestacoes WHERE id = $1', [gestacao.id]);
      console.log(`   âÅ“â€œ GestaÃ§Ã£o ${gestacao.id} excluÃ­da`);
    }
    
    console.log('\nâÅ“â€¦ CorreÃ§Ã£o concluÃ­da com sucesso!');
    console.log(`   Total excluÃ­do: ${gestacoesParaExcluir.length} gestaÃ§Ã£o(Ãµes)`);
    
    // Verificar se ainda hÃ¡ gestaÃ§Ãµes
    const verificacao = await query(`
      SELECT COUNT(*) as total
      FROM gestacoes
      WHERE 
        receptora_rg = '16588' 
        OR mae_rg = '16588'
        OR pai_rg = '16588'
    `);
    
    console.log(`\nðÅ¸â€œÅ  GestaÃ§Ãµes restantes para o animal 16588: ${verificacao.rows[0].total}`);
    
  } catch (error) {
    console.error('â�Å’ Erro ao corrigir gestaÃ§Ãµes:', error);
    throw error;
  }
}

// Executar
corrigirGestacao16588()
  .then(() => {
    console.log('\nâÅ“â€¦ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nâ�Å’ Erro fatal:', error);
    process.exit(1);
  });
