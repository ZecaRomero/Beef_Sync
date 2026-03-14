/**
 * Script para corrigir os dados da mÃ£e MANERA SANT ANNA
 * Atualiza serie_mae e rg_mae para CJCJ 16013
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function corrigirMae() {
  try {
    console.log('ðÅ¸â€�§ Corrigindo dados da mÃ£e MANERA SANT ANNA...\n')
    
    // Buscar todos os animais que tÃªm MANERA SANT ANNA como mÃ£e
    const animais = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
       FROM animais
       WHERE UPPER(mae) LIKE '%MANERA%SANT%ANNA%'
          OR UPPER(mae) LIKE '%MANERA%16013%'`
    )
    
    console.log(`ðÅ¸â€œâ€¹ Encontrados ${animais.rows.length} animais com MANERA SANT ANNA como mÃ£e\n`)
    
    if (animais.rows.length === 0) {
      console.log('ââ€ž¹ï¸� Nenhum animal encontrado')
      process.exit(0)
    }
    
    // Atualizar cada animal
    for (const animal of animais.rows) {
      console.log(`ðÅ¸â€�â€ž Atualizando ${animal.serie} ${animal.rg}...`)
      console.log(`   MÃ£e atual: ${animal.mae}`)
      console.log(`   SÃ©rie MÃ£e atual: ${animal.serie_mae || 'NÃ£o informado'}`)
      console.log(`   RG MÃ£e atual: ${animal.rg_mae || 'NÃ£o informado'}`)
      
      await query(
        `UPDATE animais 
         SET serie_mae = 'CJCJ', rg_mae = '16013'
         WHERE id = $1`,
        [animal.id]
      )
      
      console.log(`   âÅ“â€¦ Atualizado: serie_mae = 'CJCJ', rg_mae = '16013'\n`)
    }
    
    console.log('âÅ“â€¦ CorreÃ§Ã£o concluÃ­da!')
    console.log('\nðÅ¸â€™¡ Agora as coletas FIV da MANERA SANT ANNA (CJCJ 16013) aparecerÃ£o na ficha dos filhos!')
    process.exit(0)
  } catch (error) {
    console.error('â�Å’ Erro:', error)
    process.exit(1)
  }
}

corrigirMae()
