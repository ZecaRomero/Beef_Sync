require('dotenv').config()
const { query } = require('./lib/database')

async function testBuscarPaisMelhorado() {
  try {
    console.log('🔍 Testando busca melhorada de pais...\n')
    
    // Buscar um animal específico do PDF
    const result = await query(`
      SELECT id, serie, rg, pai, mae
      FROM animais
      WHERE serie = 'CJCJ' AND rg = '17671'
      LIMIT 1
    `)
    
    if (result.rows.length === 0) {
      console.log('❌ Animal CJCJ-17671 não encontrado')
      return
    }
    
    const animal = result.rows[0]
    console.log(`🐄 Animal: ${animal.serie}-${animal.rg}`)
    console.log(`  Pai registrado: "${animal.pai}"`)
    console.log(`  Mãe registrada: "${animal.mae}"\n`)
    
    // Buscar pai - tentar várias estratégias
    if (animal.pai) {
      console.log(`👨 Buscando pai: "${animal.pai}"`)
      
      // Estratégia 1: Nome exato
      let paiResult = await query(
        `SELECT id, serie, rg, nome FROM animais WHERE UPPER(nome) = UPPER($1) LIMIT 1`,
        [animal.pai.trim()]
      )
      
      if (paiResult.rows.length > 0) {
        console.log(`  ✅ Encontrado por nome exato:`, paiResult.rows[0])
      } else {
        // Estratégia 2: Série exata
        paiResult = await query(
          `SELECT id, serie, rg, nome FROM animais WHERE UPPER(serie) = UPPER($1) LIMIT 1`,
          [animal.pai.trim()]
        )
        
        if (paiResult.rows.length > 0) {
          console.log(`  ✅ Encontrado por série:`, paiResult.rows[0])
        } else {
          // Estratégia 3: Busca parcial no nome
          paiResult = await query(
            `SELECT id, serie, rg, nome FROM animais WHERE UPPER(nome) LIKE UPPER($1) LIMIT 5`,
            [`%${animal.pai.trim()}%`]
          )
          
          if (paiResult.rows.length > 0) {
            console.log(`  💡 Encontrados por busca parcial:`)
            paiResult.rows.forEach(p => console.log(`     - ${p.serie}-${p.rg} (${p.nome || 'sem nome'})`))
          } else {
            // Estratégia 4: Extrair possível série do nome (ex: "C2747 DA S.NICE" -> "C2747")
            const possiveisSeries = animal.pai.match(/[A-Z]+\d+/g)
            if (possiveisSeries && possiveisSeries.length > 0) {
              console.log(`  🔍 Tentando séries extraídas: ${possiveisSeries.join(', ')}`)
              
              for (const serie of possiveisSeries) {
                const serieResult = await query(
                  `SELECT id, serie, rg, nome FROM animais WHERE UPPER(serie) = UPPER($1) LIMIT 1`,
                  [serie]
                )
                
                if (serieResult.rows.length > 0) {
                  console.log(`  ✅ Encontrado pela série extraída "${serie}":`, serieResult.rows[0])
                  break
                }
              }
            } else {
              console.log(`  ❌ Pai não encontrado por nenhuma estratégia`)
            }
          }
        }
      }
    }
    
    // Buscar mãe - tentar várias estratégias
    if (animal.mae) {
      console.log(`\n👩 Buscando mãe: "${animal.mae}"`)
      
      // Estratégia 1: Nome exato
      let maeResult = await query(
        `SELECT id, serie, rg, nome FROM animais WHERE UPPER(nome) = UPPER($1) LIMIT 1`,
        [animal.mae.trim()]
      )
      
      if (maeResult.rows.length > 0) {
        console.log(`  ✅ Encontrada por nome exato:`, maeResult.rows[0])
      } else {
        // Estratégia 2: Série exata
        maeResult = await query(
          `SELECT id, serie, rg, nome FROM animais WHERE UPPER(serie) = UPPER($1) LIMIT 1`,
          [animal.mae.trim()]
        )
        
        if (maeResult.rows.length > 0) {
          console.log(`  ✅ Encontrada por série:`, maeResult.rows[0])
        } else {
          // Estratégia 3: Busca parcial no nome
          maeResult = await query(
            `SELECT id, serie, rg, nome FROM animais WHERE UPPER(nome) LIKE UPPER($1) LIMIT 5`,
            [`%${animal.mae.trim()}%`]
          )
          
          if (maeResult.rows.length > 0) {
            console.log(`  💡 Encontradas por busca parcial:`)
            maeResult.rows.forEach(m => console.log(`     - ${m.serie}-${m.rg} (${m.nome || 'sem nome'})`))
          } else {
            // Estratégia 4: Extrair possível série do nome (ex: "CJ SANT ANNA 13534" -> "CJCJ", "13534")
            const possiveisSeries = animal.mae.match(/[A-Z]+\d+/g)
            if (possiveisSeries && possiveisSeries.length > 0) {
              console.log(`  🔍 Tentando séries extraídas: ${possiveisSeries.join(', ')}`)
              
              for (const serie of possiveisSeries) {
                const serieResult = await query(
                  `SELECT id, serie, rg, nome FROM animais WHERE UPPER(serie) = UPPER($1) LIMIT 1`,
                  [serie]
                )
                
                if (serieResult.rows.length > 0) {
                  console.log(`  ✅ Encontrada pela série extraída "${serie}":`, serieResult.rows[0])
                  break
                }
              }
            }
            
            // Estratégia 5: Tentar extrair RG (ex: "CJ SANT ANNA 13534" -> RG "13534")
            const possiveisRGs = animal.mae.match(/\d{4,}/g)
            if (possiveisRGs && possiveisRGs.length > 0) {
              console.log(`  🔍 Tentando RGs extraídos: ${possiveisRGs.join(', ')}`)
              
              for (const rg of possiveisRGs) {
                const rgResult = await query(
                  `SELECT id, serie, rg, nome FROM animais WHERE rg = $1 AND serie LIKE 'CJCJ%' LIMIT 1`,
                  [rg]
                )
                
                if (rgResult.rows.length > 0) {
                  console.log(`  ✅ Encontrada pelo RG extraído "${rg}":`, rgResult.rows[0])
                  break
                }
              }
            }
            
            if (maeResult.rows.length === 0) {
              console.log(`  ❌ Mãe não encontrada por nenhuma estratégia`)
            }
          }
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

testBuscarPaisMelhorado()
