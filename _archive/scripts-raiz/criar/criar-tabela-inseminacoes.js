const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
});

async function criarTabela() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CRIANDO TABELA DE INSEMINAÇÕES\n');
    console.log('='.repeat(80));
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS inseminacoes (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
        numero_ia INTEGER DEFAULT 1,
        data_ia DATE NOT NULL,
        data_dg DATE,
        touro_nome VARCHAR(255),
        touro_rg VARCHAR(50),
        tecnico VARCHAR(255),
        protocolo VARCHAR(100),
        status_gestacao VARCHAR(50) DEFAULT 'Pendente',
        observacoes TEXT,
        custo_dose NUMERIC(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela inseminacoes criada');
    
    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_animal ON inseminacoes(animal_id);
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_data_ia ON inseminacoes(data_ia);
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_data_dg ON inseminacoes(data_dg);
      CREATE INDEX IF NOT EXISTS idx_inseminacoes_status ON inseminacoes(status_gestacao);
    `);
    
    console.log('✅ Índices criados');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Tabela de inseminações criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

criarTabela();
