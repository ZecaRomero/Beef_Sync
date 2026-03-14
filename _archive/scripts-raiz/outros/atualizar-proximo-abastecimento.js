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

async function atualizarProximoAbastecimento() {
  try {
    console.log('🔄 Atualizando próximo abastecimento...\n');
    
    // Buscar o último abastecimento
    const ultimoResult = await pool.query(`
      SELECT id, data_abastecimento, quantidade_litros
      FROM abastecimento_nitrogenio 
      ORDER BY data_abastecimento DESC 
      LIMIT 1
    `);
    
    if (ultimoResult.rows.length === 0) {
      console.log('❌ Nenhum abastecimento encontrado!');
      return;
    }
    
    const ultimo = ultimoResult.rows[0];
    const dataAbastecimento = new Date(ultimo.data_abastecimento);
    
    // Calcular próximo abastecimento (30 dias depois)
    const proximoAbastecimento = new Date(dataAbastecimento);
    proximoAbastecimento.setDate(proximoAbastecimento.getDate() + 30);
    
    console.log(`📅 Último abastecimento: ${dataAbastecimento.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Próximo abastecimento: ${proximoAbastecimento.toLocaleDateString('pt-BR')}\n`);
    
    // Atualizar o registro
    const updateResult = await pool.query(`
      UPDATE abastecimento_nitrogenio 
      SET proximo_abastecimento = $1
      WHERE id = $2
      RETURNING *
    `, [proximoAbastecimento, ultimo.id]);
    
    if (updateResult.rows.length > 0) {
      const atualizado = updateResult.rows[0];
      console.log('✅ Próximo abastecimento atualizado com sucesso!\n');
      console.log('--- Registro Atualizado ---');
      console.log(`ID: ${atualizado.id}`);
      console.log(`Data Abastecimento: ${new Date(atualizado.data_abastecimento).toLocaleDateString('pt-BR')}`);
      console.log(`Quantidade: ${atualizado.quantidade_litros}L`);
      console.log(`Valor Total: R$ ${parseFloat(atualizado.valor_total).toFixed(2)}`);
      console.log(`Motorista: ${atualizado.motorista}`);
      console.log(`Próximo Abastecimento: ${new Date(atualizado.proximo_abastecimento).toLocaleDateString('pt-BR')}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar próximo abastecimento:', error.message);
  } finally {
    await pool.end();
  }
}

atualizarProximoAbastecimento();
