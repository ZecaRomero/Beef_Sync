const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function testarEstrutura() {
  const client = await pool.connect();
  
  try {
    console.log('�Ÿ”� VERIFICANDO ESTRUTURA DE PIQUETES\n');
    console.log('='.repeat(80));
    
    // Verificar tabela piquetes
    const piquetes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'piquetes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n�Ÿ“‹ Estrutura da tabela PIQUETES:');
    console.log('-'.repeat(80));
    piquetes.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar colunas adicionadas em animais
    const animaisCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'animais' 
        AND column_name IN ('piquete_atual', 'data_entrada_piquete')
      ORDER BY ordinal_position
    `);
    
    console.log('\n�Ÿ“‹ Colunas de piquete na tabela ANIMAIS:');
    console.log('-'.repeat(80));
    if (animaisCols.rows.length > 0) {
      animaisCols.rows.forEach(col => {
        console.log(`  ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('  �Œ Colunas não encontradas');
    }
    
    // Verificar índices
    const indices = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('piquetes', 'animais')
        AND indexname LIKE '%piquete%'
    `);
    
    console.log('\n�Ÿ“‹ Índices relacionados a piquetes:');
    console.log('-'.repeat(80));
    if (indices.rows.length > 0) {
      indices.rows.forEach(idx => {
        console.log(`  ${idx.indexname}`);
        console.log(`    ${idx.indexdef}`);
      });
    } else {
      console.log('  �„�️ Nenhum índice específico encontrado');
    }
    
    // Contar piquetes existentes
    const countPiquetes = await client.query('SELECT COUNT(*) as total FROM piquetes');
    console.log(`\n�Ÿ“Š Total de piquetes cadastrados: ${countPiquetes.rows[0].total}`);
    
    // Contar animais com piquete
    const countAnimaisComPiquete = await client.query(`
      SELECT COUNT(*) as total 
      FROM animais 
      WHERE piquete_atual IS NOT NULL
    `);
    console.log(`�Ÿ“Š Animais com piquete definido: ${countAnimaisComPiquete.rows[0].total}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n�œ… Estrutura verificada com sucesso!');
    console.log('\n�Ÿ’� Próximos passos:');
    console.log('   1. Acesse http://localhost:3000/importar-piquetes');
    console.log('   2. Selecione um arquivo Excel com os dados');
    console.log('   3. Clique em "Importar Dados"');
    
  } catch (error) {
    console.error('�Œ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testarEstrutura();
