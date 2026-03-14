const { query, pool } = require('../lib/database')

async function createDNATables() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Tabela de envios de DNA
    await client.query(`
      CREATE TABLE IF NOT EXISTS dna_envios (
        id SERIAL PRIMARY KEY,
        laboratorio VARCHAR(50) NOT NULL CHECK (laboratorio IN ('VRGEN', 'NEOGEN')),
        data_envio DATE NOT NULL,
        custo_por_animal DECIMAL(10, 2) NOT NULL,
        custo_total DECIMAL(10, 2) NOT NULL,
        quantidade_animais INTEGER NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabela de relacionamento entre envios e animais
    await client.query(`
      CREATE TABLE IF NOT EXISTS dna_animais (
        id SERIAL PRIMARY KEY,
        envio_id INTEGER NOT NULL REFERENCES dna_envios(id) ON DELETE CASCADE,
        animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(envio_id, animal_id)
      )
    `)

    // Adicionar colunas de DNA na tabela animais se não existirem
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'animais' AND column_name = 'laboratorio_dna'
        ) THEN
          ALTER TABLE animais ADD COLUMN laboratorio_dna VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'animais' AND column_name = 'data_envio_dna'
        ) THEN
          ALTER TABLE animais ADD COLUMN data_envio_dna DATE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'animais' AND column_name = 'custo_dna'
        ) THEN
          ALTER TABLE animais ADD COLUMN custo_dna DECIMAL(10, 2);
        END IF;
      END $$;
    `)

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dna_envios_laboratorio ON dna_envios(laboratorio);
      CREATE INDEX IF NOT EXISTS idx_dna_envios_data ON dna_envios(data_envio);
      CREATE INDEX IF NOT EXISTS idx_dna_animais_envio ON dna_animais(envio_id);
      CREATE INDEX IF NOT EXISTS idx_dna_animais_animal ON dna_animais(animal_id);
      CREATE INDEX IF NOT EXISTS idx_animais_laboratorio_dna ON animais(laboratorio_dna);
    `)

    await client.query('COMMIT')
    console.log('✅ Tabelas de DNA criadas com sucesso!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao criar tabelas de DNA:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createDNATables()
    .then(() => {
      console.log('✅ Script concluído')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

module.exports = { createDNATables }
