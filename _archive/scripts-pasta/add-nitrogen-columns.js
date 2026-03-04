const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function addNitrogenColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adicionando colunas valor_unitario e valor_total à tabela abastecimento_nitrogenio...');
    
    // Adicionar coluna valor_unitario
    await client.query(`
      ALTER TABLE abastecimento_nitrogenio 
      ADD COLUMN IF NOT EXISTS valor_unitario DECIMAL(8,2) DEFAULT 0
    `);
    
    // Adicionar coluna valor_total
    await client.query(`
      ALTER TABLE abastecimento_nitrogenio 
      ADD COLUMN IF NOT EXISTS valor_total DECIMAL(12,2) DEFAULT 0
    `);
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Verificar se as colunas foram criadas
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'abastecimento_nitrogenio'
      AND column_name IN ('valor_unitario', 'valor_total')
      ORDER BY column_name
    `);
    
    console.log('📋 Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addNitrogenColumns();
    console.log('🎉 Script executado com sucesso!');
  } catch (error) {
    console.error('💥 Erro na execução:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { addNitrogenColumns };