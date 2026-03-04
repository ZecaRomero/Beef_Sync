const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarContagemNF240() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO CONTAGEM DA NF 240\n');
    console.log('='.repeat(80));
    
    // 1. Contar itens na tabela notas_fiscais_itens
    const itensResult = await client.query(`
      SELECT COUNT(*) as total
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = (SELECT id FROM notas_fiscais WHERE numero_nf = '240')
    `);
    
    console.log(`📦 Itens na tabela notas_fiscais_itens: ${itensResult.rows[0].total}`);
    
    // 2. Simular a query da API receptoras/lista-dg
    const apiResult = await client.query(`
      SELECT 
        nf.numero_nf,
        COUNT(item.id) as total_itens
      FROM notas_fiscais nf
      INNER JOIN notas_fiscais_itens item ON item.nota_fiscal_id = nf.id
      WHERE nf.eh_receptoras = true
        AND nf.tipo = 'entrada'
        AND (item.tipo_produto = 'bovino' OR item.tipo_produto IS NULL)
        AND nf.numero_nf = '240'
      GROUP BY nf.numero_nf
    `);
    
    console.log(`📋 Itens retornados pela API: ${apiResult.rows[0]?.total_itens || 0}`);
    
    // 3. Verificar se há itens duplicados
    const duplicadosResult = await client.query(`
      SELECT 
        dados_item->>'tatuagem' as tatuagem,
        COUNT(*) as quantidade
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = (SELECT id FROM notas_fiscais WHERE numero_nf = '240')
      GROUP BY dados_item->>'tatuagem'
      HAVING COUNT(*) > 1
    `);
    
    if (duplicadosResult.rows.length > 0) {
      console.log(`\n⚠️ ITENS DUPLICADOS ENCONTRADOS:`);
      duplicadosResult.rows.forEach(dup => {
        console.log(`   ${dup.tatuagem}: ${dup.quantidade} vezes`);
      });
    } else {
      console.log(`\n✅ Nenhum item duplicado`);
    }
    
    // 4. Listar todas as tatuagens
    const tatuagensResult = await client.query(`
      SELECT 
        id,
        dados_item->>'tatuagem' as tatuagem
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = (SELECT id FROM notas_fiscais WHERE numero_nf = '240')
      ORDER BY id
    `);
    
    console.log(`\n📝 LISTA DE TATUAGENS (${tatuagensResult.rows.length} itens):\n`);
    tatuagensResult.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.tatuagem} (ID: ${row.id})`);
    });
    
    // 5. Verificar se a API está filtrando algum item
    const todosItensResult = await client.query(`
      SELECT 
        id,
        tipo_produto,
        dados_item->>'tatuagem' as tatuagem
      FROM notas_fiscais_itens
      WHERE nota_fiscal_id = (SELECT id FROM notas_fiscais WHERE numero_nf = '240')
      AND (tipo_produto != 'bovino' AND tipo_produto IS NOT NULL)
    `);
    
    if (todosItensResult.rows.length > 0) {
      console.log(`\n⚠️ ITENS COM TIPO DIFERENTE DE BOVINO:`);
      todosItensResult.rows.forEach(item => {
        console.log(`   ${item.tatuagem}: tipo_produto = ${item.tipo_produto}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarContagemNF240();
