const { query } = require('../lib/database');
require('dotenv').config();

async function corrigirGestacao16588() {
  try {
    console.log('🔍 Verificando gestações do animal 16588 (MARCOLINA SANT ANNA)...\n');
    
    // Buscar todas as gestações relacionadas ao animal 16588
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
    
    console.log(`📊 Total de gestações encontradas: ${gestacoes.rows.length}\n`);
    
    if (gestacoes.rows.length === 0) {
      console.log('✅ Nenhuma gestação encontrada para o animal 16588');
      return;
    }
    
    // Mostrar detalhes de cada gestação
    for (const gestacao of gestacoes.rows) {
      console.log(`\n📋 Gestação ID: ${gestacao.id}`);
      console.log(`   Data Cobertura: ${gestacao.data_cobertura}`);
      console.log(`   Situação: ${gestacao.situacao}`);
      console.log(`   Receptora: ${gestacao.receptora_serie} ${gestacao.receptora_rg} - ${gestacao.receptora_nome}`);
      console.log(`   Mãe: ${gestacao.mae_serie} ${gestacao.mae_rg}`);
      console.log(`   Pai: ${gestacao.pai_serie} ${gestacao.pai_rg}`);
      console.log(`   Status: ${gestacao.status_nascimento}`);
      console.log(`   Observações: ${gestacao.observacoes || 'N/A'}`);
    }
    
    // Perguntar se deseja excluir gestações sem nascimento
    console.log('\n\n⚠️  ATENÇÃO: Deseja excluir as gestações SEM nascimento vinculado?');
    console.log('   (Gestações COM nascimento serão mantidas)\n');
    
    const gestacoesParaExcluir = gestacoes.rows.filter(g => g.status_nascimento === 'Sem Nascimento');
    
    if (gestacoesParaExcluir.length === 0) {
      console.log('✅ Todas as gestações têm nascimentos vinculados. Nada a excluir.');
      return;
    }
    
    console.log(`📝 Gestações que serão excluídas: ${gestacoesParaExcluir.length}`);
    gestacoesParaExcluir.forEach(g => {
      console.log(`   - ID ${g.id}: ${g.data_cobertura} (${g.situacao})`);
    });
    
    // Executar exclusão
    console.log('\n🗑️  Excluindo gestações...');
    
    for (const gestacao of gestacoesParaExcluir) {
      await query('DELETE FROM gestacoes WHERE id = $1', [gestacao.id]);
      console.log(`   ✓ Gestação ${gestacao.id} excluída`);
    }
    
    console.log('\n✅ Correção concluída com sucesso!');
    console.log(`   Total excluído: ${gestacoesParaExcluir.length} gestação(ões)`);
    
    // Verificar se ainda há gestações
    const verificacao = await query(`
      SELECT COUNT(*) as total
      FROM gestacoes
      WHERE 
        receptora_rg = '16588' 
        OR mae_rg = '16588'
        OR pai_rg = '16588'
    `);
    
    console.log(`\n📊 Gestações restantes para o animal 16588: ${verificacao.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir gestações:', error);
    throw error;
  }
}

// Executar
corrigirGestacao16588()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
