const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estrutura da tabela estoque_semen...');
    
    // Verificar colunas da tabela
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'estoque_semen' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Colunas encontradas:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar alguns registros
    const sample = await client.query('SELECT * FROM estoque_semen LIMIT 3');
    console.log('\n📊 Registros de exemplo:');
    console.log(sample.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTableStructure();