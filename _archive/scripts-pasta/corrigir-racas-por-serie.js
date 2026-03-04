/**
 * Script para corrigir raças de animais baseado na série
 * Atualiza animais BENT e JDHF para Brahman
 */

const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'estoque_semen',
  password: process.env.DB_PASSWORD || 'jcromero85',
  port: process.env.DB_PORT || 5432,
})

const racasPorSerie = {
  'BENT': 'Brahman',
  'JDHF': 'Brahman',
  'CJCJ': 'Nelore',
  'CJCG': 'Gir',
  'RPT': 'Receptora'
}

async function corrigirRacas() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Verificando animais que precisam correção de raça...\n')
    
    let totalCorrigidos = 0
    
    for (const [serie, racaCorreta] of Object.entries(racasPorSerie)) {
      // Buscar animais com série mas raça incorreta
      const animaisIncorretos = await client.query(`
        SELECT id, serie, rg, raca 
        FROM animais 
        WHERE serie = $1 AND raca != $2
      `, [serie, racaCorreta])
      
      if (animaisIncorretos.rows.length > 0) {
        console.log(`📋 Encontrados ${animaisIncorretos.rows.length} animais da série ${serie} com raça incorreta:`)
        
        for (const animal of animaisIncorretos.rows) {
          console.log(`  - ${animal.serie}-${animal.rg}: ${animal.raca} → ${racaCorreta}`)
          
          // Atualizar raça
          await client.query(`
            UPDATE animais 
            SET raca = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
          `, [racaCorreta, animal.id])
          
          totalCorrigidos++
        }
        
        console.log(`✅ ${animaisIncorretos.rows.length} animais da série ${serie} corrigidos\n`)
      }
    }
    
    if (totalCorrigidos === 0) {
      console.log('✅ Nenhum animal precisa de correção de raça!')
    } else {
      console.log(`\n🎉 Total de ${totalCorrigidos} animais corrigidos com sucesso!`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir raças:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
corrigirRacas()
  .then(() => {
    console.log('\n✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

