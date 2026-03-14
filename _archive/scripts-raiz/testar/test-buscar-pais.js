require('dotenv').config()
const { query } = require('./lib/database')

async function testBuscarPais() {
  try {
    console.log('≈∏‚Äùç Testando busca de pais...\n')
    
    // Buscar um animal com pai e m√£e
    const result = await query(`
      SELECT id, serie, rg, pai, mae
      FROM animais
      WHERE pai IS NOT NULL AND mae IS NOT NULL
      LIMIT 3
    `)
    
    console.log(`≈∏‚Äú‚Äπ Encontrados ${result.rows.length} animais com pai e m√£e\n`)
    
    for (const animal of result.rows) {
      console.log(`\n≈∏ê‚Äû Animal: ${animal.serie}-${animal.rg}`)
      console.log(`  Pai registrado: ${animal.pai}`)
      console.log(`  M√£e registrada: ${animal.mae}`)
      
      // Buscar pai
      if (animal.pai) {
        const paiResult = await query(
          `SELECT id, serie, rg, nome
           FROM animais 
           WHERE UPPER(nome) = UPPER($1) 
              OR UPPER(serie) = UPPER($1)
              OR CONCAT(serie, ' ', rg) = $1
           LIMIT 1`,
          [animal.pai.trim()]
        )
        
        if (paiResult.rows.length > 0) {
          const pai = paiResult.rows[0]
          console.log(`  ‚≈ì‚Ä¶ Pai encontrado: ${pai.serie}-${pai.rg} (${pai.nome || 'sem nome'})`)
        } else {
          console.log(`  ‚ù≈í Pai N√∆íO encontrado`)
          
          // Tentar busca parcial
          const buscaParcial = await query(
            `SELECT id, serie, rg, nome
             FROM animais 
             WHERE UPPER(nome) LIKE UPPER($1)
                OR UPPER(serie) LIKE UPPER($1)
             LIMIT 3`,
            [`%${animal.pai.trim()}%`]
          )
          
          if (buscaParcial.rows.length > 0) {
            console.log(`  ≈∏‚Äô° Sugest√µes:`)
            buscaParcial.rows.forEach(s => {
              console.log(`     - ${s.serie}-${s.rg} (${s.nome || 'sem nome'})`)
            })
          }
        }
      }
      
      // Buscar m√£e
      if (animal.mae) {
        const maeResult = await query(
          `SELECT id, serie, rg, nome
           FROM animais 
           WHERE UPPER(nome) = UPPER($1) 
              OR UPPER(serie) = UPPER($1)
              OR CONCAT(serie, ' ', rg) = $1
           LIMIT 1`,
          [animal.mae.trim()]
        )
        
        if (maeResult.rows.length > 0) {
          const mae = maeResult.rows[0]
          console.log(`  ‚≈ì‚Ä¶ M√£e encontrada: ${mae.serie}-${mae.rg} (${mae.nome || 'sem nome'})`)
        } else {
          console.log(`  ‚ù≈í M√£e N√∆íO encontrada`)
          
          // Tentar busca parcial
          const buscaParcial = await query(
            `SELECT id, serie, rg, nome
             FROM animais 
             WHERE UPPER(nome) LIKE UPPER($1)
                OR UPPER(serie) LIKE UPPER($1)
             LIMIT 3`,
            [`%${animal.mae.trim()}%`]
          )
          
          if (buscaParcial.rows.length > 0) {
            console.log(`  ≈∏‚Äô° Sugest√µes:`)
            buscaParcial.rows.forEach(s => {
              console.log(`     - ${s.serie}-${s.rg} (${s.nome || 'sem nome'})`)
            })
          }
        }
      }
    }
    
    console.log('\n‚≈ì‚Ä¶ Teste conclu√≠do!')
    
  } catch (error) {
    console.error('‚ù≈í Erro:', error)
  } finally {
    process.exit(0)
  }
}

testBuscarPais()
