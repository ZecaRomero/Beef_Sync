/**
 * Script para corrigir os dados da mãe MANERA SANT ANNA
 * Atualiza serie_mae e rg_mae para CJCJ 16013
 */
require('dotenv').config()
const { query } = require('../lib/database')

async function corrigirMae() {
  try {
    console.log('🔧 Corrigindo dados da mãe MANERA SANT ANNA...\n')
    
    // Buscar todos os animais que têm MANERA SANT ANNA como mãe
    const animais = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
       FROM animais
       WHERE UPPER(mae) LIKE '%MANERA%SANT%ANNA%'
          OR UPPER(mae) LIKE '%MANERA%16013%'`
    )
    
    console.log(`📋 Encontrados ${animais.rows.length} animais com MANERA SANT ANNA como mãe\n`)
    
    if (animais.rows.length === 0) {
      console.log('ℹ️ Nenhum animal encontrado')
      process.exit(0)
    }
    
    // Atualizar cada animal
    for (const animal of animais.rows) {
      console.log(`🔄 Atualizando ${animal.serie} ${animal.rg}...`)
      console.log(`   Mãe atual: ${animal.mae}`)
      console.log(`   Série Mãe atual: ${animal.serie_mae || 'Não informado'}`)
      console.log(`   RG Mãe atual: ${animal.rg_mae || 'Não informado'}`)
      
      await query(
        `UPDATE animais 
         SET serie_mae = 'CJCJ', rg_mae = '16013'
         WHERE id = $1`,
        [animal.id]
      )
      
      console.log(`   ✅ Atualizado: serie_mae = 'CJCJ', rg_mae = '16013'\n`)
    }
    
    console.log('✅ Correção concluída!')
    console.log('\n💡 Agora as coletas FIV da MANERA SANT ANNA (CJCJ 16013) aparecerão na ficha dos filhos!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

corrigirMae()
