const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'estoque_semen',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function createDestinatariosTable() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Criando tabela destinatarios_relatorios...')
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinatarios_relatorios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20),
        cargo VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        recebe_email BOOLEAN DEFAULT true,
        recebe_whatsapp BOOLEAN DEFAULT false,
        tipos_relatorios JSONB DEFAULT '[]',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      )
    `)
    
    console.log('✅ Tabela destinatarios_relatorios criada com sucesso!')
    
    // Verificar se existem registros
    const result = await client.query('SELECT COUNT(*) FROM destinatarios_relatorios')
    console.log(`📊 Total de destinatários cadastrados: ${result.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createDestinatariosTable()
  .then(() => {
    console.log('✅ Script concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })
