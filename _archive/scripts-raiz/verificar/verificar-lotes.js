const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function verificarLotes() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== ESTRUTURA DA TABELA LOTES ===\n');
    
    const colunas = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lotes'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas:');
    colunas.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n=== SAMPLE DE LOTES ===\n');
    
    const sample = await client.query(`
      SELECT * FROM lotes 
      ORDER BY id DESC 
      LIMIT 2
    `);
    
    if (sample.rows.length > 0) {
      console.log('Exemplo:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
    console.log('\n=== BUSCANDO LOTES COM NF 2141 ===\n');
    
    const lotes2141 = await client.query(`
      SELECT * FROM lotes 
      WHERE nf_origem = '2141'
    `);
    
    console.log(`Total: ${lotes2141.rows.length}\n`);
    
    if (lotes2141.rows.length > 0) {
      lotes2141.rows.forEach(lote => {
        console.log(`Lote ID: ${lote.id} | Letra: ${lote.letra_receptora} | Números: ${lote.numeros_receptoras}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarLotes();
