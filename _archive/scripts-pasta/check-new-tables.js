const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando tabelas criadas...');
    
    // Verificar se as tabelas existem
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('entradas_semen', 'saidas_semen')
    `);
    
    console.log('📋 Tabelas encontradas:', tables.rows.map(r => r.table_name));
    
    // Verificar estrutura das tabelas se existirem
    for (const table of tables.rows) {
      console.log(`\n📊 Estrutura da tabela ${table.table_name}:`);
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();