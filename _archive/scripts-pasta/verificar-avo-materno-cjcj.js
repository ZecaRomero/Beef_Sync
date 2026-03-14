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
    // Buscar o animal CJCJ-16173
    const animalResult = await client.query(`
      SELECT id, serie, rg, avo_materno, pai, mae 
      FROM animais 
      WHERE serie = 'CJCJ' AND rg = '16173'
    `)
    
    if (animalResult.rows.length === 0) {
      console.log('❌ Animal CJCJ-16173 não encontrado!')
      return
    }
    
    const animal = animalResult.rows[0]
    console.log('📋 Animal CJCJ-16173:')
    console.log(JSON.stringify(animal, null, 2))
    
    // Extrair série e RG da mãe
    const maeInfo = animal.mae
    console.log('\n📋 Informação da mãe no campo mae:', maeInfo)
    
    if (maeInfo) {
      // Tentar extrair série e RG
      const match = maeInfo.match(/([A-Za-z]+)[\s\/\-]*(\d+)/)
      if (match) {
        const maeSerie = match[1]
        const maeRg = match[2]
        console.log(`\n🔍 Buscando mãe: ${maeSerie}-${maeRg}`)
        
        // Buscar a mãe
        const maeResult = await client.query(`
          SELECT id, serie, rg, avo_materno, pai 
          FROM animais 
          WHERE serie = $1 AND rg = $2
        `, [maeSerie, maeRg])
        
        if (maeResult.rows.length > 0) {
          const mae = maeResult.rows[0]
          console.log('\n📋 Mãe encontrada:')
          console.log(JSON.stringify(mae, null, 2))
          
          if (mae.avo_materno) {
            console.log(`\n✅ A mãe tem avô materno: "${mae.avo_materno}"`)
            console.log('💡 Esse deveria ser o avô materno do animal CJCJ-16173')
            
            // Atualizar o animal com o avô materno da mãe
            if (!animal.avo_materno || animal.avo_materno.trim() === '') {
              console.log('\n💡 Atualizando animal CJCJ-16173 com o avô materno da mãe...')
              await client.query(`
                UPDATE animais 
                SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2
              `, [mae.avo_materno, animal.id])
              console.log('✅ Avô materno atualizado!')
            }
          } else if (mae.pai) {
            console.log(`\n✅ A mãe tem pai cadastrado: "${mae.pai}"`)
            console.log('💡 Esse deveria ser o avô materno do animal CJCJ-16173')
            
            // Atualizar o animal com o pai da mãe
            if (!animal.avo_materno || animal.avo_materno.trim() === '') {
              console.log('\n💡 Atualizando animal CJCJ-16173 com o pai da mãe...')
              await client.query(`
                UPDATE animais 
                SET avo_materno = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2
              `, [mae.pai, animal.id])
              console.log('✅ Avô materno atualizado!')
            }
          } else {
            console.log('\n⚠️ A mãe não tem avô materno nem pai cadastrado')
          }
        } else {
          console.log(`\n❌ Mãe ${maeSerie}-${maeRg} não encontrada no banco`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

verificarAvoMaterno()
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

