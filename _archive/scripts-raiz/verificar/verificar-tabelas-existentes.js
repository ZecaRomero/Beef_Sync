const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'beef_sync',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function verificarTabelas() {
  try {
    console.log('🔍 Verificando tabelas existentes no banco de dados...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Total de tabelas: ${result.rows.length}\n`);
    console.log('Tabelas encontradas:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Verificar especificamente a tabela nitrogenio
    const checkNitrogenio = result.rows.find(row => row.table_name === 'nitrogenio');
    
    if (checkNitrogenio) {
      console.log('\n✅ Tabela "nitrogenio" EXISTE');
    } else {
      console.log('\n❌ Tabela "nitrogenio" NÃO EXISTE - precisa ser criada!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelas();
