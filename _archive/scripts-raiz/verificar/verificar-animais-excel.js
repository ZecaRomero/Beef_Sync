/**
 * Script para verificar quais animais do Excel existem no banco de dados
 */
const { query } = require('./lib/database')

const animaisExcel = [
  { serie: 'CJCJ', rg: '15521' },
  { serie: 'CJCJ', rg: '15524' },
  { serie: 'CJCJ', rg: '15540' },
  { serie: 'CJCJ', rg: '15542' },
  { serie: 'CJCJ', rg: '15563' },
  { serie: 'CJCJ', rg: '15639' },
  { serie: 'CJCJ', rg: '15921' },
  { serie: 'CJCJ', rg: '15930' },
  { serie: 'CJCJ', rg: '15959' },
  { serie: 'CJCJ', rg: '16984' },
  { serie: 'CJCJ', rg: '16990' },
  { serie: 'CJCJ', rg: '16998' },
  { serie: 'CJCJ', rg: '17078' },
  { serie: 'CJCJ', rg: '17207' },
  { serie: 'CJCJ', rg: '17215' },
  { serie: 'CJCJ', rg: '17217' },
  { serie: 'CJCJ', rg: '17228' },
  { serie: 'CJCJ', rg: '17231' },
  { serie: 'CJCJ', rg: '17232' },
  { serie: 'CJCJ', rg: '17259' },
  { serie: 'CJCJ', rg: '17414' },
  { serie: 'CJCJ', rg: '17436' },
  { serie: 'CJCJ', rg: '17476' },
  { serie: 'EAOB', rg: '6684' },
  { serie: 'MFBN', rg: '9851' }
]

async function verificarAnimais() {
  console.log('≈∏‚Äùç Verificando animais do Excel no banco de dados...\n')
  
  let encontrados = 0
  let naoEncontrados = []
  
  for (const animal of animaisExcel) {
    try {
      const result = await query(
        `SELECT id, serie, rg, piquete_atual 
         FROM animais 
         WHERE UPPER(TRIM(serie)) = UPPER(TRIM($1)) 
         AND UPPER(TRIM(rg)) = UPPER(TRIM($2))
         LIMIT 1`,
        [animal.serie, animal.rg]
      )
      
      if (result.rows.length > 0) {
        encontrados++
        const animalDb = result.rows[0]
        console.log(`‚≈ì‚Ä¶ ${animal.serie} ${animal.rg} - ID: ${animalDb.id}, Piquete: ${animalDb.piquete_atual || '(sem piquete)'}`)
      } else {
        naoEncontrados.push(animal)
        console.log(`‚ù≈í ${animal.serie} ${animal.rg} - N√∆íO ENCONTRADO`)
      }
    } catch (error) {
      console.error(`‚≈°†Ô∏è Erro ao buscar ${animal.serie} ${animal.rg}:`, error.message)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`≈∏‚Äú≈† RESUMO:`)
  console.log(`   Total no Excel: ${animaisExcel.length}`)
  console.log(`   Encontrados: ${encontrados}`)
  console.log(`   N√£o encontrados: ${naoEncontrados.length}`)
  
  if (naoEncontrados.length > 0) {
    console.log('\n‚ù≈í ANIMAIS N√∆íO ENCONTRADOS NO BANCO:')
    naoEncontrados.forEach(a => {
      console.log(`   ‚‚Ç¨¢ ${a.serie} ${a.rg}`)
    })
    
    console.log('\n≈∏‚Äô° POSS√çVEIS CAUSAS:')
    console.log('   1. Animal n√£o foi cadastrado no sistema')
    console.log('   2. S√©rie ou RG est√° diferente no banco (espa√ßos, mai√∫sculas/min√∫sculas)')
    console.log('   3. Animal foi exclu√≠do do banco de dados')
  }
  
  console.log('='.repeat(60))
  
  process.exit(0)
}

verificarAnimais().catch(error => {
  console.error('‚ù≈í Erro fatal:', error)
  process.exit(1)
})
