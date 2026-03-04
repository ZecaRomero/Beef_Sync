const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function adicionarCamposNFSaida() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adicionando campos data_saida e motorista na tabela notas_fiscais...');
    
    await client.query(`
      ALTER TABLE notas_fiscais 
      ADD COLUMN IF NOT EXISTS data_saida DATE,
      ADD COLUMN IF NOT EXISTS motorista VARCHAR(255)
    `);
    
    console.log('✅ Campos adicionados com sucesso!');
    console.log('');
    console.log('Campos adicionados:');
    console.log('  - data_saida: Data de saída dos animais (para NF de saída)');
    console.log('  - motorista: Nome do motorista responsável pelo transporte (opcional)');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campos:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

adicionarCamposNFSaida()
  .then(() => {
    console.log('');
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });
