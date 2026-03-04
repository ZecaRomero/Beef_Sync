const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function verificarAvoMaterno() {
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT id, serie, rg, avo_materno, pai, mae, raca 
      FROM animais 
      WHERE serie = 'BENT' AND rg = '6167'
    `)
    
    if (result.rows.length > 0) {
      const animal = result.rows[0]
      console.log('📋 Animal BENT-6167 encontrado:')
      console.log(JSON.stringify(animal, null, 2))
      
      if (!animal.avo_materno || animal.avo_materno.trim() === '') {
        console.log('\n⚠️ Campo avo_materno está vazio!')
        console.log('💡 Atualizando com o valor "CALVARIO SANT FIV 51"...')
        
        await client.query(`
          UPDATE animais 
          SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, ['CALVARIO SANT FIV 51', animal.id])
        
        console.log('✅ Avô materno atualizado com sucesso!')
      } else {
        console.log(`\n✅ Avô materno já está preenchido: "${animal.avo_materno}"`)
      }
    } else {
      console.log('❌ Animal BENT-6167 não encontrado!')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

verificarAvoMaterno()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })

