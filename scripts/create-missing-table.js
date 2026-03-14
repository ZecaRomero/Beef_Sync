const { Pool } = require('pg')

// Configurar conexÃ£o com o banco
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'jcromero85',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function createMissingTable() {
  const client = await pool.connect()
  
  try {
    console.log('ðÅ¸â€�� Verificando tabela notas_fiscais_itens...')
    
    // Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notas_fiscais_itens'
      )
    `)
    
    if (tableExists.rows[0].exists) {
      console.log('âÅ“â€¦ Tabela notas_fiscais_itens jÃ¡ existe!')
    } else {
      console.log('ðÅ¸â€œ¦ Criando tabela notas_fiscais_itens...')
      
      await client.query(`
        CREATE TABLE notas_fiscais_itens (
          id SERIAL PRIMARY KEY,
          nota_fiscal_id INTEGER NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
          tipo_produto VARCHAR(20) NOT NULL CHECK (tipo_produto IN ('bovino', 'semen', 'embriao')),
          dados_item JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      console.log('âÅ“â€¦ Tabela notas_fiscais_itens criada!')
    }
    
    // Criar Ã­ndices se nÃ£o existirem
    console.log('ðÅ¸â€�� Verificando Ã­ndices...')
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nf_itens_nota_id ON notas_fiscais_itens(nota_fiscal_id)
    `)
    
    console.log('âÅ“â€¦ Ã�ndices criados/verificados!')
    
    // Testar a tabela
    console.log('ðÅ¸§ª Testando tabela...')
    const testQuery = await client.query('SELECT COUNT(*) as count FROM notas_fiscais_itens')
    console.log(`ðÅ¸â€œÅ  Registros na tabela: ${testQuery.rows[0].count}`)
    
    console.log('\nâÅ“â€¦ MigraÃ§Ã£o concluÃ­da com sucesso!')
    
  } catch (error) {
    console.error('â�Å’ Erro na migraÃ§Ã£o:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar migraÃ§Ã£o
createMissingTable()
  .then(() => {
    console.log('\nðÅ¸Å½â€° Processo concluÃ­do!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nðÅ¸â€™¥ Erro:', error.message)
    process.exit(1)
  })

