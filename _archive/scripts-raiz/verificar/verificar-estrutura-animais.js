const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarEstrutura() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== ESTRUTURA DA TABELA ANIMAIS ===\n');
    
    const colunas = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela animais:');
    colunas.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n=== SAMPLE DE ANIMAIS ===\n');
    
    const sample = await client.query(`
      SELECT * FROM animais 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    if (sample.rows.length > 0) {
      console.log('Exemplo de animal:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    console.log('\n=== VERIFICANDO TABELAS RELACIONADAS ===\n');
    
    const tabelas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Todas as tabelas:');
    tabelas.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarEstrutura();
