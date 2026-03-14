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
    console.log('🔍 ESTRUTURA DA TABELA notas_fiscais:\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notas_fiscais'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarEstrutura();
