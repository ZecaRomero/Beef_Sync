const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'beef_sync',
  password: 'jcromero85',
  port: 5432,
})

async function verificarEstrutura() {
  try {
    // Ver estrutura da tabela
    const estrutura = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'animais'
      ORDER BY ordinal_position
    `)

    console.log('�Ÿ“‹ Estrutura da tabela animais:')
    estrutura.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // Buscar animal 8251 por qualquer campo
    const animal = await pool.query(`
      SELECT * FROM animais 
      WHERE rg = '8251' 
      LIMIT 1
    `)

    if (animal.rows.length > 0) {
      console.log('\n�Ÿ“‹ Dados do animal 8251:')
      console.log(JSON.stringify(animal.rows[0], null, 2))
    } else {
      console.log('\n�Œ Animal 8251 não encontrado!')
    }

  } catch (error) {
    console.error('�Œ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

verificarEstrutura()
