require('dotenv').config()
const { query } = require('./lib/database')

async function testAnimalData() {
  try {
    // Buscar um animal qualquer
    const result = await query(`
      SELECT id, serie, rg, sexo, raca, data_nascimento, pai, mae
      FROM animais
      WHERE serie LIKE 'CJCJ%'
      LIMIT 5
    `)
    
    console.log('🐄 Animais encontrados:\n')
    
    result.rows.forEach(animal => {
      console.log(`${animal.serie}-${animal.rg}:`)
      console.log(`  - Sexo: ${animal.sexo}`)
      console.log(`  - Raça: ${animal.raca}`)
      console.log(`  - Data Nascimento: ${animal.data_nascimento}`)
      console.log(`  - Pai: ${animal.pai || 'Não informado'}`)
      console.log(`  - Mãe: ${animal.mae || 'Não informado'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

testAnimalData()
