const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85'
})

async function verificarEstrutura() {
  try {
    console.log('�Ÿ”� Verificando estrutura da tabela gestacoes...\n')
    
    const colunas = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'gestacoes'
      ORDER BY ordinal_position
    `)
    
    console.log('�Ÿ“‹ Colunas:')
    colunas.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`)
    })
    
    // Buscar gestações do animal 232
    console.log('\n�Ÿ”� Buscando gestações do animal 232...')
    const gestacoes = await pool.query(`
      SELECT * FROM gestacoes LIMIT 5
    `)
    
    console.log('\n�Ÿ“‹ Primeiras 5 gestações:')
    console.log(gestacoes.rows)
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarEstrutura()
