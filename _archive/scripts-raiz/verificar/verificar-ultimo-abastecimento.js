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

async function verificarUltimoAbastecimento() {
  try {
    console.log('🔍 Verificando últimos abastecimentos no banco de dados...\n');
    
    // Buscar os últimos 5 abastecimentos
    const result = await pool.query(`
      SELECT 
        id,
        data,
        quantidade,
        valor_unitario,
        valor_total,
        motorista,
        proximo_abastecimento,
        status,
        created_at
      FROM abastecimento_nitrogenio 
      ORDER BY data DESC, created_at DESC 
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum abastecimento encontrado no banco de dados!');
      return;
    }
    
    console.log(`✅ Encontrados ${result.rows.length} abastecimento(s):\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`--- Abastecimento ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Data: ${new Date(row.data).toLocaleDateString('pt-BR')}`);
      console.log(`Quantidade: ${row.quantidade}L`);
      console.log(`Valor Unitário: R$ ${parseFloat(row.valor_unitario).toFixed(2)}`);
      console.log(`Valor Total: R$ ${parseFloat(row.valor_total).toFixed(2)}`);
      console.log(`Motorista: ${row.motorista || 'Não informado'}`);
      console.log(`Próximo Abastecimento: ${row.proximo_abastecimento ? new Date(row.proximo_abastecimento).toLocaleDateString('pt-BR') : 'Não definido'}`);
      console.log(`Status: ${row.status || 'Não definido'}`);
      console.log(`Criado em: ${new Date(row.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // Verificar o total de abastecimentos
    const countResult = await pool.query('SELECT COUNT(*) as total FROM abastecimento_nitrogenio');
    console.log(`📊 Total de abastecimentos no banco: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar abastecimentos:', error.message);
  } finally {
    await pool.end();
  }
}

verificarUltimoAbastecimento();
