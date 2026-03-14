const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixSemenStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigindo estrutura das tabelas de sêmen...');
    
    // 1. Adicionar colunas faltantes na tabela entradas_semen
    console.log('📝 Adicionando colunas faltantes...');
    
    const addColumns = [
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS nome_touro VARCHAR(255)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS localizacao VARCHAR(255)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS rack_touro VARCHAR(50)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS numero_nf VARCHAR(100)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS valor_compra DECIMAL(10,2)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS data_compra DATE',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS quantidade_doses INTEGER',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS doses_disponiveis INTEGER',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS doses_usadas INTEGER DEFAULT 0',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS certificado VARCHAR(255)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS data_validade DATE',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS origem VARCHAR(255)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS linhagem VARCHAR(255)',
      'ALTER TABLE entradas_semen ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'disponivel\''
    ];
    
    for (const sql of addColumns) {
      try {
        await client.query(sql);
      } catch (error) {
        if (error.code !== '42701') { // Ignore "column already exists" errors
          console.log(`⚠️  ${error.message}`);
        }
      }
    }
    
    // 2. Migrar dados da tabela estoque_semen para as novas tabelas
    console.log('📦 Migrando dados...');
    
    // Limpar tabelas antes da migração
    await client.query('DELETE FROM saidas_semen');
    await client.query('DELETE FROM entradas_semen');
    
    // Migrar entradas
    const entradas = await client.query(`
      SELECT * FROM estoque_semen 
      WHERE tipo_operacao = 'entrada' OR tipo_operacao IS NULL
    `);
    
    console.log(`📥 Migrando ${entradas.rows.length} entradas...`);
    
    for (const entrada of entradas.rows) {
      await client.query(`
        INSERT INTO entradas_semen (
          nome_touro, rg_touro, raca, localizacao, rack_touro, botijao, caneca,
          numero_nf, valor_compra, data_compra, quantidade_doses, doses_disponiveis, 
          doses_usadas, certificado, data_validade, origem, linhagem, observacoes, 
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        entrada.nome_touro,
        entrada.rg_touro,
        entrada.raca,
        entrada.localizacao,
        entrada.rack_touro,
        entrada.botijao,
        entrada.caneca,
        entrada.numero_nf,
        entrada.valor_compra,
        entrada.data_compra,
        entrada.quantidade_doses,
        entrada.doses_disponiveis,
        entrada.doses_usadas || 0,
        entrada.certificado,
        entrada.data_validade,
        entrada.origem,
        entrada.linhagem,
        entrada.observacoes,
        entrada.status || 'disponivel',
        entrada.created_at || new Date()
      ]);
    }
    
    console.log('✅ Estrutura corrigida e dados migrados!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSemenStructure();