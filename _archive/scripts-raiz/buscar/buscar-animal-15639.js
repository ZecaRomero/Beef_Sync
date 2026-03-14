const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'beef_sync',
  user: 'postgres',
  password: 'jcromero85'
})

async function buscarAnimal() {
  try {
    console.log('�Ÿ”� Buscando animal 15639...\n')
    
    // Buscar animal
    const animal = await pool.query(`
      SELECT * FROM animais WHERE id = 232
    `)
    
    if (animal.rows.length === 0) {
      console.log('�Œ Animal não encontrado')
      return
    }
    
    console.log('�Ÿ“‹ Dados do animal:')
    console.log(animal.rows[0])
    
    // Buscar inseminações
    const inseminacoes = await pool.query(`
      SELECT * FROM inseminacoes 
      WHERE animal_id = 232
      ORDER BY data_ia DESC
    `)
    
    console.log('\n�Ÿ’‰ Inseminações:')
    console.log(inseminacoes.rows)
    
    // Buscar gestações
    const gestacoes = await pool.query(`
      SELECT * FROM gestacoes 
      WHERE femea_id = 232
      ORDER BY data_inicio DESC
    `)
    
    console.log('\n�Ÿ�� Gestações:')
    console.log(gestacoes.rows)
    
  } catch (error) {
    console.error('�Œ Erro:', error.message)
  } finally {
    await pool.end()
  }
}

buscarAnimal()
