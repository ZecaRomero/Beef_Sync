/**
 * Script para verificar os dados da mÃ£e da CJCJ 17037
 */
const { query } = require('../lib/database')

async function verificarMae() {
  try {
    console.log('ðÅ¸â€�� Verificando dados da CJCJ 17037...\n')
    
    // Buscar animal
    const animal = await query(
      `SELECT id, serie, rg, nome, mae, serie_mae, rg_mae
       FROM animais
       WHERE serie = 'CJCJ' AND rg = '17037'
       LIMIT 1`
    )
    
    if (animal.rows.length === 0) {
      console.log('â�Å’ Animal CJCJ 17037 nÃ£o encontrado')
      process.exit(1)
    }
    
    const a = animal.rows[0]
    console.log('ðÅ¸â€œâ€¹ Dados do animal:')
    console.log(`   ID: ${a.id}`)
    console.log(`   SÃ©rie: ${a.serie}`)
    console.log(`   RG: ${a.rg}`)
    console.log(`   Nome: ${a.nome || 'NÃ£o informado'}`)
    console.log(`   MÃ£e: ${a.mae || 'NÃ£o informado'}`)
    console.log(`   SÃ©rie MÃ£e: ${a.serie_mae || 'NÃ£o informado'}`)
    console.log(`   RG MÃ£e: ${a.rg_mae || 'NÃ£o informado'}`)
    
    // Buscar coletas por nome da mÃ£e
    console.log('\nðÅ¸â€�� Buscando coletas por nome "MANERA SANT ANNA"...')
    const coletas1 = await query(
      `SELECT COUNT(*) as total, doadora_nome
       FROM coleta_fiv
       WHERE UPPER(doadora_nome) LIKE '%MANERA%'
       GROUP BY doadora_nome`
    )
    console.log(`   Encontradas: ${coletas1.rows.length} variaÃ§Ãµes`)
    coletas1.rows.forEach(row => {
      console.log(`   - "${row.doadora_nome}": ${row.total} coletas`)
    })
    
    // Buscar coletas por CJCJ 16013
    console.log('\nðÅ¸â€�� Buscando coletas por "CJCJ 16013"...')
    const coletas2 = await query(
      `SELECT COUNT(*) as total
       FROM coleta_fiv
       WHERE UPPER(doadora_nome) LIKE '%CJCJ%16013%'`
    )
    console.log(`   Encontradas: ${coletas2.rows[0]?.total || 0} coletas`)
    
    // Verificar se precisa atualizar os campos serie_mae e rg_mae
    if (!a.serie_mae || !a.rg_mae) {
      console.log('\nâÅ¡ ï¸� PROBLEMA IDENTIFICADO:')
      console.log('   Os campos serie_mae e rg_mae nÃ£o estÃ£o preenchidos!')
      console.log('   A busca de coletas FIV usa esses campos quando disponÃ­veis.')
      console.log('\nðÅ¸â€™¡ SOLUÃâ€¡ÃÆ’O:')
      console.log('   Execute o seguinte comando SQL para corrigir:')
      console.log(`   UPDATE animais SET serie_mae = 'CJCJ', rg_mae = '16013' WHERE id = ${a.id};`)
    } else {
      console.log('\nâÅ“â€¦ Campos serie_mae e rg_mae estÃ£o preenchidos corretamente')
    }
    
    console.log('\nâÅ“â€¦ VerificaÃ§Ã£o concluÃ­da!')
    process.exit(0)
  } catch (error) {
    console.error('â�Å’ Erro:', error)
    process.exit(1)
  }
}

verificarMae()
