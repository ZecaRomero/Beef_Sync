const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'estoque_semen',
  password: 'jcromero85',
  port: 5432,
})

// Mapeamento de séries para raças (do mockData.js)
const racasPorSerie = {
  'RPT': 'Receptora',
  'BENT': 'Brahman',
  'CJCJ': 'Nelore',
  'CJCG': 'Gir'
}

async function fixRacaBySerie() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Corrigindo raças baseadas na série...')
    
    // Buscar animais com raça incorreta baseada na série
    const series = Object.keys(racasPorSerie)
    const placeholders = series.map((_, i) => `$${i + 1}`).join(', ')
    const animaisResult = await client.query(`
      SELECT id, serie, rg, raca 
      FROM animais 
      WHERE serie IN (${placeholders})
      ORDER BY serie, rg
    `, series)
    
    console.log(`📊 Encontrados ${animaisResult.rows.length} animais para verificar...`)
    
    let animaisAtualizados = 0
    let animaisCorretos = 0
    
    // Verificar e atualizar cada animal
    for (const animal of animaisResult.rows) {
      const racaCorreta = racasPorSerie[animal.serie]
      
      if (racaCorreta && animal.raca !== racaCorreta) {
        await client.query(`
          UPDATE animais 
          SET raca = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [racaCorreta, animal.id])
        
        console.log(`✅ ${animal.serie}-${animal.rg}: ${animal.raca} → ${racaCorreta}`)
        animaisAtualizados++
      } else {
        animaisCorretos++
      }
    }
    
    console.log(`\n📈 Resumo:`)
    console.log(`   ✅ Animais atualizados: ${animaisAtualizados}`)
    console.log(`   ✓ Animais já corretos: ${animaisCorretos}`)
    console.log(`   📊 Total processado: ${animaisResult.rows.length}`)
    
    // Verificar resultado final por série
    console.log('\n📋 Distribuição por série após correção:')
    for (const [serie, racaEsperada] of Object.entries(racasPorSerie)) {
      const result = await client.query(`
        SELECT COUNT(*) as total 
        FROM animais 
        WHERE serie = $1 AND raca = $2
      `, [serie, racaEsperada])
      
      const totalCorreto = parseInt(result.rows[0].total)
      
      const totalSerie = await client.query(`
        SELECT COUNT(*) as total 
        FROM animais 
        WHERE serie = $1
      `, [serie])
      
      const total = parseInt(totalSerie.rows[0].total)
      
      console.log(`   ${serie} (${racaEsperada}): ${totalCorreto}/${total} corretos`)
      
      if (totalCorreto < total) {
        const incorretos = await client.query(`
          SELECT serie, rg, raca 
          FROM animais 
          WHERE serie = $1 AND raca != $2
          LIMIT 5
        `, [serie, racaEsperada])
        
        if (incorretos.rows.length > 0) {
          console.log(`      ⚠️ Ainda há ${total - totalCorreto} incorretos (exemplos):`)
          incorretos.rows.forEach(a => {
            console.log(`         ${a.serie}-${a.rg}: ${a.raca}`)
          })
        }
      }
    }
    
    console.log(`\n🎉 Correção concluída! ${animaisAtualizados} animais atualizados.`)
    
  } catch (error) {
    console.error('❌ Erro na correção:', error)
    throw error
  } finally {
    client.release()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixRacaBySerie()
    .then(() => {
      console.log('\n✅ Script finalizado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro ao executar script:', error)
      process.exit(1)
    })
}

module.exports = fixRacaBySerie

