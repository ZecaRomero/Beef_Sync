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
    console.log('ðÅ¸â€�â€ž Atualizando estrutura da tabela notas_fiscais...')
    
    // Adicionar colunas que podem nÃ£o existir
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
        console.log(`âÅ“â€¦ Executado: ${query}`)
      } catch (error) {
        console.log(`âÅ¡ ï¸� Ignorado (coluna jÃ¡ existe): ${query}`)
      }
    }
    
    // Adicionar constraints se nÃ£o existirem
    try {
      await client.query(`
        ALTER TABLE notas_fiscais 
        ADD CONSTRAINT IF NOT EXISTS check_tipo 
        CHECK (tipo IN ('entrada', 'saida'))
      `)
      console.log('âÅ“â€¦ Constraint de tipo adicionada')
    } catch (error) {
      console.log('âÅ¡ ï¸� Constraint de tipo jÃ¡ existe')
    }
    
    try {
      await client.query(`
        ALTER TABLE notas_fiscais 
        ADD CONSTRAINT IF NOT EXISTS check_tipo_produto 
        CHECK (tipo_produto IN ('bovino', 'semen', 'embriao'))
      `)
      console.log('âÅ“â€¦ Constraint de tipo_produto adicionada')
    } catch (error) {
      console.log('âÅ¡ ï¸� Constraint de tipo_produto jÃ¡ existe')
    }
    
    console.log('âÅ“â€¦ Estrutura da tabela notas_fiscais atualizada com sucesso!')
    
  } catch (error) {
    console.error('â�Å’ Erro ao atualizar tabela:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateNotasFiscaisTable()
    .then(() => {
      console.log('ðÅ¸Å½â€° AtualizaÃ§Ã£o concluÃ­da!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('ðÅ¸â€™¥ Erro na atualizaÃ§Ã£o:', error)
      process.exit(1)
    })
}

module.exports = updateNotasFiscaisTable
