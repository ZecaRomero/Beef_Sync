const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function adicionarCampoAvoMaterno() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando se a coluna avo_materno existe...')
    
    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'animais' AND column_name = 'avo_materno'
    `)
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna avo_materno já existe!')
    } else {
      console.log('➕ Adicionando coluna avo_materno...')
      
      await client.query(`
        ALTER TABLE animais 
        ADD COLUMN avo_materno VARCHAR(50)
      `)
      
      console.log('✅ Coluna avo_materno adicionada com sucesso!')
    }
    
    // Verificar estrutura
    const estrutura = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais' 
      AND column_name IN ('pai', 'mae', 'avo_materno', 'receptora')
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Estrutura da tabela (campos de genealogia):')
    estrutura.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

adicionarCampoAvoMaterno()
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

