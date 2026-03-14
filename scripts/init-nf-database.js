const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ConfiguraÃ§Ã£o do banco PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'estoque_semen',
  password: process.env.POSTGRES_PASSWORD || 'jcromero85',
  port: process.env.POSTGRES_PORT || 5432,
});

async function initNFTables() {
  try {
    console.log('ðÅ¸â€�â€” Conectando ao PostgreSQL...');
    
    // Ler e executar o script SQL
    const sqlPath = path.join(__dirname, 'create-nf-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('ðÅ¸â€œÅ  Criando tabelas de Notas Fiscais...');
    await pool.query(sqlContent);
    
    console.log('âÅ“â€¦ Tabelas de Notas Fiscais criadas com sucesso!');
    console.log('ðÅ¸â€œâ€¹ Tabelas criadas:');
    console.log('   - naturezas_operacao');
    console.log('   - fornecedores_clientes');
    console.log('   - notas_fiscais');
    console.log('   - nf_itens');
    console.log('   - historico_movimentacoes');
    
    // Verificar se as tabelas foram criadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('naturezas_operacao', 'fornecedores_clientes', 'notas_fiscais', 'nf_itens', 'historico_movimentacoes')
      ORDER BY table_name
    `);
    
    console.log('ðÅ¸â€œÅ  Tabelas verificadas:', result.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('â�Å’ Erro ao criar tabelas:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initNFTables()
    .then(() => {
      console.log('ðÅ¸Å½â€° InicializaÃ§Ã£o concluÃ­da!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('ðÅ¸â€™¥ Falha na inicializaÃ§Ã£o:', error);
      process.exit(1);
    });
}

module.exports = { initNFTables, pool };
