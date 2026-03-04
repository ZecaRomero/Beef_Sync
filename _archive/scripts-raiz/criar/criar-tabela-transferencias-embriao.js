/**
 * DEPRECADO: Este script criava a tabela ERRADA "transferencias_embriao" (singular).
 * O sistema usa "transferencias_embrioes" (plural) - criada em lib/database.js
 * A tabela legada foi removida. NÃO execute este script.
 */
const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function criarTabela() {
  try {
    console.log('🔧 Criando tabela transferencias_embriao...\n')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transferencias_embriao (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER REFERENCES animais(id) ON DELETE CASCADE,
        data_te DATE NOT NULL,
        data_dg DATE,
        resultado_dg TEXT,
        veterinario TEXT,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Tabela transferencias_embriao criada com sucesso!\n')

    // Criar índices para melhor performance
    console.log('📝 Criando índices...')
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_te_animal_id 
      ON transferencias_embriao(animal_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_te_data_te 
      ON transferencias_embriao(data_te)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_te_data_dg 
      ON transferencias_embriao(data_dg)
    `)

    console.log('✅ Índices criados!\n')

    // Verificar estrutura
    const estrutura = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transferencias_embriao'
      ORDER BY ordinal_position
    `)

    console.log('📋 Estrutura da tabela:')
    estrutura.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(opcional)' : '(obrigatório)'
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`)
    })

    console.log('\n✅ Tabela pronta para uso!')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

criarTabela()
