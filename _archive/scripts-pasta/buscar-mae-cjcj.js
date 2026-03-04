const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

async function buscarMae() {
  const client = await pool.connect()
  
  try {
    // Buscar qualquer animal com RG 15179
    const result = await client.query(`
      SELECT id, serie, rg, avo_materno, pai, mae, nome
      FROM animais 
      WHERE rg = '15179'
    `)
    
    console.log(`📋 Animais encontrados com RG 15179: ${result.rows.length}`)
    result.rows.forEach((animal, index) => {
      console.log(`\n${index + 1}. ${animal.serie}-${animal.rg}:`)
      console.log(`   Nome: ${animal.nome || 'N/A'}`)
      console.log(`   Avô Materno: ${animal.avo_materno || 'NULL'}`)
      console.log(`   Pai: ${animal.pai || 'NULL'}`)
    })
    
    // Verificar também se há animais com nome contendo "NESVASCA"
    const resultNome = await client.query(`
      SELECT id, serie, rg, avo_materno, pai, mae, nome
      FROM animais 
      WHERE nome ILIKE '%NESVASCA%' OR mae ILIKE '%NESVASCA%' OR pai ILIKE '%NESVASCA%'
      LIMIT 10
    `)
    
    console.log(`\n📋 Animais com "NESVASCA" no nome/mae/pai: ${resultNome.rows.length}`)
    resultNome.rows.forEach((animal, index) => {
      console.log(`\n${index + 1}. ${animal.serie}-${animal.rg}:`)
      console.log(`   Nome: ${animal.nome || 'N/A'}`)
      console.log(`   Mãe: ${animal.mae || 'N/A'}`)
      console.log(`   Avô Materno: ${animal.avo_materno || 'NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

buscarMae()
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

