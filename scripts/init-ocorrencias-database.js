const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variÃ¡veis de ambiente
require('dotenv').config();

// ConfiguraÃ§Ã£o do banco de dados
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'beef_sync',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

console.log('ðÅ¸â€�§ ConfiguraÃ§Ã£o do banco:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || 5432}`);
console.log(`  Database: ${process.env.DB_NAME || 'beef_sync'}`);
console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'nÃ£o definida'}`);
console.log('');

async function initOcorrenciasDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('ðÅ¸â€�â€ž Iniciando criaÃ§Ã£o das tabelas de ocorrÃªncias...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-ocorrencias-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL
    await client.query(sql);
    
    console.log('âÅ“â€¦ Tabelas de ocorrÃªncias criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ocorrencias_animais', 'ocorrencias_servicos')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    
    console.log('ðÅ¸â€œâ€¹ Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar Ã­ndices
    const indexesQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('ocorrencias_animais', 'ocorrencias_servicos')
      AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexResult = await client.query(indexesQuery);
    
    console.log('ðÅ¸â€�� Ã�ndices criados:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname} (${row.tablename})`);
    });
    
    // Testar inserÃ§Ã£o de dados de exemplo (opcional)
    console.log('ðÅ¸§ª Testando inserÃ§Ã£o de dados...');
    
    const testQuery = `
      INSERT INTO ocorrencias_animais (
        nome, rg, sexo, nascimento, observacoes
      ) VALUES (
        'Teste Animal', 'TEST001', 'M', '2023-01-01', 'Registro de teste'
      ) RETURNING id;
    `;
    
    const testResult = await client.query(testQuery);
    const testId = testResult.rows[0].id;
    
    console.log(`âÅ“â€¦ Registro de teste criado com ID: ${testId}`);
    
    // Remover o registro de teste
    await client.query('DELETE FROM ocorrencias_animais WHERE id = $1', [testId]);
    console.log('ðÅ¸â€”â€˜ï¸� Registro de teste removido');
    
    console.log('ðÅ¸Å½â€° InicializaÃ§Ã£o das tabelas de ocorrÃªncias concluÃ­da com sucesso!');
    
  } catch (error) {
    console.error('â�Å’ Erro ao inicializar tabelas de ocorrÃªncias:', error);
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
      console.log('âÅ“â€¦ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('â�Å’ Erro na execuÃ§Ã£o:', error);
      process.exit(1);
    });
}

module.exports = { initOcorrenciasDatabase };