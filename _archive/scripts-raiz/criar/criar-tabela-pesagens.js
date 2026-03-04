const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:senha@localhost:5432/beef_sync'
})

async function criarTabelaPesagens() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Criando tabela de pesagens...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS pesagens (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER NOT NULL,
        peso DECIMAL(10, 2) NOT NULL,
        ce DECIMAL(10, 2),
        data DATE NOT NULL DEFAULT CURRENT_DATE,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
      )
    `)

    console.log('✅ Tabela pesagens criada com sucesso!')

    // Criar índices para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pesagens_animal_id ON pesagens(animal_id);
      CREATE INDEX IF NOT EXISTS idx_pesagens_data ON pesagens(data);
    `)

    console.log('✅ Índices criados com sucesso!')

    // Verificar estrutura
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pesagens'
      ORDER BY ordinal_position
    `)

    console.log('\n📋 Estrutura da tabela pesagens:')
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

criarTabelaPesagens()
