require('dotenv').config()
const { query } = require('./lib/database')

async function testarDadosPDF() {
  try {
    console.log('🔍 Testando busca de dados para PDF...\n')
    
    // 1. Buscar um envio de DNA
    const enviosResult = await query(
      `SELECT * FROM dna_envios ORDER BY data_envio DESC LIMIT 1`
    )
    
    if (enviosResult.rows.length === 0) {
      console.log('❌ Nenhum envio de DNA encontrado')
      return
    }
    
    const envio = enviosResult.rows[0]
    console.log('📦 Envio encontrado:', {
      id: envio.id,
      data_envio: envio.data_envio,
      laboratorio: envio.laboratorio,
      quantidade_animais: envio.quantidade_animais
    })
    
    // 2. Buscar animais do envio
    const animaisResult = await query(
      `SELECT animal_id FROM dna_animais WHERE envio_id = $1`,
      [envio.id]
    )
    
    console.log(`\n🐄 ${animaisResult.rows.length} animal(is) vinculado(s) ao envio\n`)
    
    // 3. Buscar dados completos de cada animal
    for (const row of animaisResult.rows.slice(0, 3)) { // Apenas 3 primeiros para teste
      const animalId = row.animal_id
      
      const animalResult = await query(
        `SELECT 
          id, serie, rg, sexo, raca, data_nascimento,
          pai, mae, pai_id, mae_id
        FROM animais 
        WHERE id = $1`,
        [animalId]
      )
      
      if (animalResult.rows.length === 0) {
        console.log(`❌ Animal ${animalId} não encontrado`)
        continue
      }
      
      const animal = animalResult.rows[0]
      console.log(`\n📋 Animal ${animal.serie}-${animal.rg}:`)
      console.log('  - Sexo:', animal.sexo)
      console.log('  - Raça:', animal.raca)
      console.log('  - Data Nascimento:', animal.data_nascimento)
      console.log('  - Pai:', animal.pai, '(ID:', animal.pai_id, ')')
      console.log('  - Mãe:', animal.mae, '(ID:', animal.mae_id, ')')
      
      // Buscar dados do pai
      if (animal.pai_id) {
        const paiResult = await query(
          `SELECT serie, rg, nome FROM animais WHERE id = $1`,
          [animal.pai_id]
        )
        
        if (paiResult.rows.length > 0) {
          const pai = paiResult.rows[0]
          console.log(`  ✅ Pai encontrado: ${pai.serie}-${pai.rg} (${pai.nome || 'Sem nome'})`)
        } else {
          console.log(`  ⚠️ Pai ID ${animal.pai_id} não encontrado no banco`)
        }
      }
      
      // Buscar dados da mãe
      if (animal.mae_id) {
        const maeResult = await query(
          `SELECT serie, rg, nome FROM animais WHERE id = $1`,
          [animal.mae_id]
        )
        
        if (maeResult.rows.length > 0) {
          const mae = maeResult.rows[0]
          console.log(`  ✅ Mãe encontrada: ${mae.serie}-${mae.rg} (${mae.nome || 'Sem nome'})`)
        } else {
          console.log(`  ⚠️ Mãe ID ${animal.mae_id} não encontrada no banco`)
        }
      }
    }
    
    console.log('\n✅ Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

testarDadosPDF()
