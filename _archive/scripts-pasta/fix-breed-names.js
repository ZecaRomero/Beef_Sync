const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

async function fixBreedNames() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Corrigindo nomes das raças para evitar duplicatas...')
    
    // Mapear variações de nomes para nomes padronizados
    const breedMapping = {
      'BRAHMAN': 'Brahman',
      'NELOREGIR': 'Nelore',
      'NELORE': 'Nelore',
      'RECEPTORA': 'Receptora'
    }
    
    // Buscar todas as raças únicas
    const racasResult = await client.query(`
      SELECT DISTINCT raca, COUNT(*) as total 
      FROM animais 
      GROUP BY raca 
      ORDER BY raca
    `)
    
    console.log('📊 Raças encontradas:')
    racasResult.rows.forEach(raca => {
      console.log(`   ${raca.raca}: ${raca.total} animais`)
    })
    
    let animaisAtualizados = 0
    
    // Atualizar nomes das raças
    for (const [nomeAntigo, nomeNovo] of Object.entries(breedMapping)) {
      const result = await client.query(`
        UPDATE animais 
        SET raca = $1, updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(raca) = $2
      `, [nomeNovo, nomeAntigo])
      
      if (result.rowCount > 0) {
        animaisAtualizados += result.rowCount
        console.log(`✅ ${result.rowCount} animais atualizados: ${nomeAntigo} → ${nomeNovo}`)
      }
    }
    
    console.log(`\n🎉 ${animaisAtualizados} animais atualizados!`)
    
    // Verificar resultado final
    const racasFinal = await client.query(`
      SELECT raca, COUNT(*) as total 
      FROM animais 
      GROUP BY raca 
      ORDER BY total DESC
    `)
    
    console.log('\n📈 Distribuição final por raça:')
    racasFinal.rows.forEach(raca => {
      console.log(`   ${raca.raca}: ${raca.total} animais`)
    })
    
  } catch (error) {
    console.error('❌ Erro na correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixBreedNames()
    .then(() => {
      console.log('🎉 Correção concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro na correção:', error)
      process.exit(1)
    })
}

module.exports = fixBreedNames
