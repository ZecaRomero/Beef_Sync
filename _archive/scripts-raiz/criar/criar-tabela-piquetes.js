const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function criarTabelaPiquetes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CRIANDO TABELA DE PIQUETES\n');
    console.log('='.repeat(80));
    
    // Criar tabela piquetes
    await client.query(`
      CREATE TABLE IF NOT EXISTS piquetes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        area_hectares NUMERIC(10, 2),
        capacidade_animais INTEGER,
        tipo VARCHAR(50),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela piquetes criada');
    
    // Adicionar coluna piquete_atual na tabela animais se não existir
    await client.query(`
      ALTER TABLE animais 
      ADD COLUMN IF NOT EXISTS piquete_atual VARCHAR(50),
      ADD COLUMN IF NOT EXISTS data_entrada_piquete DATE
    `);
    
    console.log('✅ Colunas piquete_atual e data_entrada_piquete adicionadas na tabela animais');
    
    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_animais_piquete ON animais(piquete_atual);
      CREATE INDEX IF NOT EXISTS idx_piquetes_codigo ON piquetes(codigo);
    `);
    
    console.log('✅ Índices criados');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Estrutura de piquetes criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

criarTabelaPiquetes();
