const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarColunas() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== COLUNAS DA TABELA ANIMAIS ===\n');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      AND column_name LIKE '%te%' OR column_name LIKE '%dg%' OR column_name LIKE '%chegada%'
      ORDER BY column_name
    `);
    
    console.log('Colunas relacionadas a TE, DG e Chegada:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Buscar um exemplo de receptora
    console.log('\n=== EXEMPLO: M 8326 ===\n');
    
    const exemplo = await client.query(`
      SELECT * FROM animais WHERE rg = '8326' LIMIT 1
    `);
    
    if (exemplo.rows.length > 0) {
      const animal = exemplo.rows[0];
      console.log('Campos do animal:');
      Object.keys(animal).forEach(key => {
        if (key.includes('te') || key.includes('dg') || key.includes('chegada') || key.includes('data')) {
          console.log(`  ${key}: ${animal[key]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarColunas();
