const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function createLotesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Criando tabela de lotes...');
    
    // Ler o script SQL
    const sqlPath = path.join(__dirname, 'create-lotes-table.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o script
    await client.query(sqlScript);
    
    console.log('✅ Tabela de lotes criada com sucesso!');
    console.log('📊 Dados de exemplo inseridos');
    console.log('🔍 Índices criados para melhor performance');
    
    // Verificar se a tabela foi criada
    const result = await client.query(`
      SELECT COUNT(*) as total FROM lotes_operacoes
    `);
    
    console.log(`📈 Total de registros na tabela: ${result.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela de lotes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createLotesTable()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { createLotesTable };
