const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85',
});

async function diagnosticar() {
  console.log('🔍 DIAGNOSTICANDO PROBLEMA DOS ANIMAIS\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar se a tabela existe
    console.log('\n📊 1. Verificando tabela animais...');
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'animais'
      )
    `);
    
    if (!tabelaExiste.rows[0].exists) {
      console.log('❌ Tabela animais NÃO EXISTE!');
      return;
    }
    console.log('✅ Tabela animais existe');

    // 2. Contar registros
    console.log('\n📊 2. Contando registros...');
    const count = await pool.query('SELECT COUNT(*) FROM animais');
    console.log(`✅ Total de animais: ${count.rows[0].count}`);

    // 3. Buscar primeiros 5 animais
    console.log('\n📊 3. Buscando primeiros 5 animais...');
    const animais = await pool.query(`
      SELECT id, serie, rg, nome, sexo, raca, situacao, data_nascimento
      FROM animais 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log(`✅ Encontrados ${animais.rows.length} animais:`);
    animais.rows.forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.serie}-${a.rg} | ${a.nome || 'Sem nome'} | ${a.sexo} | ${a.raca}`);
    });

    // 4. Testar query da API
    console.log('\n📊 4. Testando query da API...');
    const apiQuery = `
      SELECT a.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', c.id,
                   'tipo', c.tipo,
                   'subtipo', c.subtipo,
                   'valor', c.valor,
                   'data', c.data,
                   'observacoes', c.observacoes,
                   'detalhes', c.detalhes
                 ) ORDER BY c.data DESC
               ) FILTER (WHERE c.id IS NOT NULL), 
               '[]'::json
             ) as custos
      FROM animais a
      LEFT JOIN custos c ON a.id = c.animal_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `;
    
    const apiResult = await pool.query(apiQuery);
    console.log(`✅ Query da API retornou ${apiResult.rows.length} animais`);
    
    if (apiResult.rows.length > 0) {
      const primeiro = apiResult.rows[0];
      console.log(`   Primeiro animal: ${primeiro.serie}-${primeiro.rg}`);
      console.log(`   Custos: ${Array.isArray(primeiro.custos) ? primeiro.custos.length : 0} registros`);
    }

    // 5. Verificar se há problemas de encoding
    console.log('\n📊 5. Verificando encoding...');
    const encoding = await pool.query('SHOW client_encoding');
    console.log(`✅ Encoding do cliente: ${encoding.rows[0].client_encoding}`);

    // 6. Verificar conexões ativas
    console.log('\n📊 6. Verificando conexões...');
    const connections = await pool.query(`
      SELECT count(*) as total, state 
      FROM pg_stat_activity 
      WHERE datname = 'beef_sync' 
      GROUP BY state
    `);
    console.log('✅ Conexões ativas:');
    connections.rows.forEach(c => {
      console.log(`   - ${c.state}: ${c.total}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico concluído!\n');
    console.log('💡 CONCLUSÃO:');
    console.log(`   - Tabela existe: SIM`);
    console.log(`   - Total de animais: ${count.rows[0].count}`);
    console.log(`   - Query da API funciona: ${apiResult.rows.length > 0 ? 'SIM' : 'NÃO'}`);
    console.log('\n📝 Se os animais não aparecem no navegador:');
    console.log('   1. Verifique o console do navegador (F12)');
    console.log('   2. Verifique se há erros de CORS');
    console.log('   3. Verifique se o servidor está rodando');
    console.log('   4. Tente recarregar a página (Ctrl+F5)');

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error);
    console.error('Detalhes:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticar();
