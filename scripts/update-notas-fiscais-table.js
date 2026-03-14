const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function updateNotasFiscaisTable() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Atualizando estrutura da tabela notas_fiscais...')
    
    // Adicionar colunas que podem não existir
    const alterQueries = [
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS data DATE",
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS natureza_operacao VARCHAR(100)",
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS tipo VARCHAR(20)",
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(20) DEFAULT 'bovino'",
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'",
      "ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ]
    
    for (const query of alterQueries) {
      try {
        await client.query(query)
        console.log(`✅ Executado: ${query}`)
      } catch (error) {
        console.log(`⚠️ Ignorado (coluna já existe): ${query}`)
      }
    }
    
    // Adicionar constraints se não existirem
    try {
      await client.query(`
        ALTER TABLE notas_fiscais 
        ADD CONSTRAINT IF NOT EXISTS check_tipo 
        CHECK (tipo IN ('entrada', 'saida'))
      `)
      console.log('✅ Constraint de tipo adicionada')
    } catch (error) {
      console.log('⚠️ Constraint de tipo já existe')
    }
    
    try {
      await client.query(`
        ALTER TABLE notas_fiscais 
        ADD CONSTRAINT IF NOT EXISTS check_tipo_produto 
        CHECK (tipo_produto IN ('bovino', 'semen', 'embriao'))
      `)
      console.log('✅ Constraint de tipo_produto adicionada')
    } catch (error) {
      console.log('⚠️ Constraint de tipo_produto já existe')
    }
    
    console.log('✅ Estrutura da tabela notas_fiscais atualizada com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tabela:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateNotasFiscaisTable()
    .then(() => {
      console.log('🎉 Atualização concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro na atualização:', error)
      process.exit(1)
    })
}

module.exports = updateNotasFiscaisTable
