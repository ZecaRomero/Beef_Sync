const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
});

async function createNitrogenioTable() {
  try {
    console.log('ðÅ¸â€�§ Criando tabela abastecimento_nitrogenio...');
    
    // Ler o arquivo SQL
    const sql = fs.readFileSync('CREATE_NITROGENIO_TABLE.sql', 'utf8');
    
    // Executar o SQL
    await pool.query(sql);
    
    console.log('âÅ“â€¦ Tabela abastecimento_nitrogenio criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM abastecimento_nitrogenio
    `);
    
    console.log(`ðÅ¸â€œÅ  Registros na tabela: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('â�Å’ Erro ao criar tabela:', error.message);
  } finally {
    await pool.end();
  }
}

createNitrogenioTable();
