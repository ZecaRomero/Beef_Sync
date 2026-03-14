const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

console.log('🔧 Configuração do banco:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  Database: ${process.env.DB_NAME || 'beef_sync'}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'não definida'}`);
console.log('');

async function initOcorrenciasDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando criação das tabelas de ocorrências...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-ocorrencias-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL
    await client.query(sql);
    
    console.log('✅ Tabelas de ocorrências criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ocorrencias_animais', 'ocorrencias_servicos')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    
    console.log('📋 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar índices
    const indexesQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('ocorrencias_animais', 'ocorrencias_servicos')
      AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexResult = await client.query(indexesQuery);
    
    console.log('🔍 Índices criados:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname} (${row.tablename})`);
    });
    
    // Testar inserção de dados de exemplo (opcional)
    console.log('🧪 Testando inserção de dados...');
    
    const testQuery = `
      INSERT INTO ocorrencias_animais (
        nome, rg, sexo, nascimento, observacoes
      ) VALUES (
        'Teste Animal', 'TEST001', 'M', '2023-01-01', 'Registro de teste'
      ) RETURNING id;
    `;
    
    const testResult = await client.query(testQuery);
    const testId = testResult.rows[0].id;
    
    console.log(`✅ Registro de teste criado com ID: ${testId}`);
    
    // Remover o registro de teste
    await client.query('DELETE FROM ocorrencias_animais WHERE id = $1', [testId]);
    console.log('🗑️ Registro de teste removido');
    
    console.log('🎉 Inicialização das tabelas de ocorrências concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar tabelas de ocorrências:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initOcorrenciasDatabase()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { initOcorrenciasDatabase };