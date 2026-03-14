const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function verificarMortes() {
  console.log('🔍 VERIFICANDO REGISTROS DE MORTES\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar animais com situação "Morto"
    console.log('\n📊 1. Animais com situação "Morto"...');
    const animaisMortos = await pool.query(`
      SELECT id, serie, rg, nome, sexo, situacao, updated_at
      FROM animais 
      WHERE situacao = 'Morto'
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ Total de animais mortos: ${animaisMortos.rows.length}`);
    if (animaisMortos.rows.length > 0) {
      console.log('\n🐄 Animais mortos encontrados:');
      animaisMortos.rows.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.serie}-${a.rg} | ${a.nome || 'Sem nome'} | Atualizado: ${a.updated_at}`);
      });
    } else {
      console.log('⚠️ Nenhum animal com situação "Morto" encontrado');
    }

    // 2. Verificar tabela causas_morte
    console.log('\n📊 2. Registros na tabela causas_morte...');
    const causasMorte = await pool.query(`
      SELECT COUNT(*) as total FROM causas_morte
    `);
    console.log(`✅ Total de registros: ${causasMorte.rows[0].total}`);

    // 3. Verificar se há tabela de histórico de mortes
    console.log('\n📊 3. Verificando outras tabelas relacionadas...');
    const tabelasRelacionadas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%morte%' OR 
        table_name LIKE '%obito%' OR
        table_name LIKE '%death%'
      )
      ORDER BY table_name
    `);
    
    if (tabelasRelacionadas.rows.length > 0) {
      console.log('✅ Tabelas relacionadas a mortes:');
      tabelasRelacionadas.rows.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    } else {
      console.log('⚠️ Nenhuma tabela relacionada a mortes encontrada');
    }

    // 4. Verificar últimas atualizações na tabela animais
    console.log('\n📊 4. Últimas atualizações na tabela animais...');
    const ultimasAtualizacoes = await pool.query(`
      SELECT id, serie, rg, nome, situacao, updated_at
      FROM animais 
      ORDER BY updated_at DESC
      LIMIT 5
    `);
    
    console.log('✅ Últimos 5 animais atualizados:');
    ultimasAtualizacoes.rows.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.serie}-${a.rg} | ${a.situacao} | ${a.updated_at}`);
    });

    // 5. Verificar se há localStorage com dados não sincronizados
    console.log('\n📊 5. Verificando possível dessincronia...');
    console.log('💡 IMPORTANTE: Se você cadastrou a morte recentemente:');
    console.log('   - Verifique se o servidor estava rodando');
    console.log('   - Verifique o console do navegador (F12) por erros');
    console.log('   - Os dados podem estar apenas no localStorage do navegador');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação concluída!');

  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

verificarMortes();
